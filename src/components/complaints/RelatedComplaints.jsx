import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import { complaintPath } from "../../utils/constants";
import { timeAgo, toPercent } from "../../utils/formatters";

/**
 * Nearby complaints the AI flagged as possible duplicates.
 *
 * Similarity is a mock score from `aiService.findRelated`. Shown as a hint,
 * never as an automatic merge — a false match should not silently discard
 * somebody's report.
 */
export default function RelatedComplaints({ items = [] }) {
  if (!items.length) {
    return (
      <p className="text-muted-soft mb-0">
        No similar complaints nearby. Yours is the only report for this issue.
      </p>
    );
  }

  return (
    <>
      <p className="related__intro">
        AI found {items.length} nearby {items.length === 1 ? "report" : "reports"}{" "}
        describing a similar issue.
      </p>

      <ul className="related">
        {items.map((item) => (
          <li key={item.id} className="related__item">
            <Link className="related__link" to={complaintPath(item.id)}>
              <span className="related__meta">
                <span className="related__id mono">{item.id}</span>
                <span className="related__score" title="AI similarity score">
                  <i className="bi bi-diagram-3" aria-hidden="true" />
                  {toPercent(item.similarity)} match
                </span>
              </span>

              <span className="related__title">{item.title}</span>

              <span className="related__foot">
                <StatusBadge status={item.status} size="sm" />
                <span className="related__where">
                  <i className="bi bi-geo-alt" aria-hidden="true" />
                  {item.distance} · {timeAgo(item.createdAt)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="related__note">
        <i className="bi bi-info-circle" aria-hidden="true" />
        Duplicate reports are grouped so departments see the true scale of an issue.
      </p>
    </>
  );
}
