/**
 * UI placeholder content.
 *
 * This is NOT a mock API — it is static seed data so the interface can be
 * designed, reviewed and demoed before the backend exists. Every consumer
 * reads it through `src/services/*`, so swapping in real HTTP calls later
 * means editing the service, not the components.
 */

import {
  COMPLAINT_STATUS,
  PRIORITY,
  NOTIFICATION_TYPES,
} from "./constants";

/** Minutes/hours/days ago, expressed as an ISO string. */
const daysAgo = (n) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (n) => new Date(Date.now() - n * 60 * 60 * 1000).toISOString();

export const DEMO_CITIZEN = {
  id: "usr_10241",
  name: "Ashok Kumar",
  email: "ashok.kumar@example.in",
  mobile: "9876543210",
  role: "citizen",
  location: "Ward 14, Kothrud, Pune",
  joinedAt: daysAgo(214),
  verified: true,
};

export const DEMO_OFFICER = {
  id: "ofc_3307",
  name: "Priya Sharma",
  email: "priya.sharma@pmc.gov.in",
  mobile: "9812345670",
  role: "officer",
  department: "Public Works Department",
  location: "Zone 3, Pune Municipal Corporation",
  joinedAt: daysAgo(540),
  verified: true,
};

export const CITIZEN_COMPLAINTS = [
  {
    id: "GRV-2026-004812",
    title: "Large pothole causing two-wheeler accidents",
    description:
      "A deep pothole has formed near the Kothrud bus depot junction. Two-wheelers are skidding, especially after rain. It has been growing for the last two weeks.",
    category: "pothole",
    categoryLabel: "Potholes",
    department: "Public Works Department",
    status: COMPLAINT_STATUS.IN_PROGRESS,
    priority: PRIORITY.CRITICAL,
    location: "Kothrud Depot Junction, Pune",
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(9),
    aiConfidence: 0.96,
    language: "English",
    hasImage: true,
    isVoice: false,
    duplicatesMerged: 4,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: daysAgo(3), note: "Complaint received and classified by AI" },
      { status: COMPLAINT_STATUS.ASSIGNED, at: daysAgo(2), note: "Routed to Public Works Department, Zone 3" },
      { status: COMPLAINT_STATUS.IN_PROGRESS, at: hoursAgo(9), note: "Repair crew scheduled for site work" },
    ],
  },
  {
    id: "GRV-2026-004651",
    title: "Street light not working for 8 days",
    description:
      "The street light pole opposite the community park has been dark since last week, making the lane unsafe after 8 pm.",
    category: "streetlight",
    categoryLabel: "Street Lights",
    department: "Electrical Department",
    status: COMPLAINT_STATUS.ASSIGNED,
    priority: PRIORITY.HIGH,
    location: "Lane 6, Karve Nagar, Pune",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
    aiConfidence: 0.93,
    language: "Marathi",
    hasImage: false,
    isVoice: true,
    duplicatesMerged: 1,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: daysAgo(6), note: "Voice complaint transcribed and classified" },
      { status: COMPLAINT_STATUS.ASSIGNED, at: daysAgo(4), note: "Assigned to Electrical Department" },
    ],
  },
  {
    id: "GRV-2026-004330",
    title: "Garbage not collected from society gate",
    description:
      "Waste has been piling up at the main society entrance for four days. There is a strong smell and stray animals are scattering it.",
    category: "garbage",
    categoryLabel: "Garbage & Sanitation",
    department: "Sanitation Department",
    status: COMPLAINT_STATUS.RESOLVED,
    priority: PRIORITY.MEDIUM,
    location: "Sun Residency, Warje, Pune",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(11),
    aiConfidence: 0.98,
    language: "Hindi",
    hasImage: true,
    isVoice: false,
    duplicatesMerged: 2,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: daysAgo(14), note: "Complaint received with 2 photos" },
      { status: COMPLAINT_STATUS.ASSIGNED, at: daysAgo(13), note: "Assigned to Sanitation Department" },
      { status: COMPLAINT_STATUS.IN_PROGRESS, at: daysAgo(12), note: "Collection vehicle dispatched" },
      { status: COMPLAINT_STATUS.RESOLVED, at: daysAgo(11), note: "Cleared and verified with closure photo" },
    ],
  },
  {
    id: "GRV-2026-004102",
    title: "Water pipeline leaking near main road",
    description:
      "Continuous water leakage from an underground pipeline is flooding the footpath and wasting drinking water.",
    category: "water",
    categoryLabel: "Water Leakage",
    department: "Water Supply Board",
    status: COMPLAINT_STATUS.REGISTERED,
    priority: PRIORITY.HIGH,
    location: "Paud Road, Kothrud, Pune",
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
    aiConfidence: 0.91,
    language: "English",
    hasImage: true,
    isVoice: false,
    duplicatesMerged: 0,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: hoursAgo(20), note: "Complaint received and classified by AI" },
    ],
  },
  {
    id: "GRV-2026-004077",
    title: "Low water pressure since the pipeline repair",
    description:
      "Supply has been down to a trickle on the upper floors since the line outside was dug up last week. Tankers are being called in every second day.",
    category: "water",
    categoryLabel: "Water Leakage",
    department: "Water Supply Board",
    status: COMPLAINT_STATUS.IN_PROGRESS,
    priority: PRIORITY.MEDIUM,
    location: "Bhelke Nagar, Kothrud, Pune",
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(16),
    aiConfidence: 0.88,
    language: "English",
    hasImage: false,
    isVoice: false,
    duplicatesMerged: 1,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: daysAgo(4), note: "Complaint received and classified by AI" },
      { status: COMPLAINT_STATUS.ASSIGNED, at: daysAgo(3), note: "Assigned to Water Supply Board, Zone 3" },
      { status: COMPLAINT_STATUS.IN_PROGRESS, at: hoursAgo(16), note: "Pressure survey scheduled for the feeder line" },
    ],
  },
  {
    id: "GRV-2026-003987",
    title: "Blocked drainage overflowing onto street",
    description:
      "The drainage line near the market chowk is blocked and overflowing during every rainfall.",
    category: "drainage",
    categoryLabel: "Drainage & Sewage",
    department: "Drainage Department",
    status: COMPLAINT_STATUS.RESOLVED,
    priority: PRIORITY.CRITICAL,
    location: "Market Chowk, Shivaji Nagar, Pune",
    createdAt: daysAgo(26),
    updatedAt: daysAgo(21),
    aiConfidence: 0.95,
    language: "Marathi",
    hasImage: true,
    isVoice: true,
    duplicatesMerged: 7,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: daysAgo(26), note: "Voice complaint received in Marathi" },
      { status: COMPLAINT_STATUS.ASSIGNED, at: daysAgo(25), note: "Escalated as critical, assigned same day" },
      { status: COMPLAINT_STATUS.IN_PROGRESS, at: daysAgo(24), note: "De-silting work started" },
      { status: COMPLAINT_STATUS.RESOLVED, at: daysAgo(21), note: "Drain cleared, flow restored" },
    ],
  },
  // Category siblings for the three most-demoed records. `findRelated` matches
  // on category, so without these the "related complaints" panel is always
  // empty and the list filters have nothing to narrow.
  {
    id: "GRV-2026-004795",
    title: "Pothole near Kothrud depot getting deeper after rain",
    description:
      "Same stretch outside the depot gate. The patch laid last season has broken open again and water collects inside it every evening.",
    category: "pothole",
    categoryLabel: "Potholes",
    department: "Public Works Department",
    status: COMPLAINT_STATUS.ASSIGNED,
    priority: PRIORITY.CRITICAL,
    location: "Kothrud Depot Road, Pune",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2),
    aiConfidence: 0.94,
    language: "Marathi",
    hasImage: true,
    isVoice: true,
    duplicatesMerged: 2,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: daysAgo(5), note: "Voice complaint transcribed and classified" },
      { status: COMPLAINT_STATUS.ASSIGNED, at: daysAgo(2), note: "Grouped with nearby road damage reports" },
    ],
  },
  {
    id: "GRV-2026-004508",
    title: "Road surface broken outside school gate",
    description:
      "Loose gravel and a sunken patch right where school buses stop. Children step around it onto the carriageway.",
    category: "pothole",
    categoryLabel: "Potholes",
    department: "Public Works Department",
    status: COMPLAINT_STATUS.RESOLVED,
    priority: PRIORITY.HIGH,
    location: "Vidya Niketan School, Karve Nagar, Pune",
    createdAt: daysAgo(19),
    updatedAt: daysAgo(12),
    aiConfidence: 0.89,
    language: "English",
    hasImage: false,
    isVoice: false,
    duplicatesMerged: 0,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: daysAgo(19), note: "Complaint received and classified by AI" },
      { status: COMPLAINT_STATUS.ASSIGNED, at: daysAgo(18), note: "Routed to Public Works Department, Zone 2" },
      { status: COMPLAINT_STATUS.IN_PROGRESS, at: daysAgo(15), note: "Patch work in progress" },
      { status: COMPLAINT_STATUS.RESOLVED, at: daysAgo(12), note: "Surface levelled and reopened" },
    ],
  },
  {
    id: "GRV-2026-004221",
    title: "Garbage bins overflowing behind the vegetable market",
    description:
      "Bins have not been emptied since the weekend. Waste is spreading into the service lane and vendors are sweeping it into the drain.",
    category: "garbage",
    categoryLabel: "Garbage & Sanitation",
    department: "Sanitation Department",
    status: COMPLAINT_STATUS.IN_PROGRESS,
    priority: PRIORITY.MEDIUM,
    location: "Mandai Service Lane, Shivaji Nagar, Pune",
    createdAt: daysAgo(9),
    updatedAt: hoursAgo(30),
    aiConfidence: 0.92,
    language: "Hindi",
    hasImage: true,
    isVoice: false,
    duplicatesMerged: 3,
    timeline: [
      { status: COMPLAINT_STATUS.REGISTERED, at: daysAgo(9), note: "Complaint received with 1 photo" },
      { status: COMPLAINT_STATUS.ASSIGNED, at: daysAgo(8), note: "Assigned to Sanitation Department" },
      { status: COMPLAINT_STATUS.IN_PROGRESS, at: hoursAgo(30), note: "Additional bin placement approved" },
    ],
  },
];

/** Landing-page trust numbers. Illustrative figures for the prototype. */
export const PLATFORM_STATS = [
  { value: 1.2, suffix: "L+", label: "Complaints processed" },
  { value: 96, suffix: "%", label: "AI classification accuracy" },
  { value: 4.2, suffix: " days", label: "Average resolution time" },
  { value: 22, suffix: "+", label: "Departments connected" },
];

/* ==========================================================================
   Field officers — one per department, keyed for lookup on the detail page.
   ========================================================================== */
export const OFFICERS = {
  "Public Works Department": {
    name: "Priya Sharma",
    designation: "Junior Engineer, Zone 3",
    phone: "020-2555-0134",
    email: "pwd.zone3@pmc.gov.in",
    resolvedCount: 184,
  },
  "Electrical Department": {
    name: "Rakesh Patil",
    designation: "Section Officer, Street Lighting",
    phone: "020-2555-0187",
    email: "electrical@pmc.gov.in",
    resolvedCount: 231,
  },
  "Sanitation Department": {
    name: "Meena Deshpande",
    designation: "Sanitary Inspector, Ward 14",
    phone: "020-2555-0162",
    email: "sanitation.w14@pmc.gov.in",
    resolvedCount: 402,
  },
  "Water Supply Board": {
    name: "Imran Sheikh",
    designation: "Assistant Engineer, Distribution",
    phone: "020-2555-0119",
    email: "water@pmc.gov.in",
    resolvedCount: 156,
  },
  "Drainage Department": {
    name: "Sunita Rao",
    designation: "Executive Engineer, Drainage",
    phone: "020-2555-0173",
    email: "drainage@pmc.gov.in",
    resolvedCount: 97,
  },
};

/** Fallback so a complaint in any department still renders an officer card. */
export const DEFAULT_OFFICER = {
  name: "Ward Help Desk",
  designation: "Municipal Grievance Cell",
  phone: "020-2555-0100",
  email: "grievance@pmc.gov.in",
  resolvedCount: 0,
};

/* ==========================================================================
   Assignable officers

   The roster the officer-side assign dialog offers. Separate from OFFICERS
   above, which is the read-only "who owns this department" lookup shown on the
   citizen detail page.
   ========================================================================== */
export const ASSIGNABLE_OFFICERS = [
  {
    id: "ofc_001",
    name: "Rajesh Kumar",
    designation: "Junior Engineer",
    department: "Public Works Department",
    phone: "020-2555-0201",
    email: "rajesh.kumar@pmc.gov.in",
  },
  {
    id: "ofc_002",
    name: "Priya Sharma",
    designation: "Section Officer",
    department: "Public Works Department",
    phone: "020-2555-0134",
    email: "priya.sharma@pmc.gov.in",
  },
  {
    id: "ofc_003",
    name: "Amit Patel",
    designation: "Assistant Engineer",
    department: "Water Supply Board",
    phone: "020-2555-0119",
    email: "amit.patel@pmc.gov.in",
  },
  {
    id: "ofc_004",
    name: "Meena Deshpande",
    designation: "Sanitary Inspector",
    department: "Sanitation Department",
    phone: "020-2555-0162",
    email: "meena.deshpande@pmc.gov.in",
  },
  {
    id: "ofc_005",
    name: "Rakesh Patil",
    designation: "Section Officer, Street Lighting",
    department: "Electrical Department",
    phone: "020-2555-0187",
    email: "rakesh.patil@pmc.gov.in",
  },
  {
    id: "ofc_006",
    name: "Sunita Rao",
    designation: "Executive Engineer",
    department: "Drainage Department",
    phone: "020-2555-0173",
    email: "sunita.rao@pmc.gov.in",
  },
];

/* ==========================================================================
   Approximate coordinates

   Demo values for the officer map, keyed by the location string a complaint
   already carries. These are plausible points around Pune, not surveyed
   positions — good enough to show clustering and filtering, and the exact
   place a real geocoder plugs in later.
   ========================================================================== */
export const CITY_CENTRE = { latitude: 18.5074, longitude: 73.8077 };

export const LOCATION_COORDS = {
  "Kothrud Depot Junction, Pune": { latitude: 18.5074, longitude: 73.8077 },
  "Kothrud Depot Road, Pune": { latitude: 18.5091, longitude: 73.8052 },
  "Lane 6, Karve Nagar, Pune": { latitude: 18.4899, longitude: 73.8207 },
  "Sun Residency, Warje, Pune": { latitude: 18.4795, longitude: 73.7999 },
  "Paud Road, Kothrud, Pune": { latitude: 18.5116, longitude: 73.8134 },
  "Bhelke Nagar, Kothrud, Pune": { latitude: 18.5028, longitude: 73.8155 },
  "Market Chowk, Shivaji Nagar, Pune": { latitude: 18.5308, longitude: 73.8478 },
  "Vidya Niketan School, Karve Nagar, Pune": { latitude: 18.4862, longitude: 73.8241 },
  "Mandai Service Lane, Shivaji Nagar, Pune": { latitude: 18.5265, longitude: 73.8563 },
  "Parul University Gate 2, Vadodara": { latitude: 22.288, longitude: 73.362 },
};

/* ==========================================================================
   Notifications
   ========================================================================== */
export const NOTIFICATIONS = [
  {
    id: "ntf_9001",
    type: NOTIFICATION_TYPES.PROGRESS,
    title: "Officer has started working on your complaint",
    message:
      "A repair crew has been dispatched to Kothrud Depot Junction for GRV-2026-004812.",
    complaintId: "GRV-2026-004812",
    at: hoursAgo(9),
    read: false,
  },
  {
    id: "ntf_8994",
    type: NOTIFICATION_TYPES.ASSIGNED,
    title: "Your complaint GRV-2026-004812 has been assigned",
    message:
      "Routed to Public Works Department, Zone 3. Priya Sharma is the assigned officer.",
    complaintId: "GRV-2026-004812",
    at: daysAgo(2),
    read: false,
  },
  {
    id: "ntf_8977",
    type: NOTIFICATION_TYPES.INFO,
    title: "3 similar complaints merged",
    message:
      "Neighbours reported the same pothole. Merging raised the priority to Critical.",
    complaintId: "GRV-2026-004812",
    at: daysAgo(2),
    read: true,
  },
  {
    id: "ntf_8940",
    type: NOTIFICATION_TYPES.ASSIGNED,
    title: "Your complaint GRV-2026-004651 has been assigned",
    message: "Assigned to Electrical Department for street light restoration.",
    complaintId: "GRV-2026-004651",
    at: daysAgo(4),
    read: true,
  },
  {
    id: "ntf_8801",
    type: NOTIFICATION_TYPES.RESOLVED,
    title: "Your complaint has been resolved",
    message:
      "GRV-2026-004330 was cleared and verified with a closure photo. Rate the resolution.",
    complaintId: "GRV-2026-004330",
    at: daysAgo(11),
    read: true,
  },
  {
    id: "ntf_8612",
    type: NOTIFICATION_TYPES.RESOLVED,
    title: "Your complaint has been resolved",
    message: "GRV-2026-003987 drainage line cleared and flow restored.",
    complaintId: "GRV-2026-003987",
    at: daysAgo(21),
    read: true,
  },
];

/* ==========================================================================
   Simulated AI

   Frontend-only stand-in for the classification model. `AI_RULES` is scanned
   in order and the first keyword hit wins, which is enough to make the demo
   respond meaningfully to what the user actually typed rather than always
   returning the same canned result. Replace with a real inference call later.
   ========================================================================== */
export const AI_RULES = [
  {
    match: ["pothole", "gaddha", "road broken", "crater", "road damage"],
    category: "pothole",
    issue: "Pothole",
    priority: PRIORITY.HIGH,
    confidence: 0.94,
    summary: "Road surface damage reported that poses a risk to two-wheelers.",
  },
  {
    match: ["garbage", "waste", "trash", "kachra", "dustbin", "smell"],
    category: "garbage",
    issue: "Uncollected garbage",
    priority: PRIORITY.MEDIUM,
    confidence: 0.92,
    summary: "Solid waste accumulation requiring a collection vehicle.",
  },
  {
    match: ["water", "leak", "pipeline", "tap", "supply"],
    category: "water",
    issue: "Water pipeline leakage",
    priority: PRIORITY.HIGH,
    confidence: 0.91,
    summary: "Water loss from a distribution line needing valve isolation.",
  },
  {
    match: ["street light", "streetlight", "lamp", "dark", "light not"],
    category: "streetlight",
    issue: "Street light not working",
    priority: PRIORITY.MEDIUM,
    confidence: 0.93,
    summary: "Non-functional street lighting affecting night-time safety.",
  },
  {
    match: ["drain", "sewage", "gutter", "overflow", "blocked"],
    category: "drainage",
    issue: "Blocked drainage",
    priority: PRIORITY.CRITICAL,
    confidence: 0.95,
    summary: "Drainage blockage with overflow risk during rainfall.",
  },
  {
    match: ["electric", "wire", "shock", "transformer", "power cut"],
    category: "electricity",
    issue: "Electrical hazard",
    priority: PRIORITY.CRITICAL,
    confidence: 0.9,
    summary: "Exposed electrical infrastructure posing a safety hazard.",
  },
];

/** Used when nothing matches, so the UI never shows an empty analysis. */
export const AI_FALLBACK = {
  category: "infrastructure",
  issue: "General civic issue",
  priority: PRIORITY.MEDIUM,
  confidence: 0.72,
  summary: "Civic infrastructure issue routed for departmental review.",
};

/** Escalate priority when the wording signals danger. */
export const AI_URGENCY_WORDS = [
  "accident",
  "danger",
  "urgent",
  "injury",
  "child",
  "hospital",
  "emergency",
  "died",
  "fell",
];

/* Voice capture has no sample transcripts on purpose — it runs on the real
   Web Speech API, so whatever appears in the box was actually spoken. */

/** Object-detection output for the image tab. Indexed by upload count. */
export const VISION_RESULTS = [
  { label: "Pothole", severity: "High", confidence: 0.94, category: "pothole" },
  {
    label: "Garbage pile",
    severity: "Medium",
    confidence: 0.89,
    category: "garbage",
  },
  {
    label: "Waterlogging",
    severity: "High",
    confidence: 0.91,
    category: "drainage",
  },
];

/** Saved locations offered in the location picker. */
export const SAVED_LOCATIONS = [
  "Parul University Gate 2, Vadodara",
  "Kothrud Depot Junction, Pune",
  "Lane 6, Karve Nagar, Pune",
  "Market Chowk, Shivaji Nagar, Pune",
];

/** Citizen preference defaults for the profile screen. */
export const DEFAULT_PREFERENCES = {
  language: "en",
  appearance: "light",
  notifyStatus: true,
  notifyResolution: true,
  notifyNearby: false,
  notifyEmail: true,
  notifySms: false,
};
