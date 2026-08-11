import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import Modal from "../common/Modal";
import Button from "../common/Button";
import useAuth from "../../hooks/useAuth";
import useGrievances from "../../hooks/useGrievances";
import {
  NOTIFICATION_AUDIENCE,
  PATHS,
  ROLES,
  ROLE_LABELS,
} from "../../utils/constants";

/**
 * Dashboard top bar: menu toggle, search, notifications, user chip.
 *
 * Everything that differs between the two sides is derived from the signed-in
 * role rather than duplicated into a second component — an officer searching
 * lands in the officer queue, and the notification dot counts that role's own
 * unread feed instead of being permanently lit.
 */
export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const { notifications } = useGrievances();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(PATHS.LOGIN);
  };

  const isOfficer = user?.role === ROLES.OFFICER || user?.role === ROLES.ADMIN;
  const audience = isOfficer
    ? NOTIFICATION_AUDIENCE.OFFICER
    : NOTIFICATION_AUDIENCE.CITIZEN;

  const searchBase = isOfficer
    ? PATHS.OFFICER_COMPLAINTS
    : PATHS.CITIZEN_COMPLAINTS;
  const notificationsPath = isOfficer
    ? PATHS.OFFICER_NOTIFICATIONS
    : PATHS.CITIZEN_NOTIFICATIONS;

  const unread = notifications.filter(
    (item) => item.audience === audience && !item.read,
  ).length;

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn d-lg-none"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <i className="bi bi-list" aria-hidden="true" />
      </button>

      {title && <p className="topbar__title d-none d-md-block">{title}</p>}

      <form
        className="topbar__search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const q = query.trim();
          if (q) navigate(`${searchBase}?q=${encodeURIComponent(q)}`);
        }}
      >
        <div className="input-group-ds input-group-ds--icon">
          <i className="input-group-ds__icon bi bi-search" aria-hidden="true" />
          <input
            type="search"
            className="input-ds"
            placeholder="Search complaint ID, area…"
            aria-label="Search complaints"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </form>

      <div className="topbar__spacer" />

      <Link
        to={notificationsPath}
        className="icon-btn"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
      >
        <i className="bi bi-bell" aria-hidden="true" />
        {unread > 0 && <span className="icon-btn__dot" aria-hidden="true" />}
      </Link>

      <button 
        type="button" 
        className="icon-btn d-none d-sm-inline-flex" 
        aria-label="Help"
        onClick={() => setHelpOpen(true)}
      >
        <i className="bi bi-question-circle" aria-hidden="true" />
      </button>

      <div className="user-chip-wrap position-relative" ref={profileRef}>
        <button 
          type="button" 
          className="user-chip border-0 bg-transparent text-start"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          <Avatar name={user?.name} size="sm" />
          <span className="d-none d-md-block">
            <span className="user-chip__name d-block">{user?.name}</span>
            <span className="user-chip__role d-block">
              {ROLE_LABELS[user?.role] ?? "Citizen"}
            </span>
          </span>
        </button>
        
        {profileOpen && (
          <div className="dropdown-menu show position-absolute end-0 mt-2 shadow-sm" style={{ minWidth: '200px' }}>
            <Link 
              to={isOfficer ? PATHS.OFFICER_PROFILE : PATHS.CITIZEN_PROFILE} 
              className="dropdown-item py-2"
              onClick={() => setProfileOpen(false)}
            >
              <i className="bi bi-person me-2"></i> Profile / Settings
            </Link>
            <div className="dropdown-divider"></div>
            <button 
              type="button"
              className="dropdown-item py-2 text-danger" 
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </button>
          </div>
        )}
      </div>
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Help & Guidance"
        description="How to use the Civic Grievance Platform"
        footer={
          <Button variant="secondary" onClick={() => setHelpOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="stack-3">
          <h5>Submitting Complaints</h5>
          <p className="text-muted-soft small mb-3">
            Use the "Lodge Complaint" button. Describe the issue, upload a clear photo, or use the voice recorder to speak in your local language. Our AI will automatically categorize your complaint and assign a priority.
          </p>

          <h5>Tracking Progress</h5>
          <p className="text-muted-soft small mb-3">
            View your "My Complaints" dashboard to see real-time status updates. We'll notify you when an officer is assigned and when the issue is resolved.
          </p>

          <h5>Location Mapping</h5>
          <p className="text-muted-soft small mb-3">
            Ensure you grant location permissions so we can pinpoint the exact issue. Alternatively, manually type the nearest landmark.
          </p>
        </div>
      </Modal>
    </header>
  );
}
