import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import NotificationFeed from "../../components/notifications/NotificationFeed";

import useDocumentTitle from "../../hooks/useDocumentTitle";
import { NOTIFICATION_AUDIENCE, PATHS } from "../../utils/constants";

/**
 * Officer notification centre.
 *
 * The officer feed is the desk's own copy: a complaint being filed raises an
 * entry here as well as on the citizen's page, but with the wording an officer
 * needs ("New complaint GRV-…") rather than the acknowledgement the citizen
 * gets. Filtering by audience is what keeps the two feeds distinct.
 */
export default function OfficerNotifications() {
  useDocumentTitle("Notifications");

  return (
    <div className="stack-5">
      <NotificationFeed
        audience={NOTIFICATION_AUDIENCE.OFFICER}
        renderHeader={({ unreadCount, markAllRead }) => (
          <PageHeader
            title="Notifications"
            description="New grievances and queue activity as they happen."
            breadcrumbs={[
              { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
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
    </div>
  );
}
