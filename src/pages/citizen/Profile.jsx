import { useEffect, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import FormField from "../../components/common/FormField";
import SelectField from "../../components/common/SelectField";
import Segmented from "../../components/common/Segmented";
import Toggle from "../../components/common/Toggle";
import Modal from "../../components/common/Modal";
import StrengthMeter from "../../components/common/StrengthMeter";

import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import * as profileService from "../../services/profileService";
import { aadhaarVerificationService } from "../../services/AadhaarVerificationService";
import { LANGUAGES, PATHS } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import { isEmail, isMobile, passwordScore } from "../../utils/validators";

const APPEARANCE_OPTIONS = [
  { id: "light", label: "Light", icon: "bi-sun" },
  { id: "dark", label: "Dark", icon: "bi-moon-stars" },
  { id: "system", label: "System", icon: "bi-display" },
];

const NOTIFICATION_TOGGLES = [
  {
    key: "notifyStatus",
    icon: "bi-arrow-repeat",
    label: "Status changes",
    description: "When a complaint is assigned or work begins.",
  },
  {
    key: "notifyResolution",
    icon: "bi-check2-circle",
    label: "Resolution updates",
    description: "When an officer closes a complaint you reported.",
  },
  {
    key: "notifyNearby",
    icon: "bi-geo",
    label: "Issues near me",
    description: "Alerts about civic issues reported in your ward.",
  },
];

const CHANNEL_TOGGLES = [
  { key: "notifyEmail", icon: "bi-envelope", label: "Email" },
  { key: "notifySms", icon: "bi-chat-dots", label: "SMS" },
];

const EMPTY_PASSWORD = { current: "", next: "", confirm: "" };

/**
 * Citizen profile, preferences and security.
 *
 * Preferences persist through `profileService` (localStorage today, an API
 * later). Appearance is stored but not applied — the dark theme is a later
 * milestone, and the copy says so rather than shipping a dead switch.
 */
export default function Profile() {
  useDocumentTitle("Profile");

  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    location: "",
    language: "en",
  });
  const [errors, setErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [prefs, setPrefs] = useState(profileService.readPreferences);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState(EMPTY_PASSWORD);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);

  const [aadhaarOpen, setAadhaarOpen] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarReference, setAadhaarReference] = useState("");
  const [aadhaarStep, setAadhaarStep] = useState(1);
  const [linkingAadhaar, setLinkingAadhaar] = useState(false);
  const [aadhaarError, setAadhaarError] = useState("");
  const [aadhaarMessage, setAadhaarMessage] = useState("");

  // Seed the form from the session once the user object is available.
  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name ?? "",
      email: user.email ?? "",
      mobile: user.mobile ?? "",
      location: user.location ?? "",
      language: user.language ?? "en",
    });
  }, [user]);

  const set = (key) => (event) => {
    setProfile((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!profile.name.trim()) next.name = "Enter your full name";
    if (!profile.email.trim()) next.email = "Enter your email address";
    else if (!isEmail(profile.email)) next.email = "Enter a valid email address";
    if (!profile.mobile.trim()) next.mobile = "Enter your mobile number";
    else if (!isMobile(profile.mobile)) {
      next.mobile = "Enter a valid 10-digit mobile number";
    }
    if (!profile.location.trim()) next.location = "Enter your city or ward";
    return next;
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSavingProfile(true);
    try {
      const saved = await profileService.updateProfile(profile);
      updateUser(saved);
      toast.success("Profile updated", "Your details have been saved.");
    } catch {
      toast.error("Could not save", "Please try again in a moment.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePrefs = async (next) => {
    setPrefs(next);
    setSavingPrefs(true);
    try {
      await profileService.savePreferences(next);
    } catch {
      toast.error("Could not save preferences", "Please try again.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const togglePref = (key) => (checked) => savePrefs({ ...prefs, [key]: checked });

  const submitPassword = async (event) => {
    event.preventDefault();
    const found = {};
    if (!password.current) found.current = "Enter your current password";
    if (!password.next) found.next = "Choose a new password";
    else if (password.next.length < 8) found.next = "Use at least 8 characters";
    if (password.next !== password.confirm) {
      found.confirm = "Passwords do not match";
    }
    setPasswordErrors(found);
    if (Object.keys(found).length) return;

    setChangingPassword(true);
    try {
      await profileService.changePassword(password);
      setPasswordOpen(false);
      setPassword(EMPTY_PASSWORD);
      setPasswordErrors({});
      toast.success("Password changed", "Use your new password next time.");
    } catch (err) {
      setPasswordErrors({ current: err?.message ?? "Could not change password" });
    } finally {
      setChangingPassword(false);
    }
  };

  const requestAadhaarOtp = async (e) => {
    e.preventDefault();
    if (aadhaarNumber.replace(/\D/g, "").length !== 12) {
      setAadhaarError("Enter a valid 12-digit Aadhaar number");
      return;
    }
    setAadhaarError("");
    setLinkingAadhaar(true);
    try {
      const res = await aadhaarVerificationService.startVerification(aadhaarNumber.replace(/\D/g, ""));
      setAadhaarReference(res.referenceId);
      setAadhaarMessage(res.message || `OTP sent to mobile ending in ${res.maskedMobile}`);
      setAadhaarStep(2);
    } catch (err) {
      setAadhaarError(err.message || "Failed to start verification");
    } finally {
      setLinkingAadhaar(false);
    }
  };

  const verifyAadhaarOtp = async (e) => {
    e.preventDefault();
    if (!aadhaarOtp) {
      setAadhaarError("Enter OTP");
      return;
    }
    setLinkingAadhaar(true);
    setAadhaarError("");
    try {
      await aadhaarVerificationService.verifyOtp(aadhaarReference, aadhaarOtp);
      updateUser({ aadhaarLinked: true });
      setAadhaarOpen(false);
      setAadhaarStep(1);
      setAadhaarNumber("");
      setAadhaarOtp("");
      setAadhaarReference("");
      setAadhaarMessage("");
      toast.success("Aadhaar linked", "Your identity has been verified.");
    } catch (err) {
      setAadhaarError(err.message || "Failed to verify Aadhaar");
    } finally {
      setLinkingAadhaar(false);
    }
  };

  const strength = passwordScore(password.next);

  return (
    <div className="stack-5">
      <PageHeader
        title="Profile & settings"
        description="Your details, how we contact you, and account security."
        breadcrumbs={[
          { label: "Citizen", to: PATHS.CITIZEN_DASHBOARD },
          { label: "Profile" },
        ]}
      />

      <Card padding="lg" className="profile-hero">
        <Avatar name={user?.name} size="xl" />
        <div className="min-w-0">
          <h2 className="profile-hero__name">{user?.name}</h2>
          <p className="profile-hero__meta">
            <span>
              <i className="bi bi-geo-alt" aria-hidden="true" />
              {user?.location ?? "Location not set"}
            </span>
            {user?.joinedAt && (
              <span>
                <i className="bi bi-calendar3" aria-hidden="true" />
                Member since {formatDate(user.joinedAt)}
              </span>
            )}
          </p>
          <div className="cluster mt-3">
            {user?.verified && (
              <span className="chip chip--success">
                <i className="bi bi-patch-check-fill" aria-hidden="true" />
                Verified citizen
              </span>
            )}
            {user?.aadhaarLinked ? (
              <span className="chip chip--success">
                <i className="bi bi-shield-check" aria-hidden="true" />
                Aadhaar linked
              </span>
            ) : (
              <button 
                type="button" 
                className="chip chip--soft chip--interactive"
                onClick={() => setAadhaarOpen(true)}
              >
                <i className="bi bi-shield-lock" aria-hidden="true" />
                Aadhaar not linked
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="row g-4">
        {/* ---------- Personal details ---------- */}
        <div className="col-12 col-xl-7">
          <div className="stack-4">
            <Card padding="lg">
              <CardHeader
                title="Personal details"
                subtitle="Used to contact you about your complaints"
              />

              <form className="stack-4" onSubmit={saveProfile} noValidate>
                <FormField
                  label="Full name"
                  name="name"
                  icon="bi-person"
                  value={profile.name}
                  onChange={set("name")}
                  error={errors.name}
                  autoComplete="name"
                  required
                />

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <FormField
                      label="Email"
                      name="email"
                      type="email"
                      icon="bi-envelope"
                      value={profile.email}
                      onChange={set("email")}
                      error={errors.email}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <FormField
                      label="Mobile number"
                      name="mobile"
                      type="tel"
                      icon="bi-phone"
                      value={profile.mobile}
                      onChange={set("mobile")}
                      error={errors.mobile}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                <FormField
                  label="Location"
                  name="location"
                  icon="bi-geo-alt"
                  value={profile.location}
                  onChange={set("location")}
                  error={errors.location}
                  hint="Ward or locality — complaints you lodge default to this area."
                  required
                />

                <SelectField
                  label="Preferred language"
                  name="language"
                  icon="bi-translate"
                  value={profile.language}
                  onChange={set("language")}
                  options={LANGUAGES.map((l) => ({
                    value: l.code,
                    label: `${l.label} · ${l.native}`,
                  }))}
                  hint="Updates and officer replies are translated into this language."
                />

                <div className="cluster">
                  <Button type="submit" icon="bi-check-lg" loading={savingProfile}>
                    Save changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setProfile({
                        name: user?.name ?? "",
                        email: user?.email ?? "",
                        mobile: user?.mobile ?? "",
                        location: user?.location ?? "",
                        language: user?.language ?? "en",
                      });
                      setErrors({});
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Card>

            {/* ---------- Security ---------- */}
            <Card padding="lg">
              <CardHeader
                title="Security"
                subtitle="Keep your account protected"
              />

              <ul className="security">
                <li className="security__row">
                  <span className="security__icon" aria-hidden="true">
                    <i className="bi bi-key" />
                  </span>
                  <span className="security__text">
                    <span className="security__label">Password</span>
                    <span className="security__desc">
                      Last changed 3 months ago
                    </span>
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPasswordOpen(true)}
                  >
                    Change
                  </Button>
                </li>

                <li className="security__row">
                  <span className="security__icon" aria-hidden="true">
                    <i className="bi bi-shield-check" />
                  </span>
                  <span className="security__text">
                    <span className="security__label">
                      Two-factor authentication
                    </span>
                    <span className="security__desc">
                      OTP on login — arrives with the backend release.
                    </span>
                  </span>
                  <span className="chip chip--soft">Soon</span>
                </li>

                <li className="security__row">
                  <span className="security__icon" aria-hidden="true">
                    <i className="bi bi-laptop" />
                  </span>
                  <span className="security__text">
                    <span className="security__label">Active sessions</span>
                    <span className="security__desc">
                      This device only
                    </span>
                  </span>
                  <span className="chip chip--soft">1 device</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* ---------- Preferences ---------- */}
        <div className="col-12 col-xl-5">
          <div className="stack-4">
            <Card padding="lg">
              <CardHeader
                title="Notifications"
                subtitle="Choose what you hear about"
                action={
                  savingPrefs ? (
                    <span className="chip chip--soft">
                      <span className="btn-ds__spinner" aria-hidden="true" />
                      Saving
                    </span>
                  ) : null
                }
              />

              <div className="stack-2">
                {NOTIFICATION_TOGGLES.map((item) => (
                  <Toggle
                    key={item.key}
                    name={item.key}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    checked={prefs[item.key]}
                    onChange={togglePref(item.key)}
                  />
                ))}
              </div>

              <h3 className="prefs__subhead">Delivery channels</h3>
              <div className="stack-2">
                {CHANNEL_TOGGLES.map((item) => (
                  <Toggle
                    key={item.key}
                    name={item.key}
                    icon={item.icon}
                    label={item.label}
                    checked={prefs[item.key]}
                    onChange={togglePref(item.key)}
                  />
                ))}
              </div>
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Appearance"
                subtitle="How the dashboard looks on this device"
              />
              <Segmented
                options={APPEARANCE_OPTIONS}
                value={prefs.appearance}
                onChange={(value) => savePrefs({ ...prefs, appearance: value })}
                name="appearance"
                label="Theme"
              />
              <p className="prefs__note">
                <i className="bi bi-info-circle" aria-hidden="true" />
                Your choice is saved. The dark theme ships in the next release —
                the interface stays light until then.
              </p>
            </Card>

            <Card padding="lg" sunken>
              <CardHeader
                title="Data & privacy"
                subtitle="What we do with your reports"
              />
              <ul className="privacy">
                {[
                  "Complaint text and photos are shared only with the assigned department.",
                  "Your phone number is never shown publicly on a complaint.",
                  "Location is used to route the issue to the correct ward.",
                ].map((line) => (
                  <li key={line}>
                    <i className="bi bi-shield-check" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* ---------- Change password ---------- */}
      <Modal
        open={passwordOpen}
        onClose={() => {
          setPasswordOpen(false);
          setPasswordErrors({});
        }}
        title="Change password"
        description="Choose something you do not use on another site."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPasswordOpen(false)}
              disabled={changingPassword}
            >
              Cancel
            </Button>
            <Button
              icon="bi-key"
              loading={changingPassword}
              onClick={submitPassword}
            >
              Update password
            </Button>
          </>
        }
      >
        <form className="stack-4" onSubmit={submitPassword} noValidate>
          <FormField
            label="Current password"
            name="current-password"
            type="password"
            icon="bi-lock"
            value={password.current}
            onChange={(event) =>
              setPassword((c) => ({ ...c, current: event.target.value }))
            }
            error={passwordErrors.current}
            autoComplete="current-password"
            required
          />

          <FormField
            label="New password"
            name="new-password"
            type="password"
            icon="bi-key"
            value={password.next}
            onChange={(event) =>
              setPassword((c) => ({ ...c, next: event.target.value }))
            }
            error={passwordErrors.next}
            autoComplete="new-password"
            required
          >
            {password.next && <StrengthMeter score={strength} />}
          </FormField>

          <FormField
            label="Confirm new password"
            name="confirm-password"
            type="password"
            icon="bi-shield-lock"
            value={password.confirm}
            onChange={(event) =>
              setPassword((c) => ({ ...c, confirm: event.target.value }))
            }
            error={passwordErrors.confirm}
            autoComplete="new-password"
            required
          />

          <p className="text-muted-soft small mb-0">
            Authentication is not connected yet, so this updates the interface
            only — no credentials leave your browser.
          </p>
        </form>
      </Modal>

      {/* ---------- Aadhaar verification ---------- */}
      <Modal
        open={aadhaarOpen}
        onClose={() => {
          if (linkingAadhaar) return;
          setAadhaarOpen(false);
          setAadhaarError("");
          setAadhaarMessage("");
          setAadhaarStep(1);
        }}
        title="Link Aadhaar"
        description="Verify your identity using your Aadhaar number."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAadhaarOpen(false);
                setAadhaarError("");
                setAadhaarMessage("");
                setAadhaarStep(1);
              }}
              disabled={linkingAadhaar}
            >
              Cancel
            </Button>
            {aadhaarStep === 1 ? (
              <Button icon="bi-arrow-right" loading={linkingAadhaar} onClick={requestAadhaarOtp}>
                Request OTP
              </Button>
            ) : (
              <Button
                icon="bi-check-lg"
                loading={linkingAadhaar}
                onClick={verifyAadhaarOtp}
              >
                Verify & Link
              </Button>
            )}
          </>
        }
      >
        {aadhaarStep === 1 ? (
          <form className="stack-4" onSubmit={requestAadhaarOtp} noValidate>
            <FormField
              label="Aadhaar number"
              name="aadhaar-number"
              icon="bi-fingerprint"
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value)}
              error={aadhaarError}
              placeholder="0000 0000 0000"
              maxLength={12}
              required
            />
            <p className="text-muted-soft small mb-0">
              Your Aadhaar number is securely encrypted and never stored in plain text.
            </p>
          </form>
        ) : (
          <form className="stack-4" onSubmit={verifyAadhaarOtp} noValidate>
            <FormField
              label="OTP"
              name="aadhaar-otp"
              icon="bi-chat-dots"
              value={aadhaarOtp}
              onChange={(e) => setAadhaarOtp(e.target.value)}
              error={aadhaarError}
              placeholder="Enter OTP"
              required
            />
            {aadhaarMessage && (
              <p className="text-info small mb-2">
                <i className="bi bi-info-circle me-1" />
                {aadhaarMessage}
              </p>
            )}
            <p className="text-muted-soft small mb-0">
              Enter the OTP sent to your Aadhaar-linked mobile number.
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
}
