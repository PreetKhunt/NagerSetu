import { Link } from "react-router-dom";

import StatusBadge from "../common/StatusBadge";
import PriorityBadge from "../common/PriorityBadge";
import { formatDate, timeAgo } from "../../utils/formatters";
import { formatRemaining, slaFor } from "../../utils/grievanceUtils";
import { SLA_META, officerComplaintPath } from "../../utils/constants";

/**
 * Officer queue table.
 *
 * Below 1200px the table is hidden by CSS and the card list below takes over —
 * nine columns cannot be made to fit a phone without either a sideways scroll
 * or type too small to read, and both are worse than a different layout.
 *
 * The SLA chip is computed per row at render time from `createdAt` and the
 * complaint's priority window, so a row turns red by the clock passing, not by
 * anything stored on the record.
 */
export default function OfficerComplaintTable({ complaints, clusterMapping = new Map() }) {
  return (
    <>
      <div className="table-ds__wrap table-ds__wrap--officer">
        <table className="table-ds table-ds--officer">
          <caption className="sr-only">
            Citizen complaints with category, priority, department and status
          </caption>
          <thead>
            <tr>
              <th scope="col">Complaint ID</th>
              <th scope="col">Issue</th>
              <th scope="col">Category</th>
              <th scope="col">Location</th>
              <th scope="col">Priority</th>
              <th scope="col">Department</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => {
              const sla = slaFor(complaint);
              const meta = SLA_META[sla.state];

              return (
                <tr key={complaint.id}>
                  <td>
                    <Link
                      className="table-ds__id"
                      to={officerComplaintPath(complaint.id)}
                    >
                      {complaint.id}
                    </Link>
                    {!sla.closed && (
                      <span className={`sla-chip sla-chip--${meta.tone}`}>
                        {formatRemaining(sla.remainingMs)}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="table-ds__title">{complaint.title}</span>
                    <span className="table-ds__sub">
                      {complaint.citizenName}
                      {clusterMapping.has(complaint.id) && (
                        <span className="badge bg-warning text-dark ms-2" title="AI detected problem cluster">
                          <i className="bi bi-diagram-3-fill me-1"></i>
                          {clusterMapping.get(complaint.id).clusterId} &middot; {clusterMapping.get(complaint.id).count} reports
                        </span>
                      )}
                    </span>
                  </td>
                  <td>{complaint.categoryLabel}</td>
                  <td>
                    <span className="table-ds__muted">{complaint.location}</span>
                  </td>
                  <td>
                    <PriorityBadge priority={complaint.priority} size="sm" />
                  </td>
                  <td>
                    <span className="table-ds__muted">{complaint.department}</span>
                    {complaint.assignedOfficer && (
                      <span className="table-ds__sub">
                        {complaint.assignedOfficer.name}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={complaint.status} size="sm" />
                  </td>
                  <td>
                    <span className="table-ds__muted">
                      {formatDate(complaint.createdAt)}
                    </span>
                    <span className="table-ds__sub">
                      {timeAgo(complaint.createdAt)}
                    </span>
                  </td>
                  <td>
                    <Link
                      className="btn-ds btn-ds--secondary btn-ds--sm"
                      to={officerComplaintPath(complaint.id)}
                    >
                      <span>Review</span>
                      <i className="btn-ds__icon bi bi-arrow-right" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Narrow-screen presentation of the same rows. */}
      <ul className="queue-cards">
        {complaints.map((complaint) => {
          const sla = slaFor(complaint);
          const meta = SLA_META[sla.state];

          return (
            <li key={complaint.id}>
              <Link
                className="queue-card"
                to={officerComplaintPath(complaint.id)}
              >
                <div className="queue-card__top">
                  <span className="mono queue-card__id">
                    {complaint.id}
                    {clusterMapping.has(complaint.id) && (
                      <span className="badge bg-warning text-dark ms-2 px-2 py-1 fs-10" title="AI detected problem cluster">
                        <i className="bi bi-diagram-3-fill me-1"></i>
                        {clusterMapping.get(complaint.id).clusterId} &middot; {clusterMapping.get(complaint.id).count} reports
                      </span>
                    )}
                  </span>
                  <StatusBadge status={complaint.status} size="sm" />
                </div>

                <p className="queue-card__title">{complaint.title}</p>

                <p className="queue-card__meta">
                  <i className="bi bi-geo-alt" aria-hidden="true" />
                  {complaint.location}
                </p>
                <p className="queue-card__meta">
                  <i className="bi bi-building" aria-hidden="true" />
                  {complaint.department}
                </p>

                <div className="queue-card__foot">
                  <PriorityBadge priority={complaint.priority} size="sm" />
                  {!sla.closed && (
                    <span className={`sla-chip sla-chip--${meta.tone}`}>
                      {formatRemaining(sla.remainingMs)}
                    </span>
                  )}
                  <span className="queue-card__date">
                    {formatDate(complaint.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
