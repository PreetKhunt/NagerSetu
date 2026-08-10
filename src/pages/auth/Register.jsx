import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import RoleSwitch from "../../components/common/RoleSwitch";
import StrengthMeter from "../../components/common/StrengthMeter";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { validateRegister, hasErrors, passwordScore } from "../../utils/validators";
import { PATHS, ROLES, ROLE_HOME } from "../../utils/constants";

const EMPTY = {
  name: "",
  identifier: "",
  password: "",
  confirmPassword: "",
  location: "",
  acceptTerms: false,
};

/**
 * Account creation screen. Like Login, this is UI-only: the form validates
 * locally and hands the values to AuthContext, which mints a demo profile.
 */
export default function Register() {
  useDocumentTitle("Create an account");

  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState(EMPTY);
  const [role, setRole] = useState(ROLES.CITIZEN);
  const [errors, setErrors] = useState({});

  const score = passwordScore(values.password);

  const setField = (name) => (event) => {
    const next =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setValues((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    try {
      const user = await register({ ...values, role });
      toast.success(`Account created — welcome, ${user.name.split(" ")[0]}`);
      navigate(ROLE_HOME[user.role] ?? PATHS.CITIZEN_DASHBOARD, {
        replace: true,
      });
    } catch {
      toast.error("Could not create your account. Please try again.");
    }
  };

  return (
    <>
      <h1 className="auth__title">Create your account</h1>
      <p className="auth__sub">
        One account to report civic issues, follow the department handling them
        and see exactly when they close.
      </p>

      <div className="auth__card">
        <form onSubmit={handleSubmit} noValidate>
          <RoleSwitch value={role} onChange={setRole} label="Register as" />

          <FormField
            label="Full name"
            name="name"
            icon="bi-person"
            placeholder="Ashok Kulkarni"
            autoComplete="name"
            value={values.name}
            onChange={setField("name")}
            error={errors.name}
            required
          />

          <FormField
            label="Email or mobile number"
            name="identifier"
            icon="bi-envelope"
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
            placeholder="Create a password"
            autoComplete="new-password"
            value={values.password}
            onChange={setField("password")}
            error={errors.password}
            required
          >
            {!errors.password && <StrengthMeter score={score} />}
          </FormField>

          <FormField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            icon="bi-shield-lock"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={setField("confirmPassword")}
            error={errors.confirmPassword}
            required
          />

          <FormField
            label="City or ward"
            name="location"
            icon="bi-geo-alt"
            placeholder="Shivajinagar, Pune"
            autoComplete="address-level2"
            hint="Used to route your complaints to the right municipal zone."
            value={values.location}
            onChange={setField("location")}
            error={errors.location}
            required
          />

          <div className="field">
            <label className="check-ds auth__terms">
              <input
                type="checkbox"
                checked={values.acceptTerms}
                onChange={setField("acceptTerms")}
                aria-invalid={errors.acceptTerms ? true : undefined}
              />
              <span>
                I agree to the <Link to={PATHS.HOME}>Terms of Use</Link> and{" "}
                <Link to={PATHS.HOME}>Privacy Policy</Link>.
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="field__error" role="alert">
                <i className="bi bi-exclamation-circle" aria-hidden="true" />
                {errors.acceptTerms}
              </p>
            )}
          </div>

          <Button type="submit" block size="lg" loading={loading}>
            Create account
          </Button>
        </form>

        <div className="demo-note">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span>
            <strong>Prototype build</strong>
            Nothing is stored on a server yet. Submitting this form signs you
            into the {role === ROLES.OFFICER ? "officer" : "citizen"} dashboard
            with a demo profile.
          </span>
        </div>
      </div>

      <p className="auth__foot">
        Already registered? <Link to={PATHS.LOGIN}>Sign in</Link>
      </p>
    </>
  );
}
