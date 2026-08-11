/**
 * Profile & preferences — UI only.
 *
 * Preferences persist to localStorage so the profile screen survives a reload
 * during a demo. Nothing here talks to a server.
 * TODO(api): swap for GET/PATCH /me and /me/preferences.
 */

import { DEFAULT_PREFERENCES } from "../utils/mockData";
import { STORAGE_KEYS } from "../utils/constants";

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export function readPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    return raw
      ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
      : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/** TODO(api): PATCH /me/preferences */
export async function savePreferences(prefs) {
  await delay();
  localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
  window.dispatchEvent(new Event("preferencesUpdated"));
  return { ...prefs };
}

/** TODO(api): PATCH /me */
export async function updateProfile(profile) {
  await delay(700);
  return { ...profile };
}

/** TODO(api): POST /me/password — never send the current password in the clear. */
export async function changePassword({ current }) {
  await delay(900);
  if (!current) {
    throw { status: 400, message: "Enter your current password" };
  }
  return { ok: true };
}

/** TODO(api): POST /me/aadhaar/verify */
export async function verifyAadhaar(aadhaarNumber, otp) {
  await delay(1200);
  if (otp !== "123456") {
    throw new Error("Invalid OTP");
  }
  return { ok: true };
}
