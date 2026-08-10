import { PRIORITY_META } from "../../utils/constants";

/**
 * AI-detected priority badge. The `AI` affordance is opt-in via `showSource`
 * so the same badge works for manually escalated complaints too.
 */
export default function PriorityBadge({
  priority,
  size = "md",
  showSource = false,
}) {
  const meta = PRIORITY_META[priority] ?? {
    label: priority ?? "Unset",
    tone: "neutral",
    icon: "bi-dash-circle",
  };

  return (
    <span
      className={`badge-ds badge-ds--${meta.tone}${
        size === "sm" ? " badge-ds--sm" : ""
      }`}
      title={showSource ? "Priority detected by AI" : undefined}
    >
      <i className={`bi ${meta.icon}`} aria-hidden="true" />
      {meta.label}
      {showSource && <span className="sr-only"> priority, detected by AI</span>}
    </span>
  );
}
