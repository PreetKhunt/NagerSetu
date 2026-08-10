import { Link } from "react-router-dom";

/**
 * The single button primitive for the whole app.
 *
 * Renders a <button>, a react-router <Link> (`to`) or an <a> (`href`)
 * depending on which prop is supplied, so every call site gets identical
 * styling and focus behaviour.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  block = false,
  pill = false,
  loading = false,
  disabled = false,
  to,
  href,
  className = "",
  type = "button",
  ...rest
}) {
  const classes = [
    "btn-ds",
    `btn-ds--${variant}`,
    size !== "md" && `btn-ds--${size}`,
    block && "btn-ds--block",
    pill && "btn-ds--pill",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading && <span className="btn-ds__spinner" aria-hidden="true" />}
      {!loading && icon && (
        <i className={`btn-ds__icon bi ${icon}`} aria-hidden="true" />
      )}
      <span>{children}</span>
      {iconRight && !loading && (
        <i className={`btn-ds__icon bi ${iconRight}`} aria-hidden="true" />
      )}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}
