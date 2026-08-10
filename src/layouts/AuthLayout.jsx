import { Link, Outlet } from "react-router-dom";
import Brand from "../components/layout/Brand";
import { PATHS } from "../utils/constants";

const HIGHLIGHTS = [
  {
    icon: "bi-mic",
    title: "Report by voice",
    text: "Speak the problem in your own language — no typing, no forms.",
  },
  {
    icon: "bi-cpu",
    title: "AI does the paperwork",
    text: "Category, department and priority are predicted the moment you submit.",
  },
  {
    icon: "bi-activity",
    title: "Track every stage",
    text: "Registered, Assigned, In Progress, Resolved — timestamped and visible.",
  },
];

/** Split-screen shell shared by /login and /register. */
export default function AuthLayout() {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <span className="glow glow--teal auth__aside-glow" aria-hidden="true" />
        <span className="bg-dots-inverse" aria-hidden="true" />

        <div className="position-relative">
          <Brand variant="inverse" />
        </div>

        <div className="position-relative">
          <h2 className="auth__aside-title text-balance">
            Civic issues, resolved with less friction.
          </h2>
          <p className="auth__aside-text">
            One account lets you report problems on your street, follow the
            department handling them and see exactly when they close.
          </p>

          <ul className="auth__aside-list">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="auth__aside-item">
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>
                  <strong>{item.title}</strong>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth__aside-text mb-0 position-relative small">
          Built for Smart India Hackathon.
        </p>
      </aside>

      <div className="auth__main">
        <div className="auth__topbar">
          <Brand />
          <Link to={PATHS.HOME} className="btn-ds btn-ds--ghost btn-ds--sm">
            <i className="btn-ds__icon bi bi-arrow-left" aria-hidden="true" />
            <span>Back to home</span>
          </Link>
        </div>

        <main className="auth__form-wrap" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
