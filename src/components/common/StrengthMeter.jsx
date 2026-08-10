import { PASSWORD_LABELS } from "../../utils/validators";

const TONES = ["", "weak", "fair", "good", "strong"];

/**
 * Four-segment password strength meter, rendered under a password field.
 * Shared by registration and the profile's change-password dialog so both
 * score the same way and look identical.
 */
export default function StrengthMeter({ score = 0, hint = true }) {
  const tone = TONES[score];

  return (
    <>
      <div
        className="strength"
        role="img"
        aria-label={`Password strength: ${PASSWORD_LABELS[score] || "too short"}`}
      >
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`strength__bar${
              step <= score ? ` strength__bar--${tone}` : ""
            }`}
          />
        ))}
      </div>

      {hint && (
        <p className="field__hint">
          {score
            ? `Strength: ${PASSWORD_LABELS[score]}`
            : "Use 8+ characters with a mix of letters, numbers and symbols."}
        </p>
      )}
    </>
  );
}
