import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import NotificationFeed from "../../components/notifications/NotificationFeed";

import useDocumentTitle from "../../hooks/useDocumentTitle";
import { NOTIFICATION_AUDIENCE, PATHS } from "../../utils/constants";

/**
 * Citizen notification centre.
 *
 * Every entry is raised by a real action in the store — a complaint filed, a
 * status moved, an officer assigned. Nothing here is seeded copy, so an empty
 * feed genuinely means nothing has happened yet.
 */
export default function Notifications() {
  useDocumentTitle("Notifications");

  return (
    <div className="stack-5">
      <NotificationFeed
        audience={NOTIFICATION_AUDIENCE.CITIZEN}
        renderHeader={({ unreadCount, markAllRead }) => (
          <PageHeader
            title="Notifications"
            description="Status changes, officer updates and resolutions across all your complaints."
            breadcrumbs={[
              { label: "Citizen", to: PATHS.CITIZEN_DASHBOARD },
              { label: "Notifications" },
            ]}
            actions={
              unreadCount > 0 && (
                <Button
                  variant="secondary"
                  icon="bi-check2-all"
                  onClick={markAllRead}
                >
                  Mark all read
                </Button>
              )
            }
          />
        )}
      />

      <Card padding="lg" sunken>
        <p className="notif-foot">
          <i className="bi bi-sliders" aria-hidden="true" />
          <span>
            Choose which updates reach you — and whether they arrive by email or
            SMS — in your notification preferences.
          </span>
          <Button variant="ghost" size="sm" to={PATHS.CITIZEN_PROFILE}>
            Open settings
          </Button>
        </p>
      </Card>
    </div>
  );
}
