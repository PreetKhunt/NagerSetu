import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

/** Sidebar + topbar shell for every signed-in dashboard route. */
export default function DashboardLayout({ title }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the off-canvas sidebar on navigation.
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="dash">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="dash__main">
        <Topbar title={title} onMenuClick={() => setOpen(true)} />
        <main id="main" className="dash__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
