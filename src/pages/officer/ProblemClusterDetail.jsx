import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";

import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { computeProblemClusters } from "../../services/DuplicateDetectionService";
import { PATHS, officerComplaintPath, COMPLAINT_STATUS } from "../../utils/constants";
import { timeAgo } from "../../utils/formatters";

/** One labelled row in the information panels. */
function Row({ icon, label, children }) {
  return (
    <div className="info-row">
      <span className="info-row__label">
        <i className={`bi ${icon}`} aria-hidden="true" />
        {label}
      </span>
      <span className="info-row__value">{children ?? "—"}</span>
    </div>
  );
}

export default function ProblemClusterDetail() {
  const { id } = useParams();
  const { complaints } = useGrievances();

  const cluster = useMemo(() => {
    if (!complaints?.length) return null;
    const clusters = computeProblemClusters(complaints);
    return clusters.find((c) => c.clusterId === id) || null;
  }, [complaints, id]);

  useDocumentTitle(cluster ? `${cluster.clusterId} — Cluster` : "Problem Cluster");

  if (!cluster) {
    return (
      <div className="stack-6">
        <PageHeader
          title="Problem Cluster not found"
          breadcrumbs={[
            { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
            { label: "Dashboard", to: PATHS.OFFICER_DASHBOARD },
            { label: "Not found" },
          ]}
        />
        <Card padding="lg">
          <EmptyState
            icon="bi-question-circle"
            title={`No problem cluster with the reference ${id}`}
            description="It may have been resolved, or the reference may be mistyped."
            actionLabel="Back to the dashboard"
            actionTo={PATHS.OFFICER_DASHBOARD}
          />
        </Card>
      </div>
    );
  }

  // Derive an overarching status for the cluster based on its members
  const getClusterStatus = () => {
    const statuses = cluster.members.map((m) => m.status);
    if (statuses.every((s) => s === COMPLAINT_STATUS.RESOLVED)) return COMPLAINT_STATUS.RESOLVED;
    if (statuses.includes(COMPLAINT_STATUS.IN_PROGRESS)) return COMPLAINT_STATUS.IN_PROGRESS;
    if (statuses.includes(COMPLAINT_STATUS.ASSIGNED)) return COMPLAINT_STATUS.ASSIGNED;
    if (statuses.some((s) => s === COMPLAINT_STATUS.REGISTERED || s === COMPLAINT_STATUS.REOPENED)) return COMPLAINT_STATUS.REGISTERED;
    return COMPLAINT_STATUS.REGISTERED;
  };

  const status = getClusterStatus();

  return (
    <div className="stack-6">
      <PageHeader
        title={`PROBLEM CLUSTER ${cluster.clusterId}`}
        description={`${cluster.count} citizen complaints may represent one underlying public problem.`}
        breadcrumbs={[
          { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
          { label: "Dashboard", to: PATHS.OFFICER_DASHBOARD },
          { label: cluster.clusterId },
        ]}
      />

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <Card padding="none">
            <div className="p-4 border-bottom">
              <h2 className="fs-5 fw-bold mb-1">{cluster.categoryLabel || "Multiple Categories"}</h2>
              <p className="text-muted mb-0">
                <i className="bi bi-geo-alt me-2" />
                {cluster.location || "Multiple Locations"}
              </p>
            </div>
            
            <div className="p-4 stack-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-warning text-dark fs-6 py-2 px-3">
                  🔥 {cluster.count} CITIZEN REPORTS
                </span>
              </div>
              
              <Row icon="bi-exclamation-triangle" label="Priority">
                <PriorityBadge priority={cluster.priority} size="sm" />
              </Row>
              <Row icon="bi-record-circle" label="Status">
                <StatusBadge status={status} size="sm" />
              </Row>
            </div>
          </Card>
        </div>

        <div className="col-12 col-xl-8">
          <Card padding="none">
            <CardHeader
              title="RELATED CITIZEN REPORTS"
              subtitle="All individual complaints belonging to this cluster."
            />
            <ul className="queue">
              {cluster.members.map((member, index) => (
                <li key={member.id}>
                  <Link
                    className="queue__row"
                    to={officerComplaintPath(member.id)}
                  >
                    <span className="queue__main">
                      <span className="queue__id mono">
                        {index + 1}. {member.id}
                      </span>
                      <span className="queue__title">{member.title}</span>
                      <span className="queue__meta">
                        <i className="bi bi-clock" aria-hidden="true" />
                        Reported {timeAgo(member.createdAt)}
                      </span>
                    </span>
                    <span className="queue__badges">
                      <PriorityBadge priority={member.priority} size="sm" />
                      <StatusBadge status={member.status} size="sm" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
