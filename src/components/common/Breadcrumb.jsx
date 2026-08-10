import { Link } from "react-router-dom";

/**
 * Breadcrumb trail. Pass `items` as `[{ label, to }]`; the last entry is
 * rendered as the current page and is not linked.
 */
export default function Breadcrumb({ items = [], className = "" }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className={`breadcrumb-ds ${className}`.trim()}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="d-inline-flex align-items-center gap-1">
              {isLast || !item.to ? (
                <span className="breadcrumb-ds__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to}>{item.label}</Link>
              )}
              {!isLast && (
                <i
                  className="bi bi-chevron-right breadcrumb-ds__sep"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
