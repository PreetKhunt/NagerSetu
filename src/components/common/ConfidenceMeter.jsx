import { toPercent } from "../../utils/formatters";

/**
 * Model confidence bar. Below 80% the tone drops to amber — showing a low
 * score honestly is more trustworthy than painting everything green.
 */
export default function ConfidenceMeter({
  value = 0,
  label = "AI confidence",
  size = "md",
}) {
  const pct = Math.round(Math.min(Math.max(Number(value) || 0, 0), 1) * 100);
  const tone = pct >= 90 ? "success" : pct >= 80 ? "teal" : "amber";

  return (
    <div className={`confidence${size === "sm" ? " confidence--sm" : ""}`}>
      <div className="confidence__head">
        <span className="confidence__label">
          <i className="bi bi-cpu" aria-hidden="true" />
          {label}
        </span>
        <span className="confidence__value num-tabular">{toPercent(value)}</span>
      </div>

      <div
        className={`confidence__track confidence__track--${tone}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <span className="confidence__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
