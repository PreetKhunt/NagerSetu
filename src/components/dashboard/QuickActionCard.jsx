import { Link } from "react-router-dom";

/**
 * Large tappable entry point for the primary dashboard tasks.
 * Renders a <Link> when `to` is given, otherwise a <button>, so the card is
 * always a real interactive element rather than a clickable div.
 */
export default function QuickActionCard({
  icon,
  title,
  description,
  tone = "primary",
  to,
  onClick,
}) {
  const body = (
    <>
      <span className={`icon-tile icon-tile--${tone}`} aria-hidden="true">
        <i className={`bi ${icon}`} />
      </span>

      <span className="quick-action__body">
        <span className="quick-action__title d-block">{title}</span>
        <span className="quick-action__desc d-block">{description}</span>
      </span>

      <i
        className="bi bi-arrow-right quick-action__arrow"
        aria-hidden="true"
      />
    </>
  );

  if (to) {
    return (
      <Link to={to} className="quick-action text-decoration-none">
        {body}
      </Link>
    );
  }

  return (
    <button type="button" className="quick-action" onClick={onClick}>
      {body}
    </button>
  );
}
