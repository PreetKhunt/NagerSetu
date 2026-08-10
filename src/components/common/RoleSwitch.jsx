import { ROLES } from "../../utils/constants";

const OPTIONS = [
  { role: ROLES.CITIZEN, label: "Citizen", icon: "bi-person" },
  { role: ROLES.OFFICER, label: "Officer", icon: "bi-building" },
];

/**
 * Segmented Citizen/Officer selector. Role-aware UI foundation — the chosen
 * role decides which dashboard the session lands on.
 */
export default function RoleSwitch({ value, onChange, label = "Sign in as" }) {
  return (
    <div className="field">
      <span className="field__label" id="role-switch-label">
        {label}
      </span>
      <div
        className="segmented"
        role="radiogroup"
        aria-labelledby="role-switch-label"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.role}
            type="button"
            role="radio"
            aria-checked={value === option.role}
            className={`segmented__btn${
              value === option.role ? " segmented__btn--active" : ""
            }`}
            onClick={() => onChange(option.role)}
          >
            <i className={`bi ${option.icon}`} aria-hidden="true" />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
