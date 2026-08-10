import { useMemo } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import BarList from "../../components/officer/BarList";
import SlaPanel from "../../components/officer/SlaPanel";

import useAuth from "../../hooks/useAuth";
import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import {
  categoryBreakdown,
  computeStats,
  departmentWorkload,
} from "../../utils/grievanceUtils";
import { timeAgo } from "../../utils/formatters";
import { PATHS, officerComplaintPath } from "../../utils/constants";

/**
 * Officer command centre.
 *
 * Every tile, bar and row on this page is derived from the same complaint list
 * the citizen side writes to — there is not a single stored total. File a
 * complaint as a citizen and Total and Pending both move by one before this
 * page is even reloaded.
 */
export default function OfficerDashboard() {
  useDocumentTitle("Grievance Command Center");

  const { user } = useAuth();
  const { complaints } = useGrievances();

  const stats = useMemo(() => computeStats(complaints), [complaints]);
  const categories = useMemo(() => categoryBreakdown(complaints), [complaints]);
  const departments = useMemo(() => departmentWorkload(complaints), [complaints]);

  // Newest first — the queue an officer works from is chronological, not
  // whatever order the store happens to hold.
  const recent = useMemo(
    () =>
      [...complaints]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6),
    [complaints],
  );

  const share = (n) => (stats.total ? (n / stats.total) * 100 : 0);

  const tiles = [
    {
      label: "Total complaints",
      value: stats.total,
      icon: "bi-collection",
      tone: "primary",
      hint: "Across every department",
      progress: 100,
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: "bi-hourglass-split",
      tone: "amber",
      hint: "Awaiting assignment",
      progress: share(stats.pending),
    },
    {
      label: "Assigned",
      value: stats.assigned,
      icon: "bi-person-check",
      tone: "teal",
      hint: "With an officer, not yet started",
      progress: share(stats.assigned),
    },
    {
      label: "In progress",
      value: stats.inProgress,
      icon: "bi-tools",
      tone: "primary",
      hint: "Field work underway",
      progress: share(stats.inProgress),
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: "bi-check2-circle",
      tone: "success",
      hint:
        stats.resolutionRate == null
          ? "No complaints yet"
          : `${stats.resolutionRate}% closure rate`,
      progress: share(stats.resolved),
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: "bi-x-circle",
      tone: "slate",
      hint: "Closed after review",
      progress: share(stats.rejected),
    },
    {
      label: "High priority",
      value: stats.highPriority,
      icon: "bi-exclamation-triangle",
      tone: "danger",
      hint: "High and critical, all statuses",
      progress: share(stats.highPriority),
    },
    {
      label: "SLA breached",
      value: stats.slaBreached,
      icon: "bi-alarm",
      tone: "danger",
      hint: `${stats.slaDueSoon} due soon`,
      progress: share(stats.slaBreached),
    },
  ];

  return (
    <div className="stack-6">
      <PageHeader
        title="Grievance Command Center"
        description="Monitor, prioritize and resolve citizen grievances."
        breadcrumbs={[{ label: "Officer" }, { label: "Dashboard" }]}
        actions={
          <>
            <Button
              variant="secondary"
              to={PATHS.OFFICER_MAP}
              icon="bi-geo-alt"
            >
              Map view
            </Button>
            <Button to={PATHS.OFFICER_COMPLAINTS} icon="bi-list-check">
              Open queue
            </Button>
          </>
        }
      />

      {user?.name && (
        <p className="officer-greeting">
          <i className="bi bi-shield-check" aria-hidden="true" />
          Signed in as <strong>{user.name}</strong> — you are seeing every
          complaint currently in the system.
        </p>
      )}

      <section aria-label="Complaint statistics">
        <div className="row g-3">
          {tiles.map((tile) => (
            <div className="col-12 col-sm-6 col-xl-3" key={tile.label}>
              <StatCard {...tile} />
            </div>
          ))}
        </div>
      </section>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <Card padding="lg">
            <CardHeader
              title="Recent complaints"
              subtitle="The six most recently filed reports"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  to={PATHS.OFFICER_COMPLAINTS}
                  iconRight="bi-arrow-right"
                >
                  View all
                </Button>
              }
            />

            {recent.length === 0 && (
              <EmptyState
                icon="bi-inbox"
                title="No complaints in the system"
                description="As soon as a citizen files a grievance it appears here, with its category, priority and department already assigned."
                actionLabel="Open the queue"
                actionTo={PATHS.OFFICER_COMPLAINTS}
              />
            )}

            {recent.length > 0 && (
              <ul className="queue">
                {recent.map((complaint) => (
                  <li key={complaint.id}>
                    <Link
                      className="queue__row"
                      to={officerComplaintPath(complaint.id)}
                    >
                      <span className="queue__main">
                        <span className="queue__id mono">{complaint.id}</span>
                        <span className="queue__title">{complaint.title}</span>
                        <span className="queue__meta">
                          <i className="bi bi-geo-alt" aria-hidden="true" />
                          {complaint.location}
                          <span aria-hidden="true">·</span>
                          {timeAgo(complaint.createdAt)}
                        </span>
                      </span>
                      <span className="queue__badges">
                        <PriorityBadge priority={complaint.priority} size="sm" />
                        <StatusBadge status={complaint.status} size="sm" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="col-12 col-xl-5">
          <div className="stack-4">
            <SlaPanel complaints={complaints} />

            <Card padding="lg">
              <CardHeader
                title="Complaints by category"
                subtitle="Live counts across the whole queue"
              />
              <BarList
                items={categories.map((c) => ({
                  key: c.id,
                  label: c.label,
                  icon: c.icon,
                  value: c.count,
                }))}
                emptyLabel="No complaints to break down yet."
              />
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Department workload"
                subtitle="Open items per department"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    to={PATHS.OFFICER_DEPARTMENTS}
                    iconRight="bi-arrow-right"
                  >
                    Details
                  </Button>
                }
              />
              <BarList
                items={departments.map((d) => ({
                  key: d.name,
                  label: d.name,
                  value: d.total,
                  hint: `${d.pending + d.assigned + d.inProgress} open`,
                }))}
                emptyLabel="No departments have work assigned yet."
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
