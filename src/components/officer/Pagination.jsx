/**
 * Pagination control for the officer queue.
 *
 * Page numbers are windowed around the current page so a long list does not
 * grow an unusable strip of buttons; the first and last page always stay
 * reachable in one click, with an ellipsis marking the gap.
 */
export default function Pagination({ page, pages, from, to, total, onChange }) {
  if (pages <= 1) {
    return (
      <p className="pager__summary" aria-live="polite">
        Showing {from}–{to} of {total}
      </p>
    );
  }

  const window = new Set([1, pages, page, page - 1, page + 1]);
  const numbers = [...window]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);

  return (
    <nav className="pager" aria-label="Complaint pages">
      <p className="pager__summary" aria-live="polite">
        Showing {from}–{to} of {total}
      </p>

      <div className="pager__controls">
        <button
          type="button"
          className="pager__btn"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <i className="bi bi-chevron-left" aria-hidden="true" />
        </button>

        {numbers.map((n, index) => (
          <span className="pager__slot" key={n}>
            {index > 0 && n - numbers[index - 1] > 1 && (
              <span className="pager__gap" aria-hidden="true">
                …
              </span>
            )}
            <button
              type="button"
              className={`pager__btn${n === page ? " pager__btn--active" : ""}`}
              onClick={() => onChange(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </button>
          </span>
        ))}

        <button
          type="button"
          className="pager__btn"
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          aria-label="Next page"
        >
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
