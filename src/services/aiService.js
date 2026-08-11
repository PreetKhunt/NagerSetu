/**
 * Simulated AI service — frontend only.
 *
 * There is no model and no network call here. Classification is keyword
 * matching over `AI_RULES`, which is deliberate: it makes the demo react to
 * what the user actually typed instead of replaying one hard-coded result,
 * while keeping every signature shaped like the eventual API.
 *
 * Speech-to-text is deliberately absent: voice capture runs on the browser's
 * real Web Speech API in `hooks/useSpeechRecognition`, so there is no mock
 * transcript to fall back to. See that hook for the Whisper swap-in point.
 *
 * TODO(api): replace each body with a POST to the inference endpoint.
 */

import {
  AI_FALLBACK,
  AI_RULES,
  AI_URGENCY_WORDS,
  VISION_RESULTS,
} from "../utils/mockData";
import { CATEGORIES, PRIORITY, PRIORITY_RANK } from "../utils/constants";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Department that owns a category, with a safe fallback. */
function departmentFor(categoryId) {
  return (
    CATEGORIES.find((c) => c.id === categoryId)?.dept ?? "Urban Development"
  );
}

function labelFor(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? "Other";
}

/** One step up the priority ladder, capped at critical. */
function escalate(priority) {
  const order = [
    PRIORITY.LOW,
    PRIORITY.MEDIUM,
    PRIORITY.HIGH,
    PRIORITY.CRITICAL,
  ];
  const next = order[order.indexOf(priority) + 1];
  return next ?? PRIORITY.CRITICAL;
}

/**
 * Very rough script detection so the language chip is not always "English".
 * Devanagari covers both Hindi and Marathi; we cannot tell them apart from
 * the script alone, so Marathi is only claimed when a marker word appears.
 */
function detectLanguage(text) {
  if (/[઀-૿]/.test(text)) return "Gujarati";
  if (/[஀-௿]/.test(text)) return "Tamil";
  if (/[ఀ-౿]/.test(text)) return "Telugu";
  if (/[ঀ-৿]/.test(text)) return "Bengali";
  if (/[ಀ-೿]/.test(text)) return "Kannada";
  if (/[ऀ-ॿ]/.test(text)) {
    return /\b(आहे|नाही|रस्ता|पाणी)\b/.test(text) ? "Marathi" : "Hindi";
  }
  return "English";
}

/** Pull a landmark-ish phrase out of the text for the location hint. */
function guessLocation(text) {
  const near = text.match(
    /\b(?:near|beside|opposite|behind|at)\s+([A-Za-z0-9][^.,;\n]{3,48})/i,
  );
  return near ? near[1].trim() : null;
}

/**
 * Classify a written complaint.
 * Returns category, issue, priority, department, confidence and a summary.
 */
export async function analyzeText(text, { location } = {}) {
  await delay(1500);

  const haystack = String(text).toLowerCase();
  const rule = AI_RULES.find((r) => r.match.some((k) => haystack.includes(k)));
  const base = rule ?? AI_FALLBACK;

  const urgent = AI_URGENCY_WORDS.some((w) => haystack.includes(w));
  const priority = urgent ? escalate(base.priority) : base.priority;

  // Longer, more specific reports genuinely carry more signal.
  const lengthBonus = Math.min(String(text).trim().length / 4000, 0.04);
  const confidence = Math.min(base.confidence + lengthBonus, 0.99);

  return {
    category: base.category,
    categoryLabel: labelFor(base.category),
    issue: base.issue,
    priority,
    priorityRank: PRIORITY_RANK[priority],
    department: departmentFor(base.category),
    confidence,
    language: detectLanguage(String(text)),
    location: location || guessLocation(String(text)),
    summary: base.summary,
    escalated: urgent,
    matchedKeywords: rule
      ? rule.match.filter((k) => haystack.includes(k)).slice(0, 3)
      : [],
  };
}

/**
 * Stable 0–1 hash of a string. Used for mock distances so the same complaint
 * always shows the same value — a number that jitters between renders reads
 * as a bug to anyone watching the demo.
 */
function hashUnit(value) {
  let h = 0;
  for (const char of String(value)) {
    h = (h * 31 + char.codePointAt(0)) % 100000;
  }
  return h / 100000;
}

/**
 * Score candidate complaints as possible duplicates of `complaint`.
 *
 * Synchronous on purpose: this is local scoring, not a request, and the
 * callers are already inside a delayed service call. Similarity is a weighted
 * blend of category, issue wording, priority and recency — enough to make the
 * ordering defensible when a judge asks why one match ranks above another.
 *
 * TODO(api): replace with GET /complaints/:id/related once embeddings exist.
 */
export function findRelated(complaint, candidates = [], { limit = 3 } = {}) {
  const words = (text) =>
    new Set(
      String(text)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3),
    );

  const own = words(complaint.title);
  const ownTime = new Date(complaint.createdAt).getTime();

  return candidates
    .filter((c) => c.id !== complaint.id && c.category === complaint.category)
    .map((c) => {
      const other = words(c.title);
      const shared = [...own].filter((w) => other.has(w)).length;
      const overlap = own.size ? shared / own.size : 0;

      const samePriority = c.priority === complaint.priority ? 1 : 0;
      const gapDays =
        Math.abs(ownTime - new Date(c.createdAt).getTime()) / 86400000;
      const recency = Math.max(0, 1 - gapDays / 30);

      const similarity = Math.min(
        0.99,
        0.62 + overlap * 0.24 + samePriority * 0.07 + recency * 0.06,
      );

      const km = 0.2 + hashUnit(c.id) * 2.6;
      return {
        ...c,
        similarity,
        distance: km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/** Mock object detection for an uploaded photo. */
export async function analyzeImage({ file, attempt = 0 } = {}) {
  await delay(1700);

  if (file && file.name) {
    const name = file.name.toLowerCase();
    if (name.includes("movie") || name.includes("poster") || name.includes("irrelevant") || name.includes("entertainment")) {
      return { isIrrelevant: true };
    }
  }

  const result = VISION_RESULTS[attempt % VISION_RESULTS.length];
  return {
    ...result,
    categoryLabel: labelFor(result.category),
    department: departmentFor(result.category),
    tags: ["road surface", "daylight", "geotagged"],
  };
}
