import { formatNumber } from "../../utils/formatters";

/**
 * Dashboard metric tile.
 *
 * `progress` (0–100) draws the thin bar at the bottom — useful for showing a
 * count as a share of the total. `trend` renders the delta chip.
 */
export default function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  hint,
  trend,
  progress,
  loading = false,
}) {
  if (loading) {
    return (
      <div className={`stat-ds stat-ds--${tone}`}>
        <div className="stat-ds__top">
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton--text" style={{ width: "55%" }} />
            <div
              className="skeleton"
              style={{ height: 30, width: "38%", marginTop: 12 }}
            />
          </div>
          <div className="skeleton skeleton--circle" style={{ width: 36, height: 36 }} />
        </div>
        <div className="skeleton skeleton--text" style={{ width: "70%" }} />
      </div>
    );
  }

  const trendClass = trend
    ? `stat-ds__trend--${trend.direction ?? "flat"}`
    : null;
  const trendIcon = {
    up: "bi-arrow-up-short",
    down: "bi-arrow-down-short",
    flat: "bi-dash",
  }[trend?.direction ?? "flat"];

  return (
    <div className={`stat-ds stat-ds--${tone}`}>
      <div className="stat-ds__top">
        <div>
          <p className="stat-ds__label">{label}</p>
          <p className="stat-ds__value">
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
        </div>
        {icon && (
          <span className={`icon-tile icon-tile--sm icon-tile--${tone}`}>
            <i className={`bi ${icon}`} aria-hidden="true" />
          </span>
        )}
      </div>

      {(hint || trend) && (
        <p className="stat-ds__meta">
          {trend && (
            <span className={`stat-ds__trend ${trendClass}`}>
              <i className={`bi ${trendIcon}`} aria-hidden="true" />
              {trend.value}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </p>
      )}

      {typeof progress === "number" && (
        <div
          className="mini-bar"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} share of total`}
        >
          <div
            className="mini-bar__fill"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
