import { getInitials } from "../../utils/formatters";

/** Initials avatar — no external image dependency. Tones: teal, ink. */
export default function Avatar({ name, size = "md", tone, className = "" }) {
  const classes = [
    "avatar",
    size !== "md" && `avatar--${size}`,
    tone && `avatar--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} title={name}>
      <span aria-hidden="true">{getInitials(name)}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}
