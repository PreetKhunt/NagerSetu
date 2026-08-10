import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import StatCard from "../../components/common/StatCard";
import Avatar from "../../components/common/Avatar";

import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { computeStats } from "../../utils/grievanceUtils";
import { formatDate } from "../../utils/formatters";
import { PATHS, ROLE_LABELS, ROLES } from "../../utils/constants";

/**
 * Officer profile and demo controls.
 *
 * The reset/clear utilities live here rather than in a toolbar because they
 * wipe the shared store — that belongs behind the officer's own settings page,
 * not somewhere a citizen browsing the demo can reach by accident.
 */
export default function OfficerProfile() {
  useDocumentTitle("Officer profile");

  const { user, logout } = useAuth();
  const { complaints, resetDemoData, clearDemoData } = useGrievances();
  const toast = useToast();

  const [confirm, setConfirm] = useState(null); // null | "reset" | "clear"

  const stats = computeStats(complaints);

  const runReset = () => {
    resetDemoData();
    setConfirm(null);
    toast.success("Demo data reset", "The sample complaints have been restored.");
  };

  const runClear = () => {
    clearDemoData();
    setConfirm(null);
    toast.success("All complaints cleared", "The system is now empty.");
  };

  return (
    <div className="stack-6">
      <PageHeader
        title="Officer profile"
        description="Your desk, your department and the demo data controls."
        breadcrumbs={[
          { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
          { label: "Profile" },
        ]}
      />

      <Card padding="lg" className="profile-hero">
        <Avatar name={user?.name ?? "Officer"} size="xl" />
        <div className="min-w-0">
          <h2 className="profile-hero__name">{user?.name ?? "Officer"}</h2>
          <p className="profile-hero__meta">
            <span>
              <i className="bi bi-person-badge" aria-hidden="true" />
              {ROLE_LABELS[user?.role ?? ROLES.OFFICER]}
            </span>
            <span>
              <i className="bi bi-building" aria-hidden="true" />
              {user?.department ?? "Municipal Grievance Cell"}
            </span>
            {user?.joinedAt && (
              <span>
                <i className="bi bi-calendar3" aria-hidden="true" />
                Posted since {formatDate(user.joinedAt)}
              </span>
            )}
          </p>
          <div className="cluster mt-3">
            <span className="chip chip--soft">
              <i className="bi bi-envelope" aria-hidden="true" />
              {user?.email ?? "grievance@pmc.gov.in"}
            </span>
            <span className="chip chip--soft">
              <i className="bi bi-geo-alt" aria-hidden="true" />
              {user?.location ?? "Pune Municipal Corporation"}
            </span>
          </div>
        </div>
        <Button variant="secondary" icon="bi-box-arrow-right" onClick={logout}>
          Sign out
        </Button>
      </Card>

      <section aria-label="Queue at a glance">
        <div className="row g-3">
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              label="In the system"
              value={stats.total}
              icon="bi-collection"
              tone="primary"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              label="Open"
              value={stats.pending + stats.assigned + stats.inProgress}
              icon="bi-inboxes"
              tone="amber"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              label="Resolved"
              value={stats.resolved}
              icon="bi-check2-circle"
              tone="success"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              label="Past SLA"
              value={stats.slaBreached}
              icon="bi-alarm"
              tone="danger"
            />
          </div>
        </div>
      </section>

      <Card padding="lg">
        <CardHeader
          title="Demo data"
          subtitle="For presenting the prototype — both actions rewrite the shared store and localStorage"
        />

        <div className="demo-tools">
          <div className="demo-tools__item">
            <div>
              <p className="demo-tools__title">Reset to sample data</p>
              <p className="demo-tools__text">
                Restores the seeded complaints and discards anything filed during
                this session. Useful right before a demo run.
              </p>
            </div>
            <Button
              variant="secondary"
              icon="bi-arrow-counterclockwise"
              onClick={() => setConfirm("reset")}
            >
              Reset
            </Button>
          </div>

          <div className="demo-tools__item">
            <div>
              <p className="demo-tools__title">Clear everything</p>
              <p className="demo-tools__text">
                Empties the system so you can demonstrate the first-complaint
                journey from a genuinely empty state.
              </p>
            </div>
            <Button
              variant="danger"
              icon="bi-trash3"
              onClick={() => setConfirm("clear")}
            >
              Clear all
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        title="Reset to sample data?"
        description="Complaints filed during this session will be discarded and the seeded samples restored."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button icon="bi-arrow-counterclockwise" onClick={runReset}>
              Reset data
            </Button>
          </>
        }
      >
        <p className="mb-0">
          This affects every screen — citizen and officer — because they share
          one store. It cannot be undone.
        </p>
      </Modal>

      <Modal
        open={confirm === "clear"}
        onClose={() => setConfirm(null)}
        title="Clear all complaints?"
        description="The system will be left completely empty."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon="bi-trash3" onClick={runClear}>
              Clear everything
            </Button>
          </>
        }
      >
        <p className="mb-0">
          All {complaints.length} complaints and their notifications will be
          removed from state and from localStorage. It cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
