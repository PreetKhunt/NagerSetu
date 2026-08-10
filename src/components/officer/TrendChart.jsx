import { useId } from "react";

/**
 * Two-series line chart drawn as inline SVG.
 *
 * No charting library: the project ships Bootstrap and nothing else for
 * visuals, and one SVG polyline is cheaper than adding a dependency for a
 * fourteen-point series. The viewBox scales to its container, so this is
 * responsive without a resize listener.
 *
 * `series` is the output of `complaintTrend` — one entry per day including
 * empty days, which keeps the x-axis a real timeline rather than a list of
 * days that happened to have activity.
 */
export default function TrendChart({ series = [], height = 220 }) {
  const clipId = useId();

  if (series.length < 2) {
    return (
      <p className="bar-list__empty">
        Not enough history yet — the trend needs at least two days of data.
      </p>
    );
  }

  const width = 640;
  const pad = { top: 16, right: 12, bottom: 28, left: 30 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const peak = Math.max(
    1,
    ...series.map((d) => Math.max(d.created, d.resolved)),
  );

  const x = (i) => pad.left + (i / (series.length - 1)) * plotW;
  const y = (v) => pad.top + plotH - (v / peak) * plotH;

  const line = (key) => series.map((d, i) => `${x(i)},${y(d[key])}`).join(" ");
  const area = (key) =>
    `${pad.left},${pad.top + plotH} ${line(key)} ${pad.left + plotW},${pad.top + plotH}`;

  // At most five labels, so a 30-day range does not overlap its own axis.
  const step = Math.max(1, Math.ceil(series.length / 5));
  const ticks = series
    .map((d, i) => ({ i, date: new Date(d.date) }))
    .filter(({ i }) => i % step === 0 || i === series.length - 1);

  const totals = series.reduce(
    (acc, d) => ({
      created: acc.created + d.created,
      resolved: acc.resolved + d.resolved,
    }),
    { created: 0, resolved: 0 },
  );

  return (
    <figure className="trend">
      <figcaption className="trend__legend">
        <span className="trend__key trend__key--created">
          Filed <strong>{totals.created}</strong>
        </span>
        <span className="trend__key trend__key--resolved">
          Resolved <strong>{totals.resolved}</strong>
        </span>
      </figcaption>

      {/* Scrolls inside itself on narrow screens: letting the SVG shrink to
          320px would take the axis labels down with it, and an unreadable
          chart is worse than one the reader nudges sideways. */}
      <div className="trend__scroll">
        <svg
          className="trend__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Daily complaints over the last ${series.length} days: ${totals.created} filed, ${totals.resolved} resolved.`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={pad.left} y={pad.top} width={plotW} height={plotH} />
            </clipPath>
          </defs>

          {/* Horizontal guides at 0, half and peak. */}
          {[0, peak / 2, peak].map((value) => (
            <g key={value}>
              <line
                className="trend__grid"
                x1={pad.left}
                x2={pad.left + plotW}
                y1={y(value)}
                y2={y(value)}
              />
              <text className="trend__axis" x={pad.left - 8} y={y(value) + 4} textAnchor="end">
                {Math.round(value)}
              </text>
            </g>
          ))}

          <g clipPath={`url(#${clipId})`}>
            <polygon className="trend__area" points={area("created")} />
            <polyline className="trend__line trend__line--created" points={line("created")} />
            <polyline className="trend__line trend__line--resolved" points={line("resolved")} />
          </g>

          {series.map((d, i) => (
            <circle
              className="trend__dot trend__dot--created"
              key={d.date}
              cx={x(i)}
              cy={y(d.created)}
              r={2.5}
            >
              {/* One interpolated string, not text+value children — an SVG
                  <title> is read as a single text node, so React rejects an
                  array here. */}
              <title>{`${new Date(d.date).toDateString()}: ${d.created} filed, ${d.resolved} resolved`}</title>
            </circle>
          ))}

          {ticks.map(({ i, date }) => (
            <text
              className="trend__axis"
              key={i}
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
            >
              {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </text>
          ))}
        </svg>
      </div>
    </figure>
  );
}
