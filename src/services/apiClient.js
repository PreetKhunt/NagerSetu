/**
 * Central axios instance.
 *
 * No backend exists yet — nothing in the app calls this client. It is wired
 * up now so that connecting the real API later is a one-line change inside
 * each service module (swap the placeholder return for `apiClient.get(...)`).
 *
 * Base URL comes from `VITE_API_BASE_URL` (see .env.example).
 */

import axios from "axios";
import { STORAGE_KEYS } from "../utils/constants";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

/* ---------------- Request: attach bearer token ---------------- */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = localStorage.getItem(STORAGE_KEYS.LANG);
  if (lang) {
    config.headers["Accept-Language"] = lang;
  }
  return config;
});

/* ---------------- Response: normalise errors ---------------- */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;

    // Session expired — clear local state and let the router redirect.
    if (status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }

    return Promise.reject({
      status,
      message:
        error.response?.data?.detail ??
        error.response?.data?.message ??
        error.message ??
        "Something went wrong. Please try again.",
      original: error,
    });
  },
);

export default apiClient;
