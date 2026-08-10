export default function LoadingSpinner({
  size = "md",
  inverse = false,
  label,
  full = false,
  className = "",
}) {
  const spinner = (
    <span
      className={[
        "spinner-ds",
        size !== "md" && `spinner-ds--${size}`,
        inverse && "spinner-ds--inverse",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label={label ?? "Loading"}
    />
  );

  if (!label && !full) {
    return <span className={className}>{spinner}</span>;
  }

  return (
    <div
      className={`spinner-wrap${full ? " spinner-wrap--full" : ""} ${className}`.trim()}
    >
      {spinner}
      {label && <p className="spinner-wrap__label">{label}</p>}
    </div>
  );
}
