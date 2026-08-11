/**
 * State transitions for the grievance store.
 *
 * Kept out of the provider file so it can be exercised directly by the
 * behaviour check (and, later, by a real test runner) without mounting React —
 * and so the provider stays a component-only module for fast refresh.
 *
 * Every transition is pure: it takes the whole store and returns a new one.
 * Persistence is the provider's job, which is why nothing here touches storage.
 */

import {
  applyAssignment,
  applyStatusChange,
  buildNotification,
  notificationForStatus,
  seedState,
} from "../services/grievanceService";
import { NOTIFICATION_AUDIENCE, NOTIFICATION_TYPES } from "../utils/constants";

export const ACTIONS = {
  SET_COMPLAINTS: "set_complaints",
  CREATE: "create",
  STATUS: "status",
  ASSIGN: "assign",
  READ_NOTIFICATION: "read_notification",
  READ_ALL: "read_all",
  RESET: "reset",
  CLEAR: "clear",
};

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_COMPLAINTS:
      return {
        ...state,
        complaints: action.complaints,
      };

    case ACTIONS.CREATE: {
      const c = action.complaint || {};
      const catLabel = c.categoryLabel || c.category || "Civic Issue";
      const dept = c.department || "Municipal Department";

      const notification = buildNotification({
        complaint: c,
        type: NOTIFICATION_TYPES.INFO,
        title: `Complaint ${c.id || ""} registered successfully`,
        message: `${c.title || "Complaint"} was classified as ${catLabel} and routed to ${dept}.`,
      });

      // The officer desk needs its own copy: the citizen's notification is
      // addressed to the person who filed, not to whoever works the queue.
      const forOfficer = buildNotification({
        complaint: c,
        type: NOTIFICATION_TYPES.INFO,
        title: `New complaint ${c.id || ""}`,
        message: `${catLabel} reported at ${c.location || "specified area"}.`,
        audience: NOTIFICATION_AUDIENCE.OFFICER,
      });

      return {
        ...state,
        complaints: [c, ...(state?.complaints || [])],
        notifications: [notification, forOfficer, ...(state?.notifications || [])],
      };
    }

    case ACTIONS.STATUS: {
      const target = state.complaints.find((c) => c.id === action.id);
      if (!target) return state;

      const updated = applyStatusChange(target, action.change);
      const notification = notificationForStatus(updated, action.change.status);

      return {
        ...state,
        complaints: state.complaints.map((c) => (c.id === action.id ? updated : c)),
        notifications: notification
          ? [notification, ...state.notifications]
          : state.notifications,
      };
    }

    case ACTIONS.ASSIGN: {
      const target = state.complaints.find((c) => c.id === action.id);
      if (!target) return state;

      const updated = applyAssignment(target, action.officer, action.actor);
      const notification = buildNotification({
        complaint: updated,
        type: NOTIFICATION_TYPES.ASSIGNED,
        title: `Complaint ${updated.id} has been assigned`,
        message: `Complaint assigned to ${action.officer.name}, ${updated.department}.`,
      });

      return {
        ...state,
        complaints: state.complaints.map((c) => (c.id === action.id ? updated : c)),
        notifications: [notification, ...state.notifications],
      };
    }

    case ACTIONS.READ_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };

    case ACTIONS.READ_ALL:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          // Only the feed being viewed is marked read — clearing the citizen's
          // badge must not silently clear the officer's.
          !action.audience || n.audience === action.audience
            ? { ...n, read: true }
            : n,
        ),
      };

    case ACTIONS.RESET:
      return seedState();

    case ACTIONS.CLEAR:
      return { complaints: [], notifications: [] };

    default:
      return state;
  }
}
