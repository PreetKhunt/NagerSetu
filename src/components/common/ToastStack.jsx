import { createPortal } from "react-dom";

const ICONS = {
  success: "bi-check-circle-fill",
  error: "bi-exclamation-octagon-fill",
  warning: "bi-exclamation-triangle-fill",
  info: "bi-info-circle-fill",
};

/**
 * Renders the toast queue. Mounted once by ToastProvider — components should
 * use the `useToast` hook rather than importing this directly.
 */
export default function ToastStack({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return createPortal(
    <div className="toast-stack" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-ds toast-ds--${toast.variant}`}
          role={toast.variant === "error" ? "alert" : "status"}
          aria-live={toast.variant === "error" ? "assertive" : "polite"}
        >
          <i
            className={`toast-ds__icon bi ${ICONS[toast.variant] ?? ICONS.info}`}
            aria-hidden="true"
          />
          <div className="toast-ds__body">
            {toast.title && <p className="toast-ds__title">{toast.title}</p>}
            {toast.message && <p className="toast-ds__msg">{toast.message}</p>}
          </div>
          <button
            type="button"
            className="toast-ds__close"
            onClick={() => onDismiss?.(toast.id)}
            aria-label="Dismiss notification"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
