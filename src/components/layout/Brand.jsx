import { Link } from "react-router-dom";
import { APP_NAME, APP_SHORT_NAME, PATHS } from "../../utils/constants";

/**
 * Wordmark + CSS-drawn logo. `variant="inverse"` for dark surfaces.
 */
export default function Brand({
  variant = "default",
  to = PATHS.HOME,
  showTagline = true,
}) {
  return (
    <Link
      to={to}
      className={`brand${variant === "inverse" ? " brand--inverse" : ""}`}
      aria-label={`${APP_NAME} home`}
    >
      <span className="brand__mark" aria-hidden="true">
        <i className="bi bi-shield-check" />
      </span>
      <span className="brand__text">
        <span className="brand__name">{APP_SHORT_NAME}</span>
        {showTagline && (
          <span className="brand__tag">AI Grievance Platform</span>
        )}
      </span>
    </Link>
  );
}
