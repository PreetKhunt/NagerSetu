/**
 * Generic surface container. Use `as="button"` for clickable cards so the
 * element stays keyboard accessible instead of a div with an onClick.
 */
export default function Card({
  children,
  as: Tag = "div",
  padding = "md",
  hover = false,
  flat = false,
  sunken = false,
  rail = false,
  inverse = false,
  className = "",
  ...rest
}) {
  const padClass = {
    none: null,
    sm: "card-ds--pad-sm",
    md: "card-ds--pad",
    lg: "card-ds--pad-lg",
  }[padding];

  const classes = [
    "card-ds",
    padClass,
    hover && "card-ds--hover",
    flat && "card-ds--flat",
    sunken && "card-ds--sunken",
    rail && "card-ds--rail",
    inverse && "card-ds--inverse",
    (Tag === "button" || rest.onClick) && "card-ds--interactive",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`card-ds__header ${className}`.trim()}>
      <div>
        {title && <h3 className="card-ds__title">{title}</h3>}
        {subtitle && <p className="card-ds__subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardFooter({ children, className = "" }) {
  return <div className={`card-ds__footer ${className}`.trim()}>{children}</div>;
}
