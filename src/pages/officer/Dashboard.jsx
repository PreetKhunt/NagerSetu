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
  countBy,
  departmentWorkload,
} from "../../utils/grievanceUtils";
import { computeProblemClusters } from "../../services/DuplicateDetectionService";
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

  // AI Problem Detection — derived entirely from the live complaint list.
  const clusterStats = useMemo(() => {
    const clusters = computeProblemClusters(complaints);
    const topIssue = countBy(complaints, "categoryLabel")[0]?.value ?? null;
    return {
      possibleRelatedGroups: clusters.length,
      activeClusters: clusters.filter((c) =>
        c.members.some((m) => !["resolved", "rejected"].includes(m.status)),
      ).length,
      mostReportedIssue: topIssue,
    };
  }, [complaints]);

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
      label: "Pending / Open",
      value: stats.pending + stats.assigned,
      icon: "bi-hourglass-split",
      tone: "amber",
      hint: "Awaiting start",
      progress: share(stats.pending + stats.assigned),
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
  ];

  // Top Problem Cluster logic
  const topCluster = useMemo(() => {
    const clusters = computeProblemClusters(complaints);
    return clusters.sort((a, b) => b.count - a.count)[0] || null;
  }, [complaints]);

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

      {/* ROW 2: Recent Complaints & SLA Panel */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-7">
          <Card padding="lg" className="h-100">
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
                          <i className="bi-geo-alt" aria-hidden="true" />
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
          <div className="h-100">
            <SlaPanel complaints={complaints} />
          </div>
        </div>
      </div>

      {/* ROW 3: Categories & Departments */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-6">
          <Card padding="lg" className="h-100">
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
        </div>

        <div className="col-12 col-xl-6">
          <Card padding="lg" className="h-100">
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

      {/* ROW 4: AI Problem Detection */}
      <div className="row g-4">
        <div className="col-12">
          <Card padding="lg">
            <CardHeader
              title="AI Problem Detection"
              subtitle="Possible duplicate clusters across the queue"
            />
            
            <div className="row g-4">
              <div className="col-12 col-xl-4">
                <ul className="ai-detect__list h-100 p-3 rounded" style={{ backgroundColor: 'var(--c-surface-sunken)', border: '1px solid var(--c-border)' }}>
                  <li className="ai-detect__row">
                    <span className="ai-detect__label">
                      <i className="bi bi-diagram-3" aria-hidden="true" />
                      Possible related groups
                    </span>
                    <span className="ai-detect__value">
                      {clusterStats.possibleRelatedGroups}
                    </span>
                  </li>
                  <li className="ai-detect__row">
                    <span className="ai-detect__label">
                      <i className="bi bi-collection" aria-hidden="true" />
                      Active problem clusters
                    </span>
                    <span className="ai-detect__value">
                      {clusterStats.activeClusters}
                    </span>
                  </li>
                  <li className="ai-detect__row">
                    <span className="ai-detect__label">
                      <i className="bi bi-bar-chart" aria-hidden="true" />
                      Most reported issue
                    </span>
                    <span className="ai-detect__value ai-detect__value--label text-truncate" style={{maxWidth: '120px'}}>
                      {clusterStats.mostReportedIssue ?? "—"}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="col-12 col-xl-8">
                {topCluster ? (
                  <div className="p-4 rounded border h-100 d-flex flex-column" style={{ backgroundColor: 'var(--c-surface-sunken)', borderColor: 'var(--c-border) !important' }}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="text-muted small fw-bold mb-1">TOP ACTIVE PROBLEM</div>
                        <div className="fs-5 fw-bold mono">{topCluster.clusterId}</div>
                      </div>
                      <Button to={`/officer/cluster/${topCluster.clusterId}`} variant="primary" size="sm">
                        View Problem Cluster
                      </Button>
                    </div>

                    <div className="mb-3">
                      <div className="fs-6 fw-bold">{topCluster.categoryLabel}</div>
                      <div className="text-muted"><i className="bi bi-geo-alt me-1" />{topCluster.location}</div>
                    </div>

                    <div className="d-flex align-items-center gap-3 mt-auto flex-wrap">
                      <span className="badge bg-warning text-dark fs-6 py-2 px-3">
                        🔥 {topCluster.count} Citizen Reports
                      </span>
                      <PriorityBadge priority={topCluster.priority} />
                      <StatusBadge status={topCluster.members.some(m => m.status === 'in_progress') ? 'in_progress' : topCluster.members[0].status} />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded border h-100 d-flex align-items-center justify-content-center text-muted" style={{ backgroundColor: 'var(--c-surface-sunken)' }}>
                    No active problem clusters detected.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
