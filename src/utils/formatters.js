/**
 * Presentation helpers — pure functions, no side effects.
 */

/** "Good morning" / "Good afternoon" / "Good evening" from the local clock. */
export function getGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** First name only, so greetings stay short on mobile. */
export function firstName(fullName = "") {
  return String(fullName).trim().split(/\s+/)[0] || "there";
}

/** "AK" from "Ashok Kumar" — used by the avatar component. */
export function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** 12 Aug 2026 */
export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** 12 Aug 2026, 4:30 pm */
export function formatDateTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "3 days ago", "just now" — relative to now. */
export function timeAgo(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const units = [
    { limit: 3600, div: 60, name: "minute" },
    { limit: 86400, div: 3600, name: "hour" },
    { limit: 604800, div: 86400, name: "day" },
    { limit: 2629800, div: 604800, name: "week" },
    { limit: 31557600, div: 2629800, name: "month" },
    { limit: Infinity, div: 31557600, name: "year" },
  ];

  for (const u of units) {
    if (seconds < u.limit) {
      const n = Math.floor(seconds / u.div);
      return `${n} ${u.name}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "—";
}

/** 12,480 — Indian digit grouping. */
export function formatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-IN");
}

/** 1.2L / 12.4K for compact stat displays. */
export function compactNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

/** Clamp a 0–1 model score into a whole-percent string. */
export function toPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(Math.min(Math.max(n, 0), 1) * 100)}%`;
}

/** Trim long text to a word boundary. */
export function truncate(text = "", max = 120) {
  const s = String(text);
  if (s.length <= max) return s;
  return `${s.slice(0, s.lastIndexOf(" ", max) || max).trimEnd()}…`;
}
