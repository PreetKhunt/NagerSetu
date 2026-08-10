/** Shared heading block for landing-page sections. */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  inverse = false,
  className = "",
}) {
  return (
    <div
      className={`sec-head${align === "center" ? " sec-head--center" : ""} ${className}`.trim()}
    >
      {eyebrow && (
        <span
          className={`eyebrow${inverse ? " eyebrow--inverse" : ""}${
            align === "center" ? " eyebrow--center" : ""
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2 className="sec-head__title">{title}</h2>
      {description && <p className="sec-head__desc">{description}</p>}
    </div>
  );
}
