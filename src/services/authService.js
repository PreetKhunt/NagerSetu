/**
 * Auth service — UI-only.
 *
 * Resolves the demo profile locally so the interface is navigable. There is
 * no real authentication, no token verification and no password check.
 * Each function marks the endpoint it will call once the backend exists.
 */

import { DEMO_CITIZEN, DEMO_OFFICER } from "../utils/mockData";
import { ROLES } from "../utils/constants";

/** Simulates network latency so loading states are visible during review. */
const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TODO(api): POST /auth/login
 * Accepts any credentials and returns the profile for the chosen role.
 */
export async function login({ identifier, role = ROLES.CITIZEN }) {
  await delay();
  const base = role === ROLES.OFFICER ? DEMO_OFFICER : DEMO_CITIZEN;
  return {
    user: { ...base, role, identifier: identifier ?? base.email },
    token: "ui-only-session",
  };
}

/**
 * TODO(api): POST /auth/register
 * Echoes the submitted details back as a citizen profile.
 */
export async function register({ name, identifier, location }) {
  await delay(700);
  return {
    user: {
      ...DEMO_CITIZEN,
      id: "usr_new",
      name: name?.trim() || DEMO_CITIZEN.name,
      email: identifier?.includes("@") ? identifier : DEMO_CITIZEN.email,
      mobile: identifier?.includes("@") ? DEMO_CITIZEN.mobile : identifier,
      location: location?.trim() || DEMO_CITIZEN.location,
      role: ROLES.CITIZEN,
      verified: false,
      joinedAt: new Date().toISOString(),
    },
    token: "ui-only-session",
  };
}

/** One-tap demo entry used by the "Explore demo" buttons. */
export async function demoLogin(role = ROLES.CITIZEN) {
  await delay(300);
  const base = role === ROLES.OFFICER ? DEMO_OFFICER : DEMO_CITIZEN;
  return { user: { ...base, role }, token: "ui-only-session" };
}

/** TODO(api): POST /auth/logout */
export async function logout() {
  await delay(150);
  return true;
}
