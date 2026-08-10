import { STATUS_META } from "../../utils/constants";

/**
 * Complaint lifecycle badge. Falls back to a neutral tone for unknown values
 * so an unexpected API status never renders as an unstyled string.
 */
export default function StatusBadge({ status, size = "md", showIcon = true }) {
  const meta = STATUS_META[status] ?? {
    label: status ?? "Unknown",
    tone: "neutral",
    icon: "bi-question-circle",
  };

  return (
    <span
      className={`badge-ds badge-ds--${meta.tone}${
        size === "sm" ? " badge-ds--sm" : ""
      }`}
    >
      {showIcon ? (
        <i className={`bi ${meta.icon}`} aria-hidden="true" />
      ) : (
        <span className="badge-ds__dot" aria-hidden="true" />
      )}
      {meta.label}
    </span>
  );
}
