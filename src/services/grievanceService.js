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

import apiClient from "./apiClient";
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

/**
 * Fetch complaints from FastAPI backend.
 */
export async function fetchComplaintsFromApi() {
  try {
    const res = await apiClient.get("/complaints", { params: { limit: 100 } });
    if (res.data?.items && Array.isArray(res.data.items)) {
      return res.data.items.map((c) =>
        normalizeComplaint({
          id: c.id,
          userId: c.user_id,
          citizenName: c.citizen_name,
          title: c.title,
          description: c.description,
          category: c.category,
          categoryLabel: c.category_label,
          department: c.department,
          priority: c.priority,
          status: c.status,
          location: c.location,
          coords:
            c.latitude && c.longitude
              ? { latitude: c.latitude, longitude: c.longitude }
              : null,
          image: c.image_url,
          isVoice: c.is_voice,
          voiceTranscript: c.voice_transcript,
          aiConfidence: c.ai_confidence,
          resolutionNote: c.resolution_note,
          resolutionImage: c.resolution_image_url,
          assignedOfficer: c.assigned_officer ? { name: c.assigned_officer } : null,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })
      );
    }
  } catch (err) {
    console.warn("Backend API offline or unreachable, using local state:", err.message);
  }
  return null;
}

/**
 * Send create complaint payload to FastAPI backend.
 */
export async function createComplaintApi(draft, citizen) {
  const analysis = draft.analysis ?? {};

  const cleanDescription = String(draft.description || "").trim();
  const derivedTitle = (
    draft.title ||
    analysis.issue ||
    (cleanDescription.length > 0
      ? cleanDescription.length > 50
        ? cleanDescription.substring(0, 47) + "..."
        : cleanDescription
      : "Civic issue reported")
  ).trim();
  const cleanTitle = derivedTitle.length > 0 ? derivedTitle : "Civic issue reported";
  const cleanLocation = String(draft.location || analysis.location || "Location not specified").trim();
  const cleanPriority = String(analysis.priority || "medium").toLowerCase();

  const payload = {
    user_id: citizen?.id ?? "usr_10241",
    citizen_name: citizen?.name ?? "Ashok Kumar",
    title: cleanTitle.length > 0 ? cleanTitle : "Civic issue reported",
    description: cleanDescription.length > 0 ? cleanDescription : "No detailed description provided.",
    category: String(analysis.category || "infrastructure").toLowerCase(),
    category_label: analysis.categoryLabel ?? null,
    department: String(analysis.department || "Urban Development"),
    priority: ["low", "medium", "high", "critical"].includes(cleanPriority) ? cleanPriority : "medium",
    location: cleanLocation.length > 0 ? cleanLocation : "Location not specified",
    latitude: draft.coords?.latitude ?? null,
    longitude: draft.coords?.longitude ?? null,
    image_url: draft.image ?? null,
    is_voice: draft.mode === "voice",
    voice_transcript: draft.voiceTranscript ?? null,
    ai_confidence: analysis.confidence ?? 0.8,
  };

  try {
    const res = await apiClient.post("/complaints", payload);
    if (res.data) {
      return normalizeComplaint({
        id: res.data.id,
        userId: res.data.user_id,
        citizenName: res.data.citizen_name,
        title: res.data.title,
        description: res.data.description,
        category: res.data.category,
        categoryLabel: res.data.category_label,
        department: res.data.department,
        priority: res.data.priority,
        status: res.data.status,
        location: res.data.location,
        createdAt: res.data.created_at,
        updatedAt: res.data.updated_at,
        image: res.data.image_url,
        isVoice: res.data.is_voice,
        voiceTranscript: res.data.voice_transcript,
        aiAnalysis: {
          category: res.data.category,
          categoryLabel: res.data.category_label,
          confidence: Math.round((res.data.ai_confidence ?? 0.8) * 100),
          suggestedDepartment: res.data.department,
          suggestedPriority: res.data.priority,
          duplicateCount: 0,
        },
      });
    }
  } catch (err) {
    console.error("Failed to save complaint on backend API:", err);
  }
  return null;
}

/**
 * Update complaint status on FastAPI backend.
 */
export async function updateStatusApi(id, change) {
  try {
    await apiClient.patch(`/complaints/${id}/status`, {
      status: change.status,
      note: change.note,
      actor: change.actor,
      resolution_note: change.resolution,
      resolution_image_url: change.resolutionImage,
    });
  } catch (err) {
    console.warn(`Failed to update status for ${id} on API:`, err.message);
  }
}

/**
 * Assign complaint to officer on FastAPI backend.
 */
export async function assignOfficerApi(id, officer, actor) {
  try {
    await apiClient.patch(`/complaints/${id}/assign`, {
      officer_name: officer?.name ?? String(officer),
      actor: actor ?? "Officer",
    });
  } catch (err) {
    console.warn(`Failed to assign officer for ${id} on API:`, err.message);
  }
}


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
  const c = citizen || {};
  const now = new Date().toISOString();
  const analysis = draft.analysis ?? {};
  const id = nextComplaintId(existing);
  const location = draft.location || analysis.location || "Location not specified";

  return normalizeComplaint({
    id,
    userId: c.id ?? "usr_10241",
    citizenName: c.name ?? "Ashok Kumar",
    title: draft.title || analysis.issue || (draft.description && draft.description.length > 50 ? draft.description.substring(0, 47) + "..." : draft.description) || "Civic issue reported",
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
        actor: c.name ?? "Citizen",
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
