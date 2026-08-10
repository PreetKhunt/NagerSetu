import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./contexts";
import * as authService from "../services/authService";
import { ROLES, STORAGE_KEYS } from "../utils/constants";

/**
 * Auth provider — UI-only session state.
 *
 * Holds the "signed in" user in React state and mirrors it to localStorage so
 * a refresh does not bounce the user out of the dashboard during a demo.
 * This is NOT authentication: no password is verified and the token is a
 * placeholder string. Swap `authService` for real API calls later; this
 * provider's surface will not need to change.
 */
function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);

  // Resolve the stored session once on mount.
  useEffect(() => {
    setInitialising(false);
  }, []);

  const persist = useCallback((nextUser, token) => {
    if (nextUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(nextUser));
      if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      try {
        const { user: nextUser, token } = await authService.login(credentials);
        persist(nextUser, token);
        return nextUser;
      } finally {
        setLoading(false);
      }
    },
    [persist],
  );

  const register = useCallback(
    async (values) => {
      setLoading(true);
      try {
        const { user: nextUser, token } = await authService.register(values);
        persist(nextUser, token);
        return nextUser;
      } finally {
        setLoading(false);
      }
    },
    [persist],
  );

  const demoLogin = useCallback(
    async (role = ROLES.CITIZEN) => {
      setLoading(true);
      try {
        const { user: nextUser, token } = await authService.demoLogin(role);
        persist(nextUser, token);
        return nextUser;
      } finally {
        setLoading(false);
      }
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    persist(null);
  }, [persist]);

  /**
   * Merge fields into the session user after a profile save, so the sidebar
   * and topbar reflect the change without a reload. Keeps the stored token.
   */
  const updateUser = useCallback((patch) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      loading,
      initialising,
      login,
      register,
      demoLogin,
      logout,
      updateUser,
    }),
    [user, loading, initialising, login, register, demoLogin, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
