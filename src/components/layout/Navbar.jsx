import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Brand from "./Brand";
import Button from "../common/Button";
import Avatar from "../common/Avatar";
import useScrollPosition from "../../hooks/useScrollPosition";
import useAuth from "../../hooks/useAuth";
import { PATHS, ROLE_HOME } from "../../utils/constants";

const NAV_LINKS = [
  { label: "Platform", href: "#workflow" },
  { label: "Issues", href: "#issues" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
];

/** Public marketing navbar with a slide-in mobile drawer. */
export default function Navbar() {
  const scrolled = useScrollPosition(10);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Close the drawer whenever the route changes.
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

  const dashboardPath = isAuthenticated
    ? (ROLE_HOME[user?.role] ?? PATHS.CITIZEN_DASHBOARD)
    : PATHS.LOGIN;

  return (
    <>
      <header className={`navbar-ds${scrolled ? " navbar-ds--scrolled" : ""}`}>
        <div className="container navbar-ds__inner">
          <Brand />

          <nav className="navbar-ds__links" aria-label="Sections">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="navbar-ds__link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="navbar-ds__actions">
            <Button variant="ghost" size="sm" to={PATHS.TRACK} icon="bi-search">
              Track
            </Button>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="d-inline-flex align-items-center gap-2 text-decoration-none"
              >
                <Avatar name={user.name} size="sm" />
                <span className="fw-semibold small text-heading d-none d-xl-inline">
                  Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Button variant="secondary" size="sm" to={PATHS.LOGIN}>
                  Sign in
                </Button>
                <Button size="sm" to={PATHS.REGISTER} icon="bi-megaphone">
                  Report an issue
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="navbar-ds__toggle"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
          >
            <i className="bi bi-list" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`drawer-scrim${open ? " drawer-scrim--open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`drawer${open ? " drawer--open" : ""}`}
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        <div className="drawer__head">
          <Brand showTagline={false} />
          <button
            type="button"
            className="drawer__close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            tabIndex={open ? 0 : -1}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <nav className="drawer__links">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="drawer__link"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              {link.label}
            </a>
          ))}
          <Link
            to={PATHS.TRACK}
            className="drawer__link"
            tabIndex={open ? 0 : -1}
          >
            Track a complaint
          </Link>
        </nav>

        <div className="stack-2 mt-4">
          {isAuthenticated ? (
            <Button block to={dashboardPath} icon="bi-speedometer2">
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button block to={PATHS.REGISTER} icon="bi-megaphone">
                Report an issue
              </Button>
              <Button block variant="secondary" to={PATHS.LOGIN}>
                Sign in
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
