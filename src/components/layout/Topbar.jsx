import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
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
  const { user } = useAuth();
  const { notifications } = useGrievances();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

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

      <button type="button" className="icon-btn d-none d-sm-inline-flex" aria-label="Help">
        <i className="bi bi-question-circle" aria-hidden="true" />
      </button>

      <div className="user-chip">
        <Avatar name={user?.name} size="sm" />
        <span className="d-none d-md-block text-start">
          <span className="user-chip__name d-block">{user?.name}</span>
          <span className="user-chip__role d-block">
            {ROLE_LABELS[user?.role] ?? "Citizen"}
          </span>
        </span>
      </div>
    </header>
  );
}
