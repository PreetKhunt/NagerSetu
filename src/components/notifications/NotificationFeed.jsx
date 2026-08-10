import { useMemo, useState } from "react";

import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import Segmented from "../common/Segmented";
import NotificationItem from "./NotificationItem";

import useToast from "../../hooks/useToast";
import useGrievances from "../../hooks/useGrievances";
import { NOTIFICATION_META } from "../../utils/constants";

const TABS = [
  { id: "all", label: "All", icon: "bi-inbox" },
  { id: "unread", label: "Unread", icon: "bi-dot" },
  { id: "assigned", label: "Assigned", icon: "bi-person-check" },
  { id: "resolved", label: "Resolved", icon: "bi-check2-circle" },
];

/** Group by calendar day so the list reads as a history, not a flat dump. */
function groupByDay(items) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groups = new Map();
  for (const item of items) {
    const day = new Date(item.at).toDateString();
    const label =
      day === today ? "Today" : day === yesterday ? "Yesterday" : "Earlier";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(item);
  }
  return [...groups.entries()];
}

/**
 * The notification list, shared by the citizen and officer centres.
 *
 * Both feeds come from the same store but are addressed differently: a
 * complaint being filed notifies the citizen that it was registered and the
 * officer that work has arrived. Filtering by `audience` here is what keeps
 * one page from showing the other side's copy.
 *
 * `renderHeader` receives the unread count so each page can put its own
 * "Mark all read" control in its own page header.
 */
export default function NotificationFeed({ audience, renderHeader }) {
  const toast = useToast();
  const { notifications, markNotificationRead, markAllRead } = useGrievances();
  const [tab, setTab] = useState("all");

  const items = useMemo(
    () => notifications.filter((n) => n.audience === audience),
    [notifications, audience],
  );

  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (tab === "unread") return items.filter((n) => !n.read);
    if (tab === "all") return items;
    return items.filter((n) => n.type === tab);
  }, [items, tab]);

  const readAll = () => {
    markAllRead(audience);
    toast.success("All caught up", "Every notification is marked as read.");
  };

  const groups = groupByDay(filtered);

  return (
    <>
      {renderHeader?.({ unreadCount, markAllRead: readAll })}

      <Card padding="lg">
        <div className="notif-head">
          <Segmented
            options={TABS}
            value={tab}
            onChange={setTab}
            name={`notif-filter-${audience}`}
            label="Filter notifications"
          />

          <p className="notif-head__count" aria-live="polite">
            {unreadCount > 0 ? (
              <>
                <span className="notif-head__badge">{unreadCount}</span>
                unread
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle" aria-hidden="true" />
                All caught up
              </>
            )}
          </p>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon="bi-bell-slash"
            title={tab === "unread" ? "Nothing unread" : "No notifications here"}
            description={
              tab === "unread"
                ? "You have read everything. New updates appear as complaints progress."
                : `No ${NOTIFICATION_META[tab]?.label.toLowerCase() ?? ""} updates yet.`
            }
            actionLabel={tab === "all" ? undefined : "View all"}
            onAction={tab === "all" ? undefined : () => setTab("all")}
          />
        )}

        {filtered.length > 0 && (
          <div className="stack-4">
            {groups.map(([label, group]) => (
              <section key={label}>
                <h2 className="notif-group">{label}</h2>
                <ul className="notif-list">
                  {group.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markNotificationRead}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
