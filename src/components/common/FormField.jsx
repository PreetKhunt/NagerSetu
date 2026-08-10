import { useId, useState } from "react";

/**
 * Labelled input with optional leading icon, password reveal toggle,
 * hint text and error message. Used by every form in the app so field
 * markup and a11y wiring live in one place.
 */
export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  icon,
  placeholder,
  hint,
  error,
  required = false,
  autoComplete,
  children,
  ...rest
}) {
  const reactId = useId();
  const id = `${name}-${reactId}`;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const groupClasses = [
    "input-group-ds",
    icon && "input-group-ds--icon",
    isPassword && "input-group-ds--action",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className={groupClasses}>
        {icon && (
          <i
            className={`input-group-ds__icon bi ${icon}`}
            aria-hidden="true"
          />
        )}

        <input
          id={id}
          name={name}
          type={inputType}
          className={`input-ds${error ? " input-ds--error" : ""}`}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            className="input-group-ds__action"
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
          >
            <i
              className={`bi ${revealed ? "bi-eye-slash" : "bi-eye"}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {children}

      {error && (
        <p className="field__error" id={errorId} role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
