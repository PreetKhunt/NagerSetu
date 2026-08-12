/**
 * Duplicate Problem Detection Service
 *
 * Deterministic similarity engine for the SIH NagarSetu prototype.
 * Scores a new complaint against existing complaints using a weighted blend of:
 *   - Category match
 *   - Issue-type match
 *   - Text description token overlap
 *   - Geographic distance (when coordinates are available)
 *   - Temporal proximity
 *
 * ALL weights and thresholds are stored as named constants at the top so they
 * can be changed without hunting through logic.
 *
 * TODO(backend): Replace `findRelatedComplaints` with a POST to
 *   /api/complaints/find-related  that returns vector-similarity results from
 *   the FastAPI + pgvector service. The return shape is identical.
 */

/* ==========================================================================
   Configuration constants — adjust here only, not inside logic
   ========================================================================== */

/** Minimum combined score to surface a match to the citizen. */
export const DUPLICATE_THRESHOLD = 0.60;

/** If score >= this value the warning is shown as "Strong possible duplicate". */
export const STRONG_DUPLICATE_THRESHOLD = 0.78;

/** Maximum number of matches shown in the pre-submission warning. */
export const MAX_MATCHES = 5;

/** Minimum number of related complaints before a Problem Cluster is formed. */
export const CLUSTER_MIN_MEMBERS = 2;

/** Time window (days) — complaints older than this receive reduced time score. */
export const TIME_WINDOW_DAYS = 60;

/** Geographic radius (km) — beyond this distance location score drops sharply. */
export const GEO_STRONG_RADIUS_KM = 0.1;   // 100 m
export const GEO_MEDIUM_RADIUS_KM = 0.3;   // 300 m
export const GEO_WEAK_RADIUS_KM = 1.0;     // 1 km

/** Score weights — must sum to 1.0 */
export const WEIGHTS = {
  category:    0.20,
  issueType:   0.20,
  description: 0.30,
  location:    0.25,
  time:        0.05,
};

/* ==========================================================================
   Stop-word list — common words that add noise to token overlap
   ========================================================================== */
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "it", "in", "on", "at", "to", "for", "of",
  "and", "or", "but", "not", "with", "has", "have", "been", "was", "are",
  "this", "that", "there", "here", "near", "by", "very", "also", "been",
  "my", "our", "your", "their", "i", "we", "he", "she", "they", "me",
  "since", "last", "after", "days", "day", "week", "weeks", "month",
  "road", "street", "lane", "area", "ward", "zone",
]);

/* ==========================================================================
   Pure helpers
   ========================================================================== */

/**
 * Tokenise text: lowercase, strip punctuation, remove stop-words, short tokens.
 * Returns a Set of meaningful tokens.
 */
function tokenise(text) {
  if (!text) return new Set();
  return new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/**
 * Jaccard similarity between two token sets.
 * Returns 0–1.
 */
function jaccard(setA, setB) {
  if (!setA.size && !setB.size) return 1;
  if (!setA.size || !setB.size) return 0;
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Haversine distance between two {latitude, longitude} points, in km.
 * Returns null when coordinates are missing.
 */
function haversineKm(a, b) {
  if (!a?.latitude || !a?.longitude || !b?.latitude || !b?.longitude) {
    return null;
  }
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

/** Format km distance as a human-readable string. */
export function formatDistance(km) {
  if (km == null) return "Unknown distance";
  if (km < 0.1) return `${Math.round(km * 1000)} m away`;
  if (km < 1)   return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/**
 * Score the location similarity between two complaints.
 * Returns 0–1.
 */
function scoreLocation(coordsA, locationA, coordsB, locationB) {
  // Prefer real coordinates.
  const km = haversineKm(coordsA, coordsB);
  if (km !== null) {
    if (km <= GEO_STRONG_RADIUS_KM) return 1.0;
    if (km <= GEO_MEDIUM_RADIUS_KM) return 0.75;
    if (km <= GEO_WEAK_RADIUS_KM)   return 0.35;
    return Math.max(0, 0.2 - (km - GEO_WEAK_RADIUS_KM) * 0.05);
  }

  // Fall back to text-based location comparison.
  if (!locationA || !locationB) return 0;
  const tokA = tokenise(locationA);
  const tokB = tokenise(locationB);
  return jaccard(tokA, tokB) * 0.6; // cap at 0.6 when no GPS — lower confidence
}

/**
 * Score the temporal proximity between two complaints.
 * Returns 0–1, decaying linearly over TIME_WINDOW_DAYS.
 */
function scoreTime(createdAtA, createdAtB) {
  const msA = new Date(createdAtA).getTime();
  const msB = new Date(createdAtB).getTime();
  if (!msA || !msB) return 0.5; // unknown → neutral
  const daysDiff = Math.abs(msA - msB) / 86400000;
  return Math.max(0, 1 - daysDiff / TIME_WINDOW_DAYS);
}

/**
 * Score category similarity (binary: same = 1, different = 0).
 * Category mismatch is a strong negative signal.
 */
function scoreCategory(catA, catB) {
  if (!catA || !catB) return 0.3; // unknown → reduced
  return catA === catB ? 1 : 0;
}

/**
 * Score issue-type similarity using token overlap on the issue label.
 * Returns 0–1.
 */
function scoreIssueType(issueA, issueB) {
  if (!issueA || !issueB) return 0.3;
  const tokA = tokenise(issueA);
  const tokB = tokenise(issueB);
  return jaccard(tokA, tokB);
}

/**
 * Score description similarity using title + description token overlap.
 * Returns 0–1.
 */
function scoreDescription(complaintA, complaintB) {
  const textA = `${complaintA.title ?? ""} ${complaintA.description ?? ""}`;
  const textB = `${complaintB.title ?? ""} ${complaintB.description ?? ""}`;
  const tokA = tokenise(textA);
  const tokB = tokenise(textB);
  return jaccard(tokA, tokB);
}

/* ==========================================================================
   Public API
   ========================================================================== */

/**
 * Score one candidate against the new complaint.
 * Returns a score object: { id, complaint, combinedScore, breakdown, distanceKm }
 */
function scoreCandidate(newComplaint, candidate) {
  const category    = scoreCategory(newComplaint.category, candidate.category);
  const issueType   = scoreIssueType(newComplaint.issueType, candidate.issueType);
  const description = scoreDescription(newComplaint, candidate);
  const distanceKm  = haversineKm(newComplaint.coords, candidate.coords);
  const location    = scoreLocation(
    newComplaint.coords, newComplaint.location,
    candidate.coords,   candidate.location,
  );
  const time        = scoreTime(newComplaint.createdAt ?? new Date().toISOString(), candidate.createdAt);

  // Hard gate: if category is a total mismatch, cap combined score to 0.35
  // so a different-category complaint can never be surfaced as a duplicate
  // no matter how similar the text is.
  const catPenalty = category === 0 ? 0.35 : 1;

  const combined = Math.min(
    catPenalty,
    WEIGHTS.category    * category  +
    WEIGHTS.issueType   * issueType +
    WEIGHTS.description * description +
    WEIGHTS.location    * location  +
    WEIGHTS.time        * time,
  );

  return {
    id: candidate.id,
    complaint: candidate,
    combinedScore: combined,
    breakdown: { category, issueType, description, location, time },
    distanceKm,
  };
}

/**
 * Find complaints related to `newComplaint` from `existingComplaints`.
 *
 * @param {object}  newComplaint       - Draft or submitted complaint object.
 * @param {Array}   existingComplaints - Full complaint list from the store.
 * @param {object}  [opts]
 * @param {number}  [opts.threshold]   - Override DUPLICATE_THRESHOLD.
 * @param {number}  [opts.limit]       - Override MAX_MATCHES.
 * @returns {DuplicateResult}
 */
export function findRelatedComplaints(
  newComplaint,
  existingComplaints = [],
  { threshold = DUPLICATE_THRESHOLD, limit = MAX_MATCHES } = {},
) {
  // Never compare against itself.
  const candidates = existingComplaints.filter((c) => c.id !== newComplaint.id);

  const scored = candidates
    .map((c) => scoreCandidate(newComplaint, c))
    .filter((s) => s.combinedScore >= threshold)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);

  const hasPossibleDuplicate = scored.length > 0;
  const highestScore = hasPossibleDuplicate ? scored[0].combinedScore : 0;
  const isStrong = highestScore >= STRONG_DUPLICATE_THRESHOLD;

  // Enrich matches with display-ready fields.
  const matches = scored.map((s) => ({
    id: s.id,
    title: s.complaint.title,
    description: s.complaint.description,
    category: s.complaint.category,
    categoryLabel: s.complaint.categoryLabel,
    status: s.complaint.status,
    priority: s.complaint.priority,
    location: s.complaint.location,
    createdAt: s.complaint.createdAt,
    similarity: s.combinedScore,
    distanceKm: s.distanceKm,
    distanceLabel: formatDistance(s.distanceKm),
    breakdown: s.breakdown,
    // Keep a reference to the full complaint for use by computeProblemClusters.
    _complaint: s.complaint,
  }));

  return {
    hasPossibleDuplicate,
    isStrong,
    matches,
    highestSimilarity: highestScore,
    clusterId: hasPossibleDuplicate ? deriveClusterId(matches) : null,
  };
}

/**
 * Derive a logical cluster ID from a set of related complaint IDs.
 * Uses the lexicographically smallest ID as the canonical cluster anchor.
 */
function deriveClusterId(matches) {
  if (!matches.length) return null;
  const sorted = [...matches].sort((a, b) => a.id.localeCompare(b.id));
  return `CL-${sorted[0].id.replace(/^GRV-\d{4}-0*/, "")}`;
}

/**
 * Compute all problem clusters across the full complaint list.
 * A cluster requires >= CLUSTER_MIN_MEMBERS related complaints.
 *
 * Returns an array of cluster objects:
 *   { clusterId, members, category, categoryLabel, location, count, priority }
 */
export function computeProblemClusters(complaints = []) {
  const visited = new Set();
  const clusters = [];

  for (const complaint of complaints) {
    if (visited.has(complaint.id)) continue;

    const result = findRelatedComplaints(complaint, complaints, {
      threshold: DUPLICATE_THRESHOLD,
      limit: 50,
    });

    if (!result.hasPossibleDuplicate) continue;

    // Pull the real complaint objects out of the enriched match objects.
    // Filter out any undefined entries defensively.
    const members = [
      complaint,
      ...result.matches.map((m) => m._complaint).filter(Boolean),
    ];
    // De-duplicate members list (a match can be shared by multiple seeds).
    const uniqueMembers = [];
    const seen = new Set();
    for (const m of members) {
      if (m?.id && !seen.has(m.id)) { seen.add(m.id); uniqueMembers.push(m); }
    }

    if (uniqueMembers.length < CLUSTER_MIN_MEMBERS) continue;

    uniqueMembers.forEach((m) => visited.add(m.id));

    // Determine dominant category by vote.
    const catCounts = {};
    uniqueMembers.forEach((m) => { catCounts[m.category] = (catCounts[m.category] ?? 0) + 1; });
    const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCategoryLabel = uniqueMembers.find((m) => m.category === topCategory)?.categoryLabel;

    // Determine dominant location (most common non-null location string).
    const locCounts = {};
    uniqueMembers.forEach((m) => {
      if (m.location) locCounts[m.location] = (locCounts[m.location] ?? 0) + 1;
    });
    const topLocation = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Highest priority in cluster.
    const PRIORITY_ORDER = ["critical", "high", "medium", "low"];
    const topPriority = PRIORITY_ORDER.find((p) =>
      uniqueMembers.some((m) => m.priority === p),
    ) ?? "medium";

    clusters.push({
      clusterId: result.clusterId,
      members: uniqueMembers,
      memberIds: uniqueMembers.map((m) => m.id),
      category: topCategory,
      categoryLabel: topCategoryLabel,
      location: topLocation,
      count: uniqueMembers.length,
      priority: topPriority,
      highestSimilarity: result.highestSimilarity,
    });
  }

  return clusters;
}
