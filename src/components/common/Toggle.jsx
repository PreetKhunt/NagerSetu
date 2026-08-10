import { useId } from "react";

/**
 * Preference switch. A real checkbox drives the visual, so keyboard focus,
 * the space key and form semantics all come for free.
 */
export default function Toggle({
  label,
  description,
  checked = false,
  onChange,
  name,
  disabled = false,
  icon,
}) {
  const reactId = useId();
  const id = `${name ?? "toggle"}-${reactId}`;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div className={`toggle-row${disabled ? " toggle-row--disabled" : ""}`}>
      <label className="toggle-row__text" htmlFor={id}>
        <span className="toggle-row__label">
          {icon && <i className={`bi ${icon}`} aria-hidden="true" />}
          {label}
        </span>
        {description && (
          <span className="toggle-row__desc" id={descId}>
            {description}
          </span>
        )}
      </label>

      <span className="switch-ds">
        <input
          type="checkbox"
          id={id}
          name={name}
          className="switch-ds__input"
          checked={checked}
          disabled={disabled}
          aria-describedby={descId}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span className="switch-ds__track" aria-hidden="true">
          <span className="switch-ds__thumb" />
        </span>
      </span>
    </div>
  );
}
