import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { GrievanceProvider } from "./context/GrievanceContext";
import ScrollToTop from "./routes/ScrollToTop";
import AppRoutes from "./routes/AppRoutes";
import * as profileService from "./services/profileService";

/**
 * Provider order matters: grievance state sits inside auth so a complaint can
 * be stamped with the signed-in citizen, and outside the routes so the public
 * tracking page reads the same store the dashboards write to.
 */
export default function App() {
  useEffect(() => {
    const applyTheme = () => {
      const prefs = profileService.readPreferences();
      const theme = prefs.appearance;
      if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-bs-theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    window.addEventListener("preferencesUpdated", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
      window.removeEventListener("preferencesUpdated", applyTheme);
    };
  }, []);

  return (
    <AuthProvider>
      <GrievanceProvider>
        <ToastProvider>
          <ScrollToTop />
          <AppRoutes />
        </ToastProvider>
      </GrievanceProvider>
    </AuthProvider>
  );
}
