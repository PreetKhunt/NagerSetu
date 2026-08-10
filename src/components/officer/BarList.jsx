/**
 * Horizontal bar breakdown — categories, departments, priorities.
 *
 * Bars are scaled against the largest value in the set rather than the total,
 * so a distribution where one bucket holds most of the queue still shows the
 * smaller buckets at a readable length instead of flattening them to a sliver.
 * The percentage in the caption is of the total, which is the number the
 * officer actually reads.
 */
export default function BarList({ items = [], emptyLabel = "Nothing to show yet.", tone = "primary" }) {
  const total = items.reduce((sum, item) => sum + (item.value ?? 0), 0);
  const peak = items.reduce((max, item) => Math.max(max, item.value ?? 0), 0);

  if (!items.length || total === 0) {
    return <p className="bar-list__empty">{emptyLabel}</p>;
  }

  return (
    <ul className="bar-list">
      {items.map((item) => {
        const value = item.value ?? 0;
        const width = peak ? (value / peak) * 100 : 0;
        const share = total ? Math.round((value / total) * 100) : 0;

        return (
          <li className="bar-list__item" key={item.key ?? item.label}>
            <div className="bar-list__head">
              <span className="bar-list__label">
                {item.icon && <i className={`bi ${item.icon}`} aria-hidden="true" />}
                {item.label}
              </span>
              <span className="bar-list__value">
                {value}
                <span className="bar-list__share">{share}%</span>
              </span>
            </div>

            <div
              className={`bar-list__track bar-list__track--${tone}`}
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${item.label}: ${value} of ${total}`}
            >
              <span className="bar-list__fill" style={{ width: `${width}%` }} />
            </div>

            {item.hint && <p className="bar-list__hint">{item.hint}</p>}
          </li>
        );
      })}
    </ul>
  );
}
