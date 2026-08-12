/**
 * Application-wide constants.
 * Keep every enum-like value here so UI and (future) API layers agree.
 */

export const APP_NAME = "NagarSetu";
export const APP_SHORT_NAME = "NagarSetu";
export const APP_TAGLINE = "Civic AI Grievance Platform";
export const APP_FULL_NAME = "NagarSetu — AI Civic Grievance Platform";

/* ---------------- Route paths ----------------
   Every <Link to> and navigate() reads from here so a route rename is a
   single-file change. Keep in sync with src/routes/AppRoutes.jsx. */
export const PATHS = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  TRACK: "/track",
  CITIZEN_DASHBOARD: "/citizen/dashboard",
  CITIZEN_COMPLAINTS: "/citizen/complaints",
  CITIZEN_NEW: "/citizen/lodge-complaint",
  CITIZEN_SUCCESS: "/citizen/complaint-submitted",
  CITIZEN_PROFILE: "/citizen/profile",
  CITIZEN_NOTIFICATIONS: "/citizen/notifications",
  OFFICER_DASHBOARD: "/officer/dashboard",
  OFFICER_COMPLAINTS: "/officer/complaints",
  OFFICER_MAP: "/officer/map",
  OFFICER_ANALYTICS: "/officer/analytics",
  OFFICER_DEPARTMENTS: "/officer/departments",
  OFFICER_NOTIFICATIONS: "/officer/notifications",
  OFFICER_PROFILE: "/officer/profile",
  OFFICER_CLUSTER: "/officer/cluster",
};

/** Detail route for one complaint. Keeps `:id` interpolation in one place. */
export const complaintPath = (id) =>
  `${PATHS.CITIZEN_COMPLAINTS}/${encodeURIComponent(id)}`;

/** Officer-side detail route for the same complaint record. */
export const officerComplaintPath = (id) =>
  `${PATHS.OFFICER_COMPLAINTS}/${encodeURIComponent(id)}`;

/** Officer-side route for a problem cluster. */
export const officerClusterPath = (id) =>
  `${PATHS.OFFICER_CLUSTER}/${encodeURIComponent(id)}`;

/** Lodge-complaint deep link that preselects the voice tab. */
export const VOICE_COMPLAINT_PATH = `${PATHS.CITIZEN_NEW}?mode=voice`;

/* ---------------- Roles ---------------- */
export const ROLES = {
  CITIZEN: "citizen",
  OFFICER: "officer",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [ROLES.CITIZEN]: "Citizen",
  [ROLES.OFFICER]: "Department Officer",
  [ROLES.ADMIN]: "Administrator",
};

export const ROLE_HOME = {
  [ROLES.CITIZEN]: PATHS.CITIZEN_DASHBOARD,
  [ROLES.OFFICER]: PATHS.OFFICER_DASHBOARD,
  [ROLES.ADMIN]: PATHS.CITIZEN_DASHBOARD,
};

/* ---------------- Complaint status ---------------- */
export const COMPLAINT_STATUS = {
  REGISTERED: "registered",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  REJECTED: "rejected",
  REOPENED: "reopened",
};

export const STATUS_META = {
  [COMPLAINT_STATUS.REGISTERED]: {
    label: "Registered",
    tone: "registered",
    icon: "bi-file-earmark-text",
  },
  [COMPLAINT_STATUS.ASSIGNED]: {
    label: "Assigned",
    tone: "assigned",
    icon: "bi-person-check",
  },
  [COMPLAINT_STATUS.IN_PROGRESS]: {
    label: "In Progress",
    tone: "progress",
    icon: "bi-tools",
  },
  [COMPLAINT_STATUS.RESOLVED]: {
    label: "Resolved",
    tone: "resolved",
    icon: "bi-check2-circle",
  },
  [COMPLAINT_STATUS.REJECTED]: {
    label: "Rejected",
    tone: "rejected",
    icon: "bi-x-circle",
  },
  [COMPLAINT_STATUS.REOPENED]: {
    label: "Reopened",
    tone: "reopened",
    icon: "bi-arrow-counterclockwise",
  },
};

/** Ordered lifecycle used by the tracker component. */
export const STATUS_FLOW = [
  COMPLAINT_STATUS.REGISTERED,
  COMPLAINT_STATUS.ASSIGNED,
  COMPLAINT_STATUS.IN_PROGRESS,
  COMPLAINT_STATUS.RESOLVED,
];

/* ---------------- Priority ---------------- */
export const PRIORITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const PRIORITY_META = {
  [PRIORITY.CRITICAL]: {
    label: "Critical",
    tone: "critical",
    icon: "bi-exclamation-octagon-fill",
  },
  [PRIORITY.HIGH]: {
    label: "High",
    tone: "high",
    icon: "bi-arrow-up-circle-fill",
  },
  [PRIORITY.MEDIUM]: {
    label: "Medium",
    tone: "medium",
    icon: "bi-dash-circle-fill",
  },
  [PRIORITY.LOW]: { label: "Low", tone: "low", icon: "bi-arrow-down-circle-fill" },
};

/* ---------------- Categories & departments ---------------- */
export const CATEGORIES = [
  { id: "road", label: "Road Damage", icon: "bi-cone-striped", dept: "Public Works Department" },
  { id: "pothole", label: "Potholes", icon: "bi-record-circle", dept: "Public Works Department" },
  { id: "garbage", label: "Garbage & Sanitation", icon: "bi-trash3", dept: "Sanitation Department" },
  { id: "water", label: "Water Leakage", icon: "bi-droplet-half", dept: "Water Supply Board" },
  { id: "streetlight", label: "Street Lights", icon: "bi-lightbulb", dept: "Electrical Department" },
  { id: "drainage", label: "Drainage & Sewage", icon: "bi-water", dept: "Drainage Department" },
  { id: "electricity", label: "Electricity", icon: "bi-lightning-charge", dept: "Power Distribution" },
  { id: "infrastructure", label: "Public Infrastructure", icon: "bi-building-gear", dept: "Urban Development" },
];

export const DEPARTMENTS = [
  "Public Works Department",
  "Sanitation Department",
  "Water Supply Board",
  "Electrical Department",
  "Drainage Department",
  "Power Distribution",
  "Urban Development",
];

/* ---------------- Languages ----------------
   `speech` is the BCP-47 tag handed to SpeechRecognition.lang. Browser support
   varies by engine and platform — Chrome covers en-IN/hi-IN/gu-IN well, ne-NP
   is patchier — so the recorder always offers a typed fallback. */
export const LANGUAGES = [
  { code: "en", label: "English", native: "English", speech: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "ne", label: "Nepali", native: "नेपाली", speech: "ne-NP" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", speech: "gu-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", speech: "mr-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", speech: "te-IN" },
  { code: "bn", label: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN" },
];

/** Languages surfaced first in the voice picker, per the project brief. */
export const VOICE_LANGUAGES = ["en", "hi", "ne", "gu"];


/* ---------------- Complaint input modes ---------------- */
export const INPUT_MODES = [
  {
    id: "text",
    label: "Text",
    icon: "bi-keyboard",
    hint: "Type what you are seeing",
  },
  {
    id: "voice",
    label: "Voice",
    icon: "bi-mic",
    hint: "Speak in your own language",
  },
  {
    id: "image",
    label: "Image",
    icon: "bi-camera",
    hint: "Let AI read the photo",
  },
];

/** Minimum characters before AI analysis is offered. */
export const COMPLAINT_MIN_CHARS = 25;
export const COMPLAINT_MAX_CHARS = 1000;

/* ---------------- List sorting ---------------- */
export const SORT_OPTIONS = [
  { id: "recent", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "priority", label: "Priority: high to low" },
  { id: "updated", label: "Recently updated" },
];

/** Priority weight for sorting — critical sinks to the top. */
export const PRIORITY_RANK = {
  [PRIORITY.CRITICAL]: 4,
  [PRIORITY.HIGH]: 3,
  [PRIORITY.MEDIUM]: 2,
  [PRIORITY.LOW]: 1,
};

/* ---------------- SLA ----------------
   Resolution window per priority, in hours. `slaFor()` in grievanceUtils turns
   these into on-track / due-soon / breached against a complaint's createdAt,
   so no SLA figure anywhere in the UI is a stored number. */
export const SLA_HOURS = {
  [PRIORITY.CRITICAL]: 24,
  [PRIORITY.HIGH]: 48,
  [PRIORITY.MEDIUM]: 72,
  [PRIORITY.LOW]: 168,
};

/** Fraction of the window remaining below which a complaint reads "due soon". */
export const SLA_DUE_SOON_RATIO = 0.25;

export const SLA_STATE = {
  ON_TRACK: "on_track",
  DUE_SOON: "due_soon",
  BREACHED: "breached",
  CLOSED: "closed",
};

export const SLA_META = {
  [SLA_STATE.ON_TRACK]: { label: "On track", tone: "success", icon: "bi-check2" },
  [SLA_STATE.DUE_SOON]: { label: "Due soon", tone: "amber", icon: "bi-hourglass-split" },
  [SLA_STATE.BREACHED]: { label: "Breached", tone: "critical", icon: "bi-exclamation-triangle" },
  [SLA_STATE.CLOSED]: { label: "Closed", tone: "muted", icon: "bi-lock" },
};

/**
 * Statuses that still need triage. The officer dashboard labels this bucket
 * "Pending" — the citizen-facing label for `registered` stays "Registered"
 * because that is what the tracker's first step means to the person who filed.
 */
export const PENDING_STATUSES = [
  COMPLAINT_STATUS.REGISTERED,
  COMPLAINT_STATUS.REOPENED,
];

/** Statuses that count as closed for resolution-rate maths. */
export const CLOSED_STATUSES = [
  COMPLAINT_STATUS.RESOLVED,
  COMPLAINT_STATUS.REJECTED,
];

/* ---------------- Notifications ---------------- */
export const NOTIFICATION_TYPES = {
  ASSIGNED: "assigned",
  PROGRESS: "progress",
  RESOLVED: "resolved",
  INFO: "info",
};

export const NOTIFICATION_META = {
  [NOTIFICATION_TYPES.ASSIGNED]: {
    icon: "bi-person-check",
    tone: "primary",
    label: "Assigned",
  },
  [NOTIFICATION_TYPES.PROGRESS]: {
    icon: "bi-tools",
    tone: "teal",
    label: "In progress",
  },
  [NOTIFICATION_TYPES.RESOLVED]: {
    icon: "bi-check2-circle",
    tone: "success",
    label: "Resolved",
  },
  [NOTIFICATION_TYPES.INFO]: {
    icon: "bi-info-circle",
    tone: "amber",
    label: "Update",
  },
};

/** Audience for a notification — officers and citizens see different feeds. */
export const NOTIFICATION_AUDIENCE = {
  CITIZEN: "citizen",
  OFFICER: "officer",
};

/* ---------------- Storage keys ---------------- */
export const STORAGE_KEYS = {
  AUTH: "nagarsetu.auth",
  TOKEN: "nagarsetu.token",
  LANG: "nagarsetu.lang",
  DRAFT: "nagarsetu.draft",
  PREFS: "nagarsetu.prefs",
  // Bumped when the persisted complaint shape changes: a stale payload from an
  // older build is discarded and reseeded rather than half-read.
  GRIEVANCES: "nagarsetu.grievances.v1",
};

/** Pagination size for the officer complaint table. */
export const OFFICER_PAGE_SIZE = 8;
