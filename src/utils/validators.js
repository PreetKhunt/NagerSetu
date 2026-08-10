/**
 * Lightweight form validation. UI-only for now; the same rules can be
 * mirrored server-side once the API exists.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const MOBILE_RE = /^[6-9]\d{9}$/;

export const isEmail = (v) => EMAIL_RE.test(String(v).trim());

/** Indian 10-digit mobile, optionally prefixed with +91 / 0. */
export const isMobile = (v) =>
  MOBILE_RE.test(String(v).replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""));

/** Login accepts either identifier. */
export const isEmailOrMobile = (v) => isEmail(v) || isMobile(v);

/**
 * Returns 0–4. Used by the strength meter and the "weak password" hint.
 */
export function passwordScore(password = "") {
  const p = String(password);
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score += 1;
  if (p.length >= 12) score += 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score += 1;
  return Math.min(score, 4);
}

export const PASSWORD_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

/** Validate the login form. Returns a field->message map. */
export function validateLogin({ identifier, password }) {
  const errors = {};
  if (!identifier?.trim()) {
    errors.identifier = "Enter your email or mobile number";
  } else if (!isEmailOrMobile(identifier)) {
    errors.identifier = "Enter a valid email or 10-digit mobile number";
  }
  if (!password) {
    errors.password = "Enter your password";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  return errors;
}

/** Validate the registration form. Returns a field->message map. */
export function validateRegister(values) {
  const { name, identifier, password, confirmPassword, location, acceptTerms } =
    values;
  const errors = {};

  if (!name?.trim()) {
    errors.name = "Enter your full name";
  } else if (name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters";
  }

  if (!identifier?.trim()) {
    errors.identifier = "Enter your email or mobile number";
  } else if (!isEmailOrMobile(identifier)) {
    errors.identifier = "Enter a valid email or 10-digit mobile number";
  }

  if (!password) {
    errors.password = "Choose a password";
  } else if (password.length < 8) {
    errors.password = "Use at least 8 characters";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Re-enter your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!location?.trim()) {
    errors.location = "Enter your city or ward";
  }

  if (!acceptTerms) {
    errors.acceptTerms = "Please accept the terms to continue";
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors ?? {}).length > 0;
