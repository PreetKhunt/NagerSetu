/**
 * Grievance persistence — the swap point for the backend.
 *
 * Everything the app knows about complaints and notifications enters and
 * leaves through this module. Today it reads and writes localStorage; when
 * FastAPI exists, each function below becomes an `apiClient` call and nothing
 * above it changes. The signatures are already the shapes the endpoints will
 * have:
 *
 *   loadState()                    ->  GET    /api/complaints  (+ /notifications)
 *   persistState(state)            ->  (drops away — the server is the store)
 *   createComplaint(draft, list)   ->  POST   /api/complaints
 *   patchComplaint(id, changes)    ->  PATCH  /api/complaints/:id
 *   assignComplaint(id, officer)   ->  POST   /api/complaints/:id/assign
 *   changeStatus(id, status, note) ->  POST   /api/complaints/:id/status
 *
 * The reducer in GrievanceContext holds the same records in memory, so reads
 * during a session never touch storage — this is the boundary, not a cache.
 */

import { CITIZEN_COMPLAINTS, NOTIFICATIONS } from "../utils/mockData";
import {
  COMPLAINT_STATUS,
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_TYPES,
  STORAGE_KEYS,
} from "../utils/constants";
import {
  actionLabel,
  coordsFor,
  nextComplaintId,
  normalizeComplaint,
  timelineEntry,
} from "../utils/grievanceUtils";

/** Seed notifications need an audience; older records predate the field. */
const seedNotifications = () =>
  NOTIFICATIONS.map((n) => ({
    ...n,
    audience: n.audience ?? NOTIFICATION_AUDIENCE.CITIZEN,
  }));

/** The state a first-run visitor sees. */
export function seedState() {
  return {
    complaints: CITIZEN_COMPLAINTS.map(normalizeComplaint),
    notifications: seedNotifications(),
  };
}

/**
 * Read persisted state, falling back to the seed.
 *
 * A malformed or half-written payload is discarded rather than partially
 * trusted — a demo that boots with a broken record is worse than one that
 * boots with the samples.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRIEVANCES);
    if (!raw) return seedState();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.complaints)) return seedState();

    return {
      complaints: parsed.complaints.map(normalizeComplaint),
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : seedNotifications(),
    };
  } catch {
    return seedState();
  }
}

/**
 * Mirror state to storage. Failures are non-fatal — the session continues.
 *
 * Attached photos are data URLs, and enough of them will exceed the ~5 MB
 * origin quota. Rather than lose the whole write, the second attempt drops the
 * image payloads and keeps the records: a complaint that reloads without its
 * thumbnail is recoverable, a complaint that vanishes is not.
 */
export function persistState(state) {
  const write = (complaints) =>
    localStorage.setItem(
      STORAGE_KEYS.GRIEVANCES,
      JSON.stringify({ complaints, notifications: state.notifications }),
    );

  try {
    write(state.complaints);
    return true;
  } catch {
    try {
      write(
        state.complaints.map((c) =>
          c.image || c.resolutionImage
            ? { ...c, image: null, resolutionImage: null, imageDropped: true }
            : c,
        ),
      );
      return true;
    } catch {
      // Private browsing can refuse writes outright; the in-memory session is
      // still perfectly usable, so this stays silent rather than throwing.
      return false;
    }
  }
}

/** Wipe persisted grievances. The reducer reseeds from `seedState`. */
export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEYS.GRIEVANCES);
  } catch {
    /* nothing to clean up */
  }
}

/* ==========================================================================
   Record construction

   Pure builders — they return the next record rather than mutating, so the
   reducer stays a one-liner and these stay testable without React.
   ========================================================================== */

/**
 * Build a complaint from what the lodge form collected.
 *
 * `existing` is passed in so the id continues the real sequence rather than a
 * counter that would reset on reload and start colliding.
 */
export function buildComplaint(draft, existing = [], citizen = {}) {
  const now = new Date().toISOString();
  const analysis = draft.analysis ?? {};
  const id = nextComplaintId(existing);
  const location = draft.location || analysis.location || "Location not specified";

  return normalizeComplaint({
    id,
    userId: citizen.id ?? "usr_10241",
    citizenName: citizen.name ?? "Ashok Kumar",
    title: draft.title || analysis.issue || "Civic issue reported",
    description: draft.description ?? "",
    category: analysis.category ?? "infrastructure",
    categoryLabel: analysis.categoryLabel,
    issueType: analysis.issue,
    department: analysis.department,
    status: COMPLAINT_STATUS.REGISTERED,
    priority: analysis.priority,
    location,
    coords: draft.coords ?? coordsFor({ id, location }),
    createdAt: now,
    updatedAt: now,
    aiConfidence: analysis.confidence ?? 0.8,
    language: analysis.language ?? "English",
    hasImage: Boolean(draft.image || draft.imageName),
    imageName: draft.imageName ?? null,
    image: draft.image ?? null,
    isVoice: draft.mode === "voice",
    voiceTranscript: draft.voiceTranscript ?? null,
    duplicatesMerged: 0,
    aiAnalysis: {
      category: analysis.category ?? "infrastructure",
      categoryLabel: analysis.categoryLabel ?? null,
      confidence: Math.round((analysis.confidence ?? 0.8) * 100),
      suggestedDepartment: analysis.department ?? null,
      suggestedPriority: analysis.priority ?? null,
      duplicateCount: 0,
      summary: analysis.summary ?? null,
      matchedKeywords: analysis.matchedKeywords ?? [],
      escalated: Boolean(analysis.escalated),
    },
    timeline: [
      timelineEntry({
        status: COMPLAINT_STATUS.REGISTERED,
        note: draft.mode === "voice"
          ? "Voice complaint transcribed and classified"
          : "Complaint received and classified by AI",
        actor: citizen.name ?? "Citizen",
      }),
    ],
  });
}

/** Apply a status change, appending the activity row it implies. */
export function applyStatusChange(complaint, { status, note, actor, resolution, resolutionImage }) {
  const now = new Date().toISOString();

  return {
    ...complaint,
    status,
    updatedAt: now,
    resolutionNote: status === COMPLAINT_STATUS.RESOLVED
      ? resolution || complaint.resolutionNote
      : complaint.resolutionNote,
    resolutionImage: status === COMPLAINT_STATUS.RESOLVED
      ? resolutionImage ?? complaint.resolutionImage
      : complaint.resolutionImage,
    timeline: [
      ...complaint.timeline,
      timelineEntry({
        status,
        at: now,
        actor: actor ?? "Officer",
        action: actionLabel(status),
        note: note || defaultNote(status),
      }),
    ],
  };
}

/** Apply an assignment, appending the activity row it implies. */
export function applyAssignment(complaint, officer, actor = "Officer") {
  const now = new Date().toISOString();

  return {
    ...complaint,
    assignedOfficer: officer,
    department: officer.department ?? complaint.department,
    // Assigning something still sitting in the pending queue moves it forward;
    // assigning work already in progress must not drag it backwards.
    status: complaint.status === COMPLAINT_STATUS.REGISTERED
      ? COMPLAINT_STATUS.ASSIGNED
      : complaint.status,
    updatedAt: now,
    timeline: [
      ...complaint.timeline,
      timelineEntry({
        status: COMPLAINT_STATUS.ASSIGNED,
        at: now,
        actor,
        action: "Complaint Assigned",
        note: `Complaint assigned to ${officer.name}.`,
      }),
    ],
  };
}

function defaultNote(status) {
  return {
    [COMPLAINT_STATUS.ASSIGNED]: "Routed to the owning department.",
    [COMPLAINT_STATUS.IN_PROGRESS]: "Field work has started on site.",
    [COMPLAINT_STATUS.RESOLVED]: "Work completed and verified.",
    [COMPLAINT_STATUS.REJECTED]: "Closed after review.",
    [COMPLAINT_STATUS.REOPENED]: "Reopened for further work.",
  }[status] ?? "Status updated.";
}

/* ==========================================================================
   Notifications
   ========================================================================== */

let notificationSeq = 0;

/** Notification for a lifecycle event, addressed to one audience. */
export function buildNotification({ complaint, type, title, message, audience }) {
  notificationSeq += 1;
  return {
    id: `ntf_${Date.now().toString(36)}_${notificationSeq}`,
    type: type ?? NOTIFICATION_TYPES.INFO,
    title,
    message,
    complaintId: complaint?.id ?? null,
    audience: audience ?? NOTIFICATION_AUDIENCE.CITIZEN,
    at: new Date().toISOString(),
    read: false,
  };
}

/** The notification a status change should raise, or null if it warrants none. */
export function notificationForStatus(complaint, status) {
  const map = {
    [COMPLAINT_STATUS.ASSIGNED]: {
      type: NOTIFICATION_TYPES.ASSIGNED,
      title: `Complaint ${complaint.id} has been assigned`,
      message: `${complaint.title} was routed to ${complaint.department}.`,
    },
    [COMPLAINT_STATUS.IN_PROGRESS]: {
      type: NOTIFICATION_TYPES.PROGRESS,
      title: `Complaint ${complaint.id} is now In Progress`,
      message: `An officer has started working on ${complaint.title}.`,
    },
    [COMPLAINT_STATUS.RESOLVED]: {
      type: NOTIFICATION_TYPES.RESOLVED,
      title: `Complaint ${complaint.id} has been resolved`,
      message: `${complaint.title} was marked resolved. You can reopen it if the problem persists.`,
    },
    [COMPLAINT_STATUS.REJECTED]: {
      type: NOTIFICATION_TYPES.INFO,
      title: `Complaint ${complaint.id} was closed`,
      message: `${complaint.title} was closed after review.`,
    },
    [COMPLAINT_STATUS.REOPENED]: {
      type: NOTIFICATION_TYPES.INFO,
      title: `Complaint ${complaint.id} was reopened`,
      message: `${complaint.title} is back in the queue.`,
    },
  };

  const spec = map[status];
  return spec ? buildNotification({ complaint, ...spec }) : null;
}
