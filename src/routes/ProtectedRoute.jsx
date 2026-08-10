import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import { PATHS, ROLE_HOME } from "../utils/constants";

/**
 * Route guard for signed-in areas.
 *
 * This is a UI-level guard only — it keeps the demo navigation coherent.
 * Real authorisation must be enforced by the backend once it exists.
 *
 * @param {string[]} [allow] Roles permitted on this branch. Omit to allow any
 *   signed-in user.
 */
export default function ProtectedRoute({ allow }) {
  const { isAuthenticated, initialising, role } = useAuth();
  const location = useLocation();

  if (initialising) {
    return <LoadingSpinner full label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />;
  }

  if (allow && !allow.includes(role)) {
    return <Navigate to={ROLE_HOME[role] ?? PATHS.HOME} replace />;
  }

  return <Outlet />;
}
