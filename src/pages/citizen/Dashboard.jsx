import { useMemo } from "react";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import ComplaintCard from "../../components/complaints/ComplaintCard";
import ComplaintStatusTracker from "../../components/complaints/ComplaintStatusTracker";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import QuickActionCard from "../../components/dashboard/QuickActionCard";

import useAuth from "../../hooks/useAuth";
import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { computeStats } from "../../utils/grievanceUtils";
import {
  complaintPath,
  PATHS,
  VOICE_COMPLAINT_PATH,
} from "../../utils/constants";

const QUICK_ACTIONS = [
  {
    icon: "bi-plus-circle",
    title: "Lodge a complaint",
    description: "Describe the issue in text and attach a photo.",
    tone: "primary",
    to: PATHS.CITIZEN_NEW,
  },
  {
    icon: "bi-mic",
    title: "Voice complaint",
    description: "Speak in your language — we transcribe and classify it.",
    tone: "teal",
    to: VOICE_COMPLAINT_PATH,
  },
  {
    icon: "bi-search",
    title: "Track a complaint",
    description: "Look up any complaint by its reference ID.",
    tone: "amber",
    to: PATHS.TRACK,
  },
];

/**
 * Citizen home.
 *
 * Reads the shared grievance store directly, so a complaint filed a moment ago
 * is already counted here — the tiles are computed from the same list the
 * cards below them render, and cannot disagree with it.
 */
export default function CitizenDashboard() {
  useDocumentTitle("Citizen dashboard");

  const { user } = useAuth();
  const { complaints } = useGrievances();

  const stats = useMemo(() => computeStats(complaints), [complaints]);
  const recent = useMemo(
    () =>
      [...complaints]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 4),
    [complaints],
  );

  const total = stats.total;
  const share = (n) => (total ? (n / total) * 100 : 0);

  const avgDays =
    stats.avgResolutionHours == null
      ? "—"
      : Math.round((stats.avgResolutionHours / 24) * 10) / 10;

  const statCards = [
    {
      label: "Total complaints",
      value: stats.total,
      icon: "bi-collection",
      tone: "primary",
      hint: "Lodged since you joined",
      progress: 100,
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: "bi-hourglass-split",
      tone: "amber",
      hint: "Awaiting department pickup",
      progress: share(stats.pending),
    },
    {
      label: "In progress",
      value: stats.inProgress,
      icon: "bi-tools",
      tone: "teal",
      hint: "Work underway on site",
      progress: share(stats.inProgress),
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: "bi-check2-circle",
      tone: "success",
      hint: `Avg. ${avgDays} days to close`,
      progress: share(stats.resolved),
    },
  ];

  const latest = recent[0];


  return (
    <div className="stack-6">
      <WelcomeBanner user={user} />

      <PageHeader
        title="Your dashboard"
        description="A snapshot of everything you have reported and where each complaint stands."
        breadcrumbs={[
          { label: "Home", to: PATHS.HOME },
          { label: "Citizen" },
          { label: "Dashboard" },
        ]}
        actions={
          <Button to={PATHS.CITIZEN_NEW} icon="bi-plus-lg">
            New complaint
          </Button>
        }
      />

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <div className="row g-3">
          {QUICK_ACTIONS.map((action) => (
            <div className="col-12 col-md-6 col-xl-4" key={action.title}>
              <QuickActionCard {...action} />
            </div>
          ))}
        </div>
      </section>

      {/* Statistics */}
      <section aria-label="Complaint statistics">
        <div className="row g-3">
          {statCards.map((card) => (
            <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
              <StatCard {...card} />
            </div>
          ))}
        </div>
      </section>

      <div className="row g-4">
        {/* Recent complaints */}
        <div className="col-12 col-xl-7">
          <Card padding="lg">
            <CardHeader
              title="Recent complaints"
              subtitle="Your four most recently updated reports"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  to={PATHS.CITIZEN_COMPLAINTS}
                  iconRight="bi-arrow-right"
                >
                  View all
                </Button>
              }
            />

            {recent.length === 0 && (
              <EmptyState
                icon="bi-clipboard-check"
                title="No complaints yet"
                description="When you report a civic issue it will appear here, with its status updated at every stage."
                actionLabel="Lodge your first complaint"
                actionTo={PATHS.CITIZEN_NEW}
                secondaryLabel="Try a voice complaint"
                secondaryTo={VOICE_COMPLAINT_PATH}
              />
            )}

            {recent.length > 0 && (
              <div className="stack-3">
                {recent.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    to={complaintPath(complaint.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Status visualisation for the latest complaint */}
        <div className="col-12 col-xl-5">
          <div className="stack-4">
            <Card padding="lg">
              <CardHeader
                title="Latest complaint progress"
                subtitle={
                  latest
                    ? `${latest.id} · ${latest.department}`
                    : "Nothing in progress"
                }
              />

              {!latest && (
                <EmptyState
                  icon="bi-activity"
                  title="No active complaint"
                  description="Once you lodge a complaint you will see it move through Registered, Assigned, In Progress and Resolved."
                  actionLabel="Lodge a complaint"
                  actionTo={PATHS.CITIZEN_NEW}
                />
              )}

              {latest && (
                <>
                  <p className="fw-semibold mb-3">{latest.title}</p>
                  <ComplaintStatusTracker
                    status={latest.status}
                    timeline={latest.timeline}
                  />
                  <div className="cluster mt-4">
                    <StatusBadge status={latest.status} size="sm" />
                    <PriorityBadge priority={latest.priority} size="sm" showSource />
                  </div>
                </>
              )}
            </Card>

            <Card padding="lg" sunken>
              <CardHeader
                title="Need this resolved faster?"
                subtitle="A clearer report reaches the right desk sooner."
              />
              <ul className="stack-2 list-unstyled mb-4">
                {[
                  "Add a photo — image analysis raises priority confidence.",
                  "Mention the nearest landmark so location routing is exact.",
                  "Report in the language you speak; we translate for the officer.",
                ].map((tip) => (
                  <li key={tip} className="d-flex gap-2">
                    <i
                      className="bi bi-check-circle-fill text-success mt-1"
                      aria-hidden="true"
                    />
                    <span className="text-muted-soft">{tip}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                block
                icon="bi-mic"
                to={VOICE_COMPLAINT_PATH}
              >
                Try a voice complaint
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
