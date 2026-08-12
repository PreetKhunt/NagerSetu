import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import PriorityBadge from "../common/PriorityBadge";
import { complaintPath, officerComplaintPath, officerClusterPath } from "../../utils/constants";
import { timeAgo, toPercent } from "../../utils/formatters";
import Button from "../common/Button";

/**
 * ProblemClusterPanel
 *
 * Shown in the complaint detail sidebar (citizen and officer sides) when AI
 * has detected that this complaint belongs to a possible problem cluster —
 * i.e., multiple complaints that may describe the same real-world issue.
 *
 * Props:
 *   relatedMatches  – array of enriched match objects from findRelatedComplaints()
 *   clusterId       – e.g. "CL-4812"
 *   currentId       – the ID of the complaint we are already viewing (excluded from list)
 */
export default function ProblemClusterPanel({ relatedMatches = [], clusterId, currentId, isOfficer = false }) {
  const visible = relatedMatches.filter((m) => m.id !== currentId).slice(0, 5);

  if (!visible.length) {
    return (
      <p className="text-muted-soft mb-0">
        No similar complaints nearby. Yours is the only report for this issue.
      </p>
    );
  }

  const count = relatedMatches.length + 1; // including the current one

  if (isOfficer && clusterId) {
    const underlyingIssue = relatedMatches[0]?.categoryLabel || "Multiple Categories";

    return (
      <div className="p-3 border rounded" style={{ backgroundColor: 'var(--c-surface-sunken)', borderColor: 'var(--c-border) !important' }}>
        <h3 className="fs-6 fw-bold mb-3 text-uppercase text-muted">Related Problem</h3>
        
        <div className="mb-2">
          <span className="text-muted d-block small">Problem Cluster:</span>
          <span className="fw-bold mono fs-5">{clusterId}</span>
        </div>

        <div className="mb-3">
          <span className="text-muted d-block small">Underlying Issue:</span>
          <span className="fw-bold">{underlyingIssue}</span>
        </div>

        <div className="mb-3">
          <span className="badge bg-warning text-dark fs-6 py-2 px-3">
            🔥 {count} Citizen Reports
          </span>
        </div>

        <div className="mb-3 text-warning-emphasis">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          Multiple citizens have reported this problem.
        </div>

        <Button to={officerClusterPath(clusterId)} variant="primary" block>
          View Problem Cluster
        </Button>
      </div>
    );
  }

  // Fallback / Citizen view
  return (
    <div className="cluster-panel">
      <div className="cluster-panel__intro">
        <i className="bi bi-diagram-3-fill cluster-panel__intro-icon" aria-hidden="true" />
        <div>
          <p className="cluster-panel__count">
            {count} similar {count === 1 ? "report" : "reports"} found nearby
          </p>
          {clusterId && (
            <p className="cluster-panel__id">
              Problem cluster <span className="mono">{clusterId}</span>
            </p>
          )}
        </div>
      </div>

      <ul className="cluster-panel__list">
        {visible.map((match) => (
          <li key={match.id} className="cluster-panel__item">
            <Link
              className="cluster-panel__link"
              to={isOfficer ? officerComplaintPath(match.id) : complaintPath(match.id)}
            >
              <div className="cluster-panel__item-head">
                <span className="mono cluster-panel__item-id">{match.id}</span>
                <span className="cluster-panel__score" title="AI similarity estimate">
                  <i className="bi bi-diagram-3" aria-hidden="true" />
                  {toPercent(match.similarity)}
                </span>
              </div>

              <p className="cluster-panel__item-title">{match.title}</p>

              <div className="cluster-panel__item-foot">
                <StatusBadge status={match.status} size="sm" />
                <PriorityBadge priority={match.priority} size="sm" />
                <span className="cluster-panel__item-dist">
                  <i className="bi bi-geo-alt" aria-hidden="true" />
                  {match.distanceLabel ?? "Nearby"}
                </span>
                <span className="cluster-panel__item-time text-muted-soft">
                  {timeAgo(match.createdAt)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p className="cluster-panel__note">
        <i className="bi bi-info-circle" aria-hidden="true" />
        Grouped so departments see the true scale of each issue. Each complaint
        is individually traceable.
      </p>
    </div>
  );
}
