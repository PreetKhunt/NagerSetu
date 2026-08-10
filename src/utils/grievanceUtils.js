/**
 * Pure grievance derivations.
 *
 * Every number the dashboards show is computed here from the complaint list —
 * there are no stored totals anywhere in the app. Keeping this module free of
 * React and of storage means the same functions serve the citizen pages, the
 * officer pages, the analytics screen and the test harness, and they keep
 * working unchanged when the list starts arriving from FastAPI instead of
 * localStorage.
 */

import {
  CLOSED_STATUSES,
  COMPLAINT_STATUS,
  CATEGORIES,
  DEPARTMENTS,
  PENDING_STATUSES,
  PRIORITY,
  PRIORITY_RANK,
  SLA_DUE_SOON_RATIO,
  SLA_HOURS,
  SLA_STATE,
} from "./constants";
import { CITY_CENTRE, LOCATION_COORDS } from "./mockData";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Stable 0–1 hash so derived jitter is identical on every render. */
function hashUnit(value) {
  let h = 0;
  for (const char of String(value)) h = (h * 31 + char.codePointAt(0)) % 100000;
  return h / 100000;
}

/** Label for a category id, falling back to the id itself. */
export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id ?? "Other";
}

/** Department that owns a category. */
export function departmentFor(id) {
  return CATEGORIES.find((c) => c.id === id)?.dept ?? "Urban Development";
}

/**
 * Coordinates for a complaint.
 *
 * Known demo locations get their mapped point; anything else is scattered
 * deterministically around the city centre from its id, so a newly filed
 * complaint still lands on the map in a stable spot rather than jumping
 * between renders.
 */
export function coordsFor({ id, location }) {
  const known = LOCATION_COORDS[location];
  if (known) return known;
  return {
    latitude: CITY_CENTRE.latitude + (hashUnit(`${id}lat`) - 0.5) * 0.06,
    longitude: CITY_CENTRE.longitude + (hashUnit(`${id}lng`) - 0.5) * 0.06,
    approximate: true,
  };
}

/**
 * Nearest mapped landmark to a point, or null if nothing is close.
 *
 * Used after a geolocation fix so a complaint filed from the street gets a
 * name an officer can act on rather than a pair of decimals. The 2 km cut-off
 * is deliberate: snapping a fix from the next suburb onto a landmark would be
 * a worse lie than showing the raw coordinates.
 */
export function nearestLocation(point, { maxKm = 2 } = {}) {
  let best = null;
  let bestKm = Infinity;

  for (const [name, coords] of Object.entries(LOCATION_COORDS)) {
    // Equirectangular approximation — at city scale the error is metres, and
    // this runs on every geolocation fix.
    const dLat = (coords.latitude - point.latitude) * 111.32;
    const dLng =
      (coords.longitude - point.longitude) *
      111.32 *
      Math.cos((point.latitude * Math.PI) / 180);
    const km = Math.hypot(dLat, dLng);

    if (km < bestKm) {
      bestKm = km;
      best = name;
    }
  }

  return bestKm <= maxKm ? best : null;
}

/**
 * Fill in everything the officer side needs on a record that may predate it.
 *
 * Seed data and anything already persisted from an earlier build go through
 * here on load, so no consumer has to guard against a missing field.
 */
export function normalizeComplaint(raw) {
  const createdAt = raw.createdAt ?? new Date().toISOString();
  const category = raw.category ?? "infrastructure";

  const timeline = (raw.timeline ?? []).map((entry) => ({
    ...entry,
    // Older entries only carried {status, at, note}. `action` and `actor` are
    // what the activity history renders now, so derive them when absent.
    action: entry.action ?? actionLabel(entry.status),
    actor: entry.actor ?? "System",
  }));

  return {
    userId: "usr_10241",
    citizenName: "Ashok Kumar",
    issueType: raw.issueType ?? categoryLabel(category),
    assignedOfficer: null,
    image: null,
    voiceTranscript: null,
    resolutionNote: null,
    resolutionImage: null,
    ...raw,
    category,
    categoryLabel: raw.categoryLabel ?? categoryLabel(category),
    department: raw.department ?? departmentFor(category),
    status: raw.status ?? COMPLAINT_STATUS.REGISTERED,
    priority: raw.priority ?? PRIORITY.MEDIUM,
    createdAt,
    updatedAt: raw.updatedAt ?? createdAt,
    coords: raw.coords ?? coordsFor({ id: raw.id, location: raw.location }),
    aiAnalysis: raw.aiAnalysis ?? {
      category,
      categoryLabel: raw.categoryLabel ?? categoryLabel(category),
      confidence: Math.round((raw.aiConfidence ?? 0.8) * 100),
      suggestedDepartment: raw.department ?? departmentFor(category),
      suggestedPriority: raw.priority ?? PRIORITY.MEDIUM,
      duplicateCount: raw.duplicatesMerged ?? 0,
      summary: raw.summary ?? null,
    },
    timeline,
  };
}

/** Human phrase for a lifecycle step, used in the activity history. */
export function actionLabel(status) {
  return (
    {
      [COMPLAINT_STATUS.REGISTERED]: "Complaint Registered",
      [COMPLAINT_STATUS.ASSIGNED]: "Complaint Assigned",
      [COMPLAINT_STATUS.IN_PROGRESS]: "Work In Progress",
      [COMPLAINT_STATUS.RESOLVED]: "Complaint Resolved",
      [COMPLAINT_STATUS.REJECTED]: "Complaint Rejected",
      [COMPLAINT_STATUS.REOPENED]: "Complaint Reopened",
    }[status] ?? "Status Changed"
  );
}

/**
 * Next id in the GRV-YYYY-NNNNN sequence.
 *
 * Derived from the highest sequence already present rather than a module
 * counter, so ids stay unique across reloads once the list is restored from
 * storage instead of restarting at the seed value and colliding.
 */
export function nextComplaintId(list = [], date = new Date()) {
  const year = date.getFullYear();
  let highest = 0;
  // Width is taken from the ids already in the list rather than fixed, so a new
  // complaint filed alongside the seeded GRV-2026-004812 records gets the same
  // six-digit shape instead of a narrower one that reads as a different format.
  let width = 5;

  for (const complaint of list) {
    const match = /^GRV-(\d{4})-(\d+)$/.exec(complaint.id ?? "");
    if (!match || Number(match[1]) !== year) continue;
    highest = Math.max(highest, Number(match[2]));
    width = Math.max(width, match[2].length);
  }

  return `GRV-${year}-${String(highest + 1).padStart(width, "0")}`;
}

/** One activity entry. Timeline rows are append-only. */
export function timelineEntry({ status, note, actor = "System", action, at }) {
  return {
    status,
    at: at ?? new Date().toISOString(),
    note: note ?? "",
    action: action ?? actionLabel(status),
    actor,
  };
}

/* ==========================================================================
   SLA
   ========================================================================== */

/**
 * SLA position of one complaint.
 *
 * Measured from `createdAt` against the window its priority allows. A closed
 * complaint reports `closed` — it is neither breached nor still counting down,
 * and folding it into either bucket would misstate both.
 */
export function slaFor(complaint, now = Date.now()) {
  const hours = SLA_HOURS[complaint.priority] ?? SLA_HOURS[PRIORITY.MEDIUM];
  const due = new Date(complaint.createdAt).getTime() + hours * HOUR;
  const closed = CLOSED_STATUSES.includes(complaint.status);
  const reference = closed ? new Date(complaint.updatedAt).getTime() : now;
  const remaining = due - reference;

  let state;
  if (remaining < 0) state = SLA_STATE.BREACHED;
  else if (closed) state = SLA_STATE.CLOSED;
  else if (remaining < hours * HOUR * SLA_DUE_SOON_RATIO) state = SLA_STATE.DUE_SOON;
  else state = SLA_STATE.ON_TRACK;

  return { state, dueAt: new Date(due).toISOString(), remainingMs: remaining, windowHours: hours, closed };
}

/** Counts per SLA bucket across a list. */
export function slaSummary(list, now = Date.now()) {
  return list.reduce(
    (acc, c) => {
      acc[slaFor(c, now).state] += 1;
      return acc;
    },
    { [SLA_STATE.ON_TRACK]: 0, [SLA_STATE.DUE_SOON]: 0, [SLA_STATE.BREACHED]: 0, [SLA_STATE.CLOSED]: 0 },
  );
}

/** "2d 4h left" / "6h overdue" for an SLA countdown. */
export function formatRemaining(ms) {
  const overdue = ms < 0;
  const total = Math.abs(ms);
  const days = Math.floor(total / DAY);
  const hours = Math.floor((total % DAY) / HOUR);
  const parts = days ? `${days}d ${hours}h` : `${hours}h`;
  return overdue ? `${parts} overdue` : `${parts} left`;
}

/* ==========================================================================
   Aggregates
   ========================================================================== */

const countWhere = (list, predicate) => list.filter(predicate).length;

/** Every headline figure the dashboards render, derived in one pass. */
export function computeStats(list, now = Date.now()) {
  const sla = slaSummary(list, now);
  const resolved = countWhere(list, (c) => c.status === COMPLAINT_STATUS.RESOLVED);
  const closed = countWhere(list, (c) => CLOSED_STATUSES.includes(c.status));

  return {
    total: list.length,
    pending: countWhere(list, (c) => PENDING_STATUSES.includes(c.status)),
    assigned: countWhere(list, (c) => c.status === COMPLAINT_STATUS.ASSIGNED),
    inProgress: countWhere(list, (c) => c.status === COMPLAINT_STATUS.IN_PROGRESS),
    resolved,
    rejected: countWhere(list, (c) => c.status === COMPLAINT_STATUS.REJECTED),
    reopened: countWhere(list, (c) => c.status === COMPLAINT_STATUS.REOPENED),
    highPriority: countWhere(list, (c) =>
      [PRIORITY.HIGH, PRIORITY.CRITICAL].includes(c.priority)),
    slaBreached: sla[SLA_STATE.BREACHED],
    slaDueSoon: sla[SLA_STATE.DUE_SOON],
    slaOnTrack: sla[SLA_STATE.ON_TRACK],
    // Share of everything filed that reached a terminal state. Null rather
    // than 0 on an empty list, so the UI can say "no data" instead of "0%".
    resolutionRate: list.length ? Math.round((closed / list.length) * 100) : null,
    avgResolutionHours: avgResolutionHours(list),
  };
}

/** Mean hours from registration to resolution across resolved complaints. */
export function avgResolutionHours(list) {
  const spans = list
    .filter((c) => c.status === COMPLAINT_STATUS.RESOLVED)
    .map((c) => {
      const done = c.timeline?.find((t) => t.status === COMPLAINT_STATUS.RESOLVED);
      if (!done) return null;
      return new Date(done.at).getTime() - new Date(c.createdAt).getTime();
    })
    .filter((ms) => ms != null && ms >= 0);

  if (!spans.length) return null;
  return Math.round(spans.reduce((a, b) => a + b, 0) / spans.length / HOUR);
}

/** Counts keyed by an arbitrary field, sorted high to low. */
export function countBy(list, key) {
  const map = new Map();
  for (const item of list) {
    const value = typeof key === "function" ? key(item) : item[key];
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

/** Category distribution over every known category, including empty ones. */
export function categoryBreakdown(list) {
  return CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    count: countWhere(list, (item) => item.category === c.id),
  })).sort((a, b) => b.count - a.count);
}

/** Priority distribution, most severe first rather than largest first. */
export function priorityBreakdown(list) {
  return Object.values(PRIORITY)
    .sort((a, b) => PRIORITY_RANK[b] - PRIORITY_RANK[a])
    .map((priority) => ({
      priority,
      count: countWhere(list, (c) => c.priority === priority),
    }));
}

/** Status distribution in lifecycle order. */
export function statusBreakdown(list) {
  return Object.values(COMPLAINT_STATUS).map((status) => ({
    status,
    count: countWhere(list, (c) => c.status === status),
  }));
}

/**
 * Per-department workload.
 *
 * Every department is listed even at zero — a department that vanishes from
 * the page when its queue empties looks like a bug, and the officer needs to
 * see that it is clear rather than see nothing.
 */
export function departmentWorkload(list, now = Date.now()) {
  return DEPARTMENTS.map((name) => {
    const own = list.filter((c) => c.department === name);
    const stats = computeStats(own, now);
    return {
      name,
      total: own.length,
      pending: stats.pending,
      assigned: stats.assigned,
      inProgress: stats.inProgress,
      resolved: stats.resolved,
      slaBreached: stats.slaBreached,
      resolutionRate: stats.resolutionRate,
    };
  }).sort((a, b) => b.total - a.total);
}

/**
 * Daily complaint counts over a trailing window, oldest first.
 * Days with nothing filed are present at zero so the chart keeps a real time
 * axis instead of silently compressing quiet days out of the series.
 */
export function complaintTrend(list, { days = 14, now = Date.now() } = {}) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: days }, (_, i) => {
    const day = new Date(start.getTime() - (days - 1 - i) * DAY);
    return { date: day.toISOString(), created: 0, resolved: 0 };
  });

  const indexOf = (iso) => {
    const day = new Date(iso);
    day.setHours(0, 0, 0, 0);
    const offset = Math.round((day.getTime() - start.getTime()) / DAY) + days - 1;
    return offset >= 0 && offset < days ? offset : -1;
  };

  for (const complaint of list) {
    const created = indexOf(complaint.createdAt);
    if (created !== -1) buckets[created].created += 1;

    const done = complaint.timeline?.find(
      (t) => t.status === COMPLAINT_STATUS.RESOLVED,
    );
    if (done) {
      const resolved = indexOf(done.at);
      if (resolved !== -1) buckets[resolved].resolved += 1;
    }
  }

  return buckets;
}

/* ==========================================================================
   Filtering and sorting

   Shared by the citizen list and the officer table so the two can never drift
   into filtering the same data differently.
   ========================================================================== */

const time = (value) => new Date(value).getTime();

const SORTERS = {
  recent: (a, b) => time(b.createdAt) - time(a.createdAt),
  oldest: (a, b) => time(a.createdAt) - time(b.createdAt),
  updated: (a, b) => time(b.updatedAt ?? b.createdAt) - time(a.updatedAt ?? a.createdAt),
  priority: (a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0),
};

/** Free-text match across the fields a user would plausibly search by. */
function matchesSearch(complaint, q) {
  if (!q) return true;
  return [
    complaint.id,
    complaint.title,
    complaint.description,
    complaint.location,
    complaint.department,
    complaint.categoryLabel,
    complaint.citizenName,
    complaint.assignedOfficer?.name,
  ]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
}

/** Apply every list filter, then sort. Pure — callers own pagination. */
export function filterComplaints(list, filters = {}) {
  const {
    search = "",
    status = "all",
    category = "all",
    priority = "all",
    department = "all",
    from = "",
    to = "",
    sort = "recent",
  } = filters;

  const q = search.trim().toLowerCase();
  // `to` is an end-of-day bound: a complaint filed at 14:00 on the chosen day
  // must fall inside a range that ends on that day.
  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

  const result = list.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (category !== "all" && c.category !== category) return false;
    if (priority !== "all" && c.priority !== priority) return false;
    if (department !== "all" && c.department !== department) return false;

    const created = time(c.createdAt);
    if (fromTime !== null && created < fromTime) return false;
    if (toTime !== null && created > toTime) return false;

    return matchesSearch(c, q);
  });

  return result.sort(SORTERS[sort] ?? SORTERS.recent);
}

/** Slice one page out of a filtered list. */
export function paginate(list, page, pageSize) {
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    page: current,
    pages,
    total: list.length,
    from: list.length ? start + 1 : 0,
    to: Math.min(start + pageSize, list.length),
  };
}
