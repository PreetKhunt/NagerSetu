import Button from "./Button";

/**
 * Shown when a list has no data. Always give the user the next action —
 * an empty screen with no way forward is a dead end.
 */
export default function EmptyState({
  icon = "bi-inbox",
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel,
  secondaryTo,
  onSecondary,
  className = "",
}) {
  return (
    <div className={`empty-ds ${className}`.trim()}>
      <span className="empty-ds__art" aria-hidden="true">
        <i className={`bi ${icon}`} />
      </span>

      {title && <h3 className="empty-ds__title">{title}</h3>}
      {description && <p className="empty-ds__desc">{description}</p>}

      {(actionLabel || secondaryLabel) && (
        <div className="cluster justify-content-center">
          {actionLabel && (
            <Button to={actionTo} onClick={onAction} icon="bi-plus-lg">
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button variant="secondary" to={secondaryTo} onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
