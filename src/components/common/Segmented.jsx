import { useId } from "react";

/**
 * Tab-style control for switching between a small set of modes.
 * Uses the existing `.segmented` styles; render as radios so arrow keys and
 * screen readers work without custom key handling.
 */
export default function Segmented({
  options,
  value,
  onChange,
  name,
  label,
  className = "",
}) {
  const reactId = useId();
  const groupName = name ?? `segmented-${reactId}`;

  return (
    <div
      className={`segmented ${className}`.trim()}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => {
        const id = `${groupName}-${option.id}`;
        const active = option.id === value;

        return (
          <label
            key={option.id}
            className={`segmented__btn${active ? " segmented__btn--active" : ""}`}
            htmlFor={id}
          >
            <input
              type="radio"
              id={id}
              name={groupName}
              className="sr-only"
              value={option.id}
              checked={active}
              onChange={() => onChange(option.id)}
            />
            {option.icon && (
              <i className={`bi ${option.icon}`} aria-hidden="true" />
            )}
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
