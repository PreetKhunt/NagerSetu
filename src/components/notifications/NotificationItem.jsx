import { Link } from "react-router-dom";
import { NOTIFICATION_META, complaintPath } from "../../utils/constants";
import { timeAgo } from "../../utils/formatters";

/**
 * One notification row. Renders as a Link when it points at a complaint,
 * otherwise as a plain item, so nothing is a dead click target.
 */
export default function NotificationItem({ notification, onMarkRead }) {
  const meta = NOTIFICATION_META[notification.type] ?? {
    icon: "bi-bell",
    tone: "primary",
  };

  const body = (
    <>
      <span className={`notif__icon notif__icon--${meta.tone}`} aria-hidden="true">
        <i className={`bi ${meta.icon}`} />
      </span>

      <span className="notif__body">
        <span className="notif__title">
          {notification.title}
          {!notification.read && (
            <span className="notif__dot" aria-label="Unread" role="img" />
          )}
        </span>
        <span className="notif__text">{notification.message}</span>
        <time className="notif__time" dateTime={notification.at}>
          {timeAgo(notification.at)}
        </time>
      </span>
    </>
  );

  return (
    <li className={`notif${notification.read ? "" : " notif--unread"}`}>
      {notification.complaintId ? (
        <Link
          className="notif__hit"
          to={complaintPath(notification.complaintId)}
          onClick={() => onMarkRead?.(notification.id)}
        >
          {body}
        </Link>
      ) : (
        <span className="notif__hit">{body}</span>
      )}

      {!notification.read && onMarkRead && (
        <button
          type="button"
          className="notif__action"
          onClick={() => onMarkRead(notification.id)}
        >
          Mark read
        </button>
      )}
    </li>
  );
}
