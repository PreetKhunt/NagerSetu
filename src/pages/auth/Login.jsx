import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import RoleSwitch from "../../components/common/RoleSwitch";
import Modal from "../../components/common/Modal";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { validateLogin, hasErrors } from "../../utils/validators";
import { PATHS, ROLES, ROLE_HOME } from "../../utils/constants";

const EMPTY = { identifier: "", password: "" };

/**
 * Sign-in screen. Authentication is UI-only: the form validates input and
 * hands the chosen role to AuthContext, which resolves a demo profile.
 */
export default function Login() {
  useDocumentTitle("Sign in");

  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, loading } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState(EMPTY);
  const [role, setRole] = useState(ROLES.CITIZEN);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [forgotOpen, setForgotOpen] = useState(false);

  const redirectTo = location.state?.from?.pathname;

  const setField = (name) => (event) => {
    setValues((prev) => ({ ...prev, [name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const goToDashboard = (user) => {
    navigate(redirectTo ?? ROLE_HOME[user.role] ?? PATHS.CITIZEN_DASHBOARD, {
      replace: true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    try {
      const user = await login({ ...values, role });
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      goToDashboard(user);
    } catch {
      toast.error("Could not sign you in. Please try again.");
    }
  };

  const handleDemo = async () => {
    try {
      const user = await demoLogin(role);
      toast.info("Signed in with the demo profile");
      goToDashboard(user);
    } catch {
      toast.error("Demo sign-in failed. Please try again.");
    }
  };

  return (
    <>
      <h1 className="auth__title">Sign in to your account</h1>
      <p className="auth__sub">
        Report a civic issue, or pick up where you left off on an existing
        complaint.
      </p>

      <div className="auth__card">
        <form onSubmit={handleSubmit} noValidate>
          <RoleSwitch value={role} onChange={setRole} />

          <FormField
            label="Email or mobile number"
            name="identifier"
            icon="bi-person"
            placeholder="you@example.com or 9876543210"
            autoComplete="username"
            value={values.identifier}
            onChange={setField("identifier")}
            error={errors.identifier}
            required
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            icon="bi-lock"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={values.password}
            onChange={setField("password")}
            error={errors.password}
            required
          />

          <div className="auth__row">
            <label className="check-ds">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember me
            </label>

            <button
              type="button"
              className="btn-ds btn-ds--link"
              onClick={() => setForgotOpen(true)}
            >
              <span>Forgot password?</span>
            </button>
          </div>

          <Button type="submit" block size="lg" loading={loading}>
            Sign in
          </Button>

          <div className="auth__divider">or</div>

          <Button
            type="button"
            variant="secondary"
            block
            icon="bi-play-circle"
            onClick={handleDemo}
            disabled={loading}
          >
            Continue with demo account
          </Button>
        </form>


      </div>

      <p className="auth__foot">
        New to NagarSetu? <Link to={PATHS.REGISTER}>Create an account</Link>
      </p>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reset your password"
        description="We will send a reset link to the account you enter below."
        footer={
          <>
            <Button variant="ghost" onClick={() => setForgotOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setForgotOpen(false);
                toast.info("Password reset is not wired up in this prototype");
              }}
            >
              Send reset link
            </Button>
          </>
        }
      >
        <FormField
          label="Email or mobile number"
          name="reset-identifier"
          icon="bi-envelope"
          placeholder="you@example.com or 9876543210"
          defaultValue=""
        />
      </Modal>
    </>
  );
}
