import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { GrievanceProvider } from "./context/GrievanceContext";
import ScrollToTop from "./routes/ScrollToTop";
import AppRoutes from "./routes/AppRoutes";

/**
 * Provider order matters: grievance state sits inside auth so a complaint can
 * be stamped with the signed-in citizen, and outside the routes so the public
 * tracking page reads the same store the dashboards write to.
 */
export default function App() {
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
