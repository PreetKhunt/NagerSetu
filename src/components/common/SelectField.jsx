import { useId } from "react";

/**
 * Native select in the design system's field wrapper.
 * Native is deliberate: it gets correct touch behaviour on mobile for free.
 */
export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  hint,
  error,
  icon,
  required = false,
  ...rest
}) {
  const reactId = useId();
  const id = `${name}-${reactId}`;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

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

      <div
        className={`input-group-ds${icon ? " input-group-ds--icon" : ""} select-ds__wrap`}
      >
        {icon && (
          <i className={`input-group-ds__icon bi ${icon}`} aria-hidden="true" />
        )}

        <select
          id={id}
          name={name}
          className={`input-ds select-ds${error ? " input-ds--error" : ""}`}
          value={value}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
          aria-required={required || undefined}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <i className="select-ds__caret bi bi-chevron-down" aria-hidden="true" />
      </div>

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
