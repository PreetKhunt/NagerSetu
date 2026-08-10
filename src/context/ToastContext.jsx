import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./contexts";
import ToastStack from "../components/common/ToastStack";

/**
 * Toast provider — queue of transient notifications.
 * Consume via the `useToast` hook.
 */

const DEFAULT_DURATION = 4200;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ title, message, variant = "info", duration = DEFAULT_DURATION }) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, title, message, variant }]);

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => {
    const withVariant = (variant) => (title, message, options) =>
      push({ title, message, variant, ...options });

    return {
      toasts,
      push,
      dismiss,
      success: withVariant("success"),
      error: withVariant("error"),
      warning: withVariant("warning"),
      info: withVariant("info"),
    };
  }, [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
