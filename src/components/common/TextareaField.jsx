import { useId } from "react";

/**
 * Multi-line text input with an optional live character counter.
 * Mirrors FormField's label/hint/error wiring so forms stay consistent.
 */
export default function TextareaField({
  label,
  name,
  value = "",
  onChange,
  onBlur,
  placeholder,
  hint,
  error,
  rows = 6,
  maxLength,
  showCount = false,
  required = false,
  ...rest
}) {
  const reactId = useId();
  const id = `${name}-${reactId}`;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const countId = showCount ? `${id}-count` : undefined;
  const describedBy =
    [errorId, hintId, countId].filter(Boolean).join(" ") || undefined;

  const length = String(value).length;
  const nearLimit = maxLength ? length > maxLength * 0.9 : false;

  return (
    <div className="field">
      <div className="field__row">
        <label className="field__label" htmlFor={id}>
          {label}
          {required && (
            <span className="field__req" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {showCount && (
          <span
            className={`field__count${nearLimit ? " field__count--warn" : ""}`}
            id={countId}
          >
            {/* Polite so typing does not spam the screen reader queue. */}
            <span aria-live="polite">{length}</span>
            {maxLength ? ` / ${maxLength}` : " characters"}
          </span>
        )}
      </div>

      <textarea
        id={id}
        name={name}
        rows={rows}
        className={`input-ds textarea-ds${error ? " input-ds--error" : ""}`}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        {...rest}
      />

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
