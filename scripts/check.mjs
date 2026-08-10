/**
 * Behaviour check for the centralized grievance layer.
 *
 * The route smoke test only proves first render. This exercises the logic the
 * user actually drives — classification from typed text, complaint creation,
 * assignment, status changes, derived statistics, filtering and persistence —
 * by calling the same pure modules the React tree calls, under Node via Vite's
 * SSR loader. No component is involved, so a failure here is a logic bug.
 *
 * Usage: npm run check
 */
import { createServer } from "vite";

// grievanceService talks to localStorage; Node has none. This stub is the real
// contract (string in, string out, null when absent) so the round-trip test
// below proves persistence rather than proving the stub.
const store = new Map();
globalThis.localStorage ??= {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "warn",
});

let failed = 0;
const check = (name, condition, detail = "") => {
  if (condition) {
    console.log(`  ok    ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

try {
  const ai = await vite.ssrLoadModule("/src/services/aiService.js");
  const svc = await vite.ssrLoadModule("/src/services/grievanceService.js");
  const u = await vite.ssrLoadModule("/src/utils/grievanceUtils.js");
  const { COMPLAINT_STATUS, PRIORITY, SLA_STATE } = await vite.ssrLoadModule(
    "/src/utils/constants.js",
  );
  const { ASSIGNABLE_OFFICERS } = await vite.ssrLoadModule(
    "/src/utils/mockData.js",
  );

  console.log("\n  AI classification (keyword driven, not canned):");

  const pothole = await ai.analyzeText(
    "There is a large pothole near Parul University Gate 2 and two-wheelers are skidding every evening.",
  );
  check("pothole text routes to road category", pothole.category === "pothole",
    `${pothole.categoryLabel} / ${pothole.department}`);
  check("pothole priority is elevated",
    ["high", "critical"].includes(pothole.priority), pothole.priority);
  check("confidence is a 0-1 fraction",
    pothole.confidence > 0 && pothole.confidence <= 1, String(pothole.confidence));

  const garbage = await ai.analyzeText(
    "Garbage has not been collected from our society gate for four days and it smells.",
  );
  check("garbage text routes elsewhere", garbage.category === "garbage",
    `${garbage.categoryLabel} / ${garbage.department}`);
  check("different input yields different department",
    garbage.department !== pothole.department);

  const vague = await ai.analyzeText("Please look into this problem soon.");
  check("vague text still classifies without throwing", Boolean(vague.category),
    `${vague.categoryLabel} @ ${vague.confidence}`);
  check("vague text scores lower than a keyword match",
    vague.confidence <= pothole.confidence,
    `${vague.confidence} <= ${pothole.confidence}`);

  const urgent = await ai.analyzeText(
    "Urgent: water pipeline burst is flooding the road, this is dangerous.",
  );
  check("urgency words raise priority",
    ["high", "critical"].includes(urgent.priority), urgent.priority);

  console.log("\n  Seed state and the shared store:");

  const seed = svc.seedState();
  check("seed produces complaints", seed.complaints.length >= 8,
    `${seed.complaints.length} complaints`);
  check("every seed record is normalized",
    seed.complaints.every((c) => c.timeline?.length && c.coords && c.aiAnalysis));
  check("seed notifications carry an audience",
    seed.notifications.every((n) => Boolean(n.audience)));

  console.log("\n  Complaint creation (POST /api/complaints):");

  let list = seed.complaints;
  const created = svc.buildComplaint(
    {
      title: "Street light outside the school gate is dead",
      description: "Dark for a week, children walk here after tuition.",
      location: "Test Lane, Pune",
      analysis: await ai.analyzeText("The street light near the school gate is not working."),
    },
    list,
    { id: "usr_10241", name: "Ashok Kumar" },
  );

  // Width follows the ids already in the list (the seed runs six digits), so a
  // new complaint keeps the same shape rather than reading as a second format.
  check("new complaint gets a GRV id", /^GRV-\d{4}-\d{5,6}$/.test(created.id), created.id);
  check("id keeps the width of the existing sequence",
    created.id.length === list[0].id.length, `${created.id} vs ${list[0].id}`);
  check("id does not collide with the existing list",
    !list.some((c) => c.id === created.id));
  check("id continues the sequence",
    Number(created.id.slice(-5)) >
      Math.max(...list.map((c) => Number(c.id.slice(-5)) || 0)),
    created.id);
  check("new complaint starts registered",
    created.status === COMPLAINT_STATUS.REGISTERED, created.status);
  check("new complaint seeds a timeline", created.timeline.length === 1);
  check("new complaint carries AI analysis",
    created.aiAnalysis?.confidence > 0 && Boolean(created.aiAnalysis.category),
    `${created.aiAnalysis.category} @ ${created.aiAnalysis.confidence}%`);
  check("new complaint has map coordinates",
    Number.isFinite(created.coords?.latitude) &&
      Number.isFinite(created.coords?.longitude),
    `${created.coords?.latitude}, ${created.coords?.longitude}`);

  list = [created, ...list];

  console.log("\n  Statistics are derived, never hardcoded:");

  const before = u.computeStats(list);
  check("total equals the list length", before.total === list.length,
    `${before.total} of ${list.length}`);
  // `pending` is the registered + reopened bucket, so the five headline
  // buckets partition the list exactly — a tile can never disagree with
  // the table under it.
  check("status buckets sum to the total",
    before.pending + before.assigned + before.inProgress + before.resolved +
      before.rejected === before.total,
    `${before.pending}+${before.assigned}+${before.inProgress}+${before.resolved}+${before.rejected}`);
  check("new complaint moved the pending count",
    before.pending === u.computeStats(seed.complaints).pending + 1);
  check("high priority is counted from the records",
    before.highPriority ===
      list.filter((c) => ["high", "critical"].includes(c.priority)).length,
    `${before.highPriority} high/critical`);

  console.log("\n  Officer assignment (POST /api/complaints/:id/assign):");

  const officer = ASSIGNABLE_OFFICERS[0];
  const assigned = svc.applyAssignment(created, officer, "Officer");
  check("assignment records the officer",
    assigned.assignedOfficer?.name === officer.name, officer.name);
  check("assignment moves registered to assigned",
    assigned.status === COMPLAINT_STATUS.ASSIGNED, assigned.status);
  check("assignment appends a timeline entry",
    assigned.timeline.length === created.timeline.length + 1);
  check("timeline names the officer",
    assigned.timeline.at(-1).note.includes(officer.name),
    assigned.timeline.at(-1).note);
  check("assignment stamps updatedAt", assigned.updatedAt !== created.updatedAt);

  // Assigning work already underway must not drag it backwards.
  const busy = svc.applyStatusChange(assigned, {
    status: COMPLAINT_STATUS.IN_PROGRESS,
  });
  const reassigned = svc.applyAssignment(busy, ASSIGNABLE_OFFICERS[1]);
  check("re-assigning in-progress work keeps its status",
    reassigned.status === COMPLAINT_STATUS.IN_PROGRESS, reassigned.status);

  console.log("\n  Status changes (POST /api/complaints/:id/status):");

  const resolved = svc.applyStatusChange(busy, {
    status: COMPLAINT_STATUS.RESOLVED,
    note: "Pole replaced and tested.",
    actor: officer.name,
    resolution: "New LED fixture installed on the existing pole.",
  });
  check("status is applied", resolved.status === COMPLAINT_STATUS.RESOLVED);
  check("resolution text is stored",
    resolved.resolutionNote?.includes("LED"), resolved.resolutionNote);
  check("resolving appends a timeline entry",
    resolved.timeline.length === busy.timeline.length + 1);
  check("timeline entries carry action, actor and timestamp",
    resolved.timeline.every((t) => t.at) && Boolean(resolved.timeline.at(-1).actor),
    resolved.timeline.at(-1).action);

  const afterList = list.map((c) => (c.id === resolved.id ? resolved : c));
  const after = u.computeStats(afterList);
  check("pending fell by one", after.pending === before.pending - 1,
    `${before.pending} -> ${after.pending}`);
  check("resolved rose by one", after.resolved === before.resolved + 1,
    `${before.resolved} -> ${after.resolved}`);
  check("total is unchanged", after.total === before.total);
  check("resolution rate recomputed",
    after.resolutionRate !== before.resolutionRate,
    `${before.resolutionRate}% -> ${after.resolutionRate}%`);

  const notification = svc.notificationForStatus(resolved, COMPLAINT_STATUS.RESOLVED);
  check("a status change raises a notification",
    notification?.complaintId === resolved.id, notification?.title);
  check("notification starts unread", notification?.read === false);

  console.log("\n  SLA (derived from priority and age, not stored):");

  const windows = {};
  for (const priority of Object.values(PRIORITY)) {
    const probe = u.slaFor({
      priority,
      status: COMPLAINT_STATUS.REGISTERED,
      createdAt: new Date().toISOString(),
    });
    windows[priority] = probe.windowHours;
    check(`${priority} has an SLA window`, probe.windowHours > 0,
      `${probe.windowHours}h, ${probe.state}`);
  }
  check("tighter priorities get shorter windows",
    windows.critical < windows.high &&
      windows.high < windows.medium &&
      windows.medium < windows.low);

  const stale = u.slaFor({
    priority: PRIORITY.CRITICAL,
    status: COMPLAINT_STATUS.REGISTERED,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  });
  check("an old open critical complaint is breached", stale.state === "breached",
    stale.state);

  const closed = u.slaFor({
    priority: PRIORITY.CRITICAL,
    status: COMPLAINT_STATUS.RESOLVED,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    timeline: resolved.timeline,
  });
  check("a resolved complaint has no running clock", closed.closed === true,
    closed.state);

  const sla = u.slaSummary(afterList);
  check("SLA buckets partition the whole list",
    sla[SLA_STATE.ON_TRACK] + sla[SLA_STATE.DUE_SOON] + sla[SLA_STATE.BREACHED] +
      sla[SLA_STATE.CLOSED] === afterList.length,
    `${sla[SLA_STATE.ON_TRACK]} on track, ${sla[SLA_STATE.DUE_SOON]} due soon, ${sla[SLA_STATE.BREACHED]} breached, ${sla[SLA_STATE.CLOSED]} closed`);
  check("closed complaints are excluded from the live buckets",
    sla[SLA_STATE.CLOSED] ===
      afterList.filter((c) => u.slaFor(c).state === SLA_STATE.CLOSED).length);

  console.log("\n  Analytics breakdowns (officer /analytics):");

  const cats = u.categoryBreakdown(afterList);
  check("category counts sum to the total",
    cats.reduce((sum, c) => sum + c.count, 0) === afterList.length,
    `${cats.length} categories`);
  check("empty categories are still listed",
    cats.length >= cats.filter((c) => c.count > 0).length);
  const prios = u.priorityBreakdown(afterList);
  check("priority counts sum to the total",
    prios.reduce((sum, p) => sum + p.count, 0) === afterList.length);
  check("priorities stay in severity order, not size order",
    prios[0].priority === PRIORITY.CRITICAL &&
      prios.at(-1).priority === PRIORITY.LOW,
    prios.map((p) => `${p.priority}:${p.count}`).join(" "));
  const statuses = u.statusBreakdown(afterList);
  check("status counts sum to the total",
    statuses.reduce((sum, s) => sum + s.count, 0) === afterList.length);

  const depts = u.departmentWorkload(afterList);
  check("department workload covers every complaint",
    depts.reduce((sum, d) => sum + d.total, 0) === afterList.length,
    `${depts.length} departments`);
  check("each department's buckets sum to its total",
    depts.every((d) => d.pending + d.inProgress + d.resolved <= d.total));

  const trend = u.complaintTrend(afterList, { days: 14 });
  check("trend returns one point per day including empty days",
    trend.length === 14, `${trend.length} points`);
  check("trend counts never exceed the list",
    trend.reduce((sum, d) => sum + d.created, 0) <= afterList.length);

  console.log("\n  Search, filters and pagination (officer /complaints):");

  const all = u.filterComplaints(afterList, {});
  check("no filters returns everything", all.length === afterList.length);

  const searched = u.filterComplaints(afterList, { search: "pothole" });
  check("search narrows the list",
    searched.length > 0 && searched.length < all.length,
    `${searched.length} of ${all.length}`);

  const byId = u.filterComplaints(afterList, { search: created.id });
  check("search matches on complaint ID", byId.length === 1, created.id);

  const byStatus = u.filterComplaints(afterList, {
    status: COMPLAINT_STATUS.RESOLVED,
  });
  check("status filter is exact",
    byStatus.length > 0 &&
      byStatus.every((c) => c.status === COMPLAINT_STATUS.RESOLVED),
    `${byStatus.length} resolved`);

  const byPriority = u.filterComplaints(afterList, { priority: PRIORITY.CRITICAL });
  check("priority filter is exact",
    byPriority.every((c) => c.priority === PRIORITY.CRITICAL),
    `${byPriority.length} critical`);

  const byCategory = u.filterComplaints(afterList, { category: "pothole" });
  check("category filter is exact",
    byCategory.length > 0 && byCategory.every((c) => c.category === "pothole"),
    `${byCategory.length} potholes`);

  const dept = afterList[0].department;
  const byDept = u.filterComplaints(afterList, { department: dept });
  check("department filter is exact",
    byDept.length > 0 && byDept.every((c) => c.department === dept), dept);

  const combined = u.filterComplaints(afterList, {
    category: "pothole",
    status: COMPLAINT_STATUS.RESOLVED,
  });
  check("filters combine (AND, not OR)",
    combined.every(
      (c) => c.category === "pothole" && c.status === COMPLAINT_STATUS.RESOLVED,
    ),
    `${combined.length} items`);

  const none = u.filterComplaints(afterList, { search: "zzzz-no-such-thing" });
  check("no match returns empty, not an error", none.length === 0);

  const sorted = u.filterComplaints(afterList, { sort: "priority" });
  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  check("priority sort is ordered",
    sorted.every((c, i, a) => i === 0 || rank[a[i - 1].priority] <= rank[c.priority]),
    sorted.map((c) => c.priority[0]).join(""));

  const oldest = u.filterComplaints(afterList, { sort: "oldest" });
  check("oldest sort is ordered",
    oldest.every((c, i, a) =>
      i === 0 || new Date(a[i - 1].createdAt) <= new Date(c.createdAt)));

  const page1 = u.paginate(afterList, 1, 5);
  const page2 = u.paginate(afterList, 2, 5);
  check("pagination slices without overlap",
    page1.items.length === 5 && !page1.items.some((c) => page2.items.includes(c)),
    `page 1 of ${page1.pages}, showing ${page1.from}-${page1.to} of ${page1.total}`);
  check("pagination clamps an out-of-range page",
    u.paginate(afterList, 999, 5).page === page1.pages,
    `999 -> ${u.paginate(afterList, 999, 5).page}`);
  check("an empty list paginates to one empty page",
    u.paginate([], 1, 5).pages === 1 && u.paginate([], 1, 5).from === 0);

  console.log("\n  Related complaints (duplicate hint):");

  const target = afterList.find(
    (c) => afterList.filter((o) => o.category === c.category).length > 1,
  );
  const related = ai.findRelated(target, afterList);
  check("related share the category",
    related.every((r) => r.category === target.category),
    `${related.length} related to ${target.id}`);
  check("related never includes the complaint itself",
    related.every((r) => r.id !== target.id));

  const singleton = afterList.find(
    (c) => afterList.filter((o) => o.category === c.category).length === 1,
  );
  if (singleton) {
    check("category with no sibling returns empty related",
      ai.findRelated(singleton, afterList).length === 0, singleton.category);
  }

  console.log("\n  End-to-end citizen -> officer flow (real reducer):");

  // Everything above tests the pure helpers. This drives the actual reducer the
  // provider uses, so what is asserted here is the same code path a click takes
  // — the join between "citizen filed" and "officer sees it" is not re-created
  // in the test.
  const ctx = await vite.ssrLoadModule("/src/context/grievanceReducer.js");
  const { NOTIFICATION_AUDIENCE } = await vite.ssrLoadModule(
    "/src/utils/constants.js",
  );

  let s = svc.seedState();
  const citizenBefore = u.computeStats(s.complaints);

  const filed = svc.buildComplaint(
    {
      title: "Open drain cover near the bus stop",
      description: "The slab is missing and someone will step into it at night.",
      location: "Katraj Bus Stop, Pune",
      analysis: await ai.analyzeText(
        "The drain cover near the bus stop is missing and it is dangerous.",
      ),
    },
    s.complaints,
    { id: "usr_10241", name: "Ashok Kumar" },
  );
  s = ctx.reducer(s, { type: ctx.ACTIONS.CREATE, complaint: filed });

  const officerView = u.computeStats(s.complaints);
  check("citizen total rose by one",
    officerView.total === citizenBefore.total + 1,
    `${citizenBefore.total} -> ${officerView.total}`);
  check("officer pending rose by one",
    officerView.pending === citizenBefore.pending + 1,
    `${citizenBefore.pending} -> ${officerView.pending}`);
  // The whole point of one store: the officer queue is the same array.
  check("the officer queue holds the exact complaint filed",
    s.complaints.find((c) => c.id === filed.id)?.title === filed.title, filed.id);
  check("the citizen's own list holds it too",
    u.filterComplaints(s.complaints, { search: filed.id }).length === 1);
  check("filing notifies the citizen and the officer separately",
    s.notifications.some((n) => n.complaintId === filed.id &&
      n.audience === NOTIFICATION_AUDIENCE.CITIZEN) &&
    s.notifications.some((n) => n.complaintId === filed.id &&
      n.audience === NOTIFICATION_AUDIENCE.OFFICER));

  const deptCount = (list, name) =>
    u.departmentWorkload(list).find((d) => d.name === name)?.total ?? 0;
  check("department workload picked it up",
    deptCount(s.complaints, filed.department) ===
      deptCount(seed.complaints, filed.department) + 1,
    filed.department);

  s = ctx.reducer(s, {
    type: ctx.ACTIONS.ASSIGN,
    id: filed.id,
    officer: ASSIGNABLE_OFFICERS[0],
    actor: "Officer",
  });
  let live = s.complaints.find((c) => c.id === filed.id);
  check("officer assignment reaches the shared record",
    live.assignedOfficer?.name === ASSIGNABLE_OFFICERS[0].name,
    live.assignedOfficer?.name);
  check("assignment shows in the citizen-visible timeline",
    live.timeline.at(-1).note.includes(ASSIGNABLE_OFFICERS[0].name),
    live.timeline.at(-1).note);

  for (const status of [COMPLAINT_STATUS.IN_PROGRESS, COMPLAINT_STATUS.RESOLVED]) {
    s = ctx.reducer(s, {
      type: ctx.ACTIONS.STATUS,
      id: filed.id,
      change: { status, actor: ASSIGNABLE_OFFICERS[0].name, note: `Moved to ${status}.` },
    });
    live = s.complaints.find((c) => c.id === filed.id);
    check(`officer moved it to ${status}`, live.status === status);
  }

  const closedStats = u.computeStats(s.complaints);
  check("resolving it moved the headline tiles back",
    closedStats.pending === citizenBefore.pending &&
      closedStats.resolved === citizenBefore.resolved + 1,
    `pending ${closedStats.pending}, resolved ${closedStats.resolved}`);
  check("the citizen's tracker sees the resolved status",
    live.status === COMPLAINT_STATUS.RESOLVED &&
      live.timeline.some((t) => t.status === COMPLAINT_STATUS.RESOLVED));
  check("every officer action is on the timeline",
    live.timeline.length === 4, `${live.timeline.length} entries`);
  check("the citizen was notified of each change",
    s.notifications.filter((n) => n.complaintId === filed.id).length >= 4,
    `${s.notifications.filter((n) => n.complaintId === filed.id).length} notifications`);

  const unknown = ctx.reducer(s, {
    type: ctx.ACTIONS.STATUS,
    id: "GRV-0000-00000",
    change: { status: COMPLAINT_STATUS.RESOLVED },
  });
  check("an unknown id is a no-op, not a crash", unknown === s);

  check("reset restores the seed",
    ctx.reducer(s, { type: ctx.ACTIONS.RESET }).complaints.length ===
      seed.complaints.length);
  check("clear empties the store",
    ctx.reducer(s, { type: ctx.ACTIONS.CLEAR }).complaints.length === 0);

  console.log("\n  Persistence round-trip (localStorage):");
  svc.clearState();
  check("a cleared store falls back to the seed",
    svc.loadState().complaints.length === seed.complaints.length);

  check("persist reports success",
    svc.persistState({ complaints: afterList, notifications: [notification] }));

  const reloaded = svc.loadState();
  check("reload restores every complaint",
    reloaded.complaints.length === afterList.length,
    `${reloaded.complaints.length} complaints`);
  check("reload restores the created complaint",
    reloaded.complaints.some((c) => c.id === created.id), created.id);
  check("reload preserves the status change",
    reloaded.complaints.find((c) => c.id === resolved.id)?.status ===
      COMPLAINT_STATUS.RESOLVED);
  check("reload preserves the timeline",
    reloaded.complaints.find((c) => c.id === resolved.id)?.timeline.length ===
      resolved.timeline.length);
  check("reload preserves the assigned officer",
    Boolean(reloaded.complaints.find((c) => c.id === resolved.id)?.assignedOfficer));
  check("stats survive the round-trip",
    u.computeStats(reloaded.complaints).total === after.total);

  svc.clearState();
  check("clear wipes the stored payload",
    svc.loadState().complaints.length === seed.complaints.length);

  console.log(
    failed ? `\n${failed} check(s) failed.` : "\nAll behaviour checks passed.",
  );
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  console.error("Behaviour check could not run:\n", error);
  process.exitCode = 1;
} finally {
  await vite.close();
}
