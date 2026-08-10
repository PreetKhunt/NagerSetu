import { NavLink } from "react-router-dom";
import Brand from "./Brand";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import useAuth from "../../hooks/useAuth";
import {
  PATHS,
  ROLES,
  ROLE_LABELS,
  VOICE_COMPLAINT_PATH,
} from "../../utils/constants";

const CITIZEN_NAV = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", to: PATHS.CITIZEN_DASHBOARD, icon: "bi-grid-1x2" },
      {
        label: "My complaints",
        to: PATHS.CITIZEN_COMPLAINTS,
        icon: "bi-card-checklist",
        // Detail pages live under this path, so the link stays highlighted.
        end: false,
      },
      {
        label: "Notifications",
        to: PATHS.CITIZEN_NOTIFICATIONS,
        icon: "bi-bell",
      },
    ],
  },
  {
    title: "Report",
    items: [
      {
        label: "Lodge complaint",
        to: PATHS.CITIZEN_NEW,
        icon: "bi-plus-square",
      },
      {
        label: "Voice complaint",
        to: VOICE_COMPLAINT_PATH,
        icon: "bi-mic",
      },
      { label: "Track complaint", to: PATHS.TRACK, icon: "bi-search" },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Profile",
        to: PATHS.CITIZEN_PROFILE,
        icon: "bi-person-gear",
      },
    ],
  },
];

const OFFICER_NAV = [
  {
    title: "Command centre",
    items: [
      { label: "Dashboard", to: PATHS.OFFICER_DASHBOARD, icon: "bi-grid-1x2" },
      {
        label: "Complaints",
        to: PATHS.OFFICER_COMPLAINTS,
        icon: "bi-list-check",
        // Detail pages live under this path, so the link stays highlighted.
        end: false,
      },
      { label: "Map", to: PATHS.OFFICER_MAP, icon: "bi-geo-alt" },
    ],
  },
  {
    title: "Insight",
    items: [
      { label: "Analytics", to: PATHS.OFFICER_ANALYTICS, icon: "bi-graph-up" },
      {
        label: "Departments",
        to: PATHS.OFFICER_DEPARTMENTS,
        icon: "bi-buildings",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Notifications",
        to: PATHS.OFFICER_NOTIFICATIONS,
        icon: "bi-bell",
      },
      { label: "Profile", to: PATHS.OFFICER_PROFILE, icon: "bi-person-gear" },
    ],
  },
];

/**
 * Dashboard sidebar. On mobile it becomes an off-canvas panel driven by
 * `open` / `onClose` from DashboardLayout.
 */
export default function Sidebar({ open = false, onClose }) {
  const { user, logout } = useAuth();
  const sections = user?.role === ROLES.OFFICER ? OFFICER_NAV : CITIZEN_NAV;

  return (
    <>
      <div
        className={`drawer-scrim d-lg-none${open ? " drawer-scrim--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`sidebar${open ? " sidebar--open" : ""}`}
        aria-label="Dashboard navigation"
      >
        <div className="sidebar__head">
          <Brand showTagline={false} />
          <button
            type="button"
            className="drawer__close d-lg-none"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar__nav">
          {sections.map((section) => (
            <div key={section.title} className="sidebar__group">
              <p className="sidebar__label">{section.title}</p>
              {section.items.map((item) =>
                item.soon ? (
                  // Not routed yet — rendered inert so it cannot 404.
                  <span
                    key={item.label}
                    className="sidebar__link sidebar__link--soon"
                    aria-disabled="true"
                  >
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span>{item.label}</span>
                    <span className="sidebar__pill">Soon</span>
                  </span>
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end !== false}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar__link${isActive ? " sidebar__link--active" : ""}`
                    }
                  >
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__user">
            <Avatar name={user?.name} size="sm" />
            <div className="min-w-0">
              <p className="sidebar__user-name">{user?.name}</p>
              <p className="sidebar__user-role">
                {ROLE_LABELS[user?.role] ?? "Citizen"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            block
            icon="bi-box-arrow-left"
            onClick={logout}
          >
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
