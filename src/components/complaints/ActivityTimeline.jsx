import StatusBadge from "../common/StatusBadge";
import { formatDateTime } from "../../utils/formatters";

/**
 * Reverse-chronological activity log for one complaint.
 *
 * Distinct from ComplaintStatusTracker: that shows position in the lifecycle,
 * this shows what happened, when, and who did it. Entries carry `action` and
 * `actor` (see `timelineEntry` in grievanceUtils) — the same rows the officer
 * status modal and the assignment flow append to.
 */
export default function ActivityTimeline({ entries = [] }) {
  if (!entries.length) {
    return (
      <p className="text-muted-soft mb-0">
        No activity recorded yet. Updates appear here as the department acts.
      </p>
    );
  }

  const ordered = [...entries].reverse();

  return (
    <ol className="activity">
      {ordered.map((entry, index) => (
        // Two entries can share a status and land in the same millisecond
        // (assign, then an immediate status change), so the index is part of
        // the key rather than trusting the pair to be unique.
        <li
          key={`${entry.status}-${entry.at}-${index}`}
          className={`activity__item${index === 0 ? " activity__item--latest" : ""}`}
        >
          <span className="activity__marker" aria-hidden="true" />

          <div className="activity__body">
            <div className="activity__head">
              <StatusBadge status={entry.status} size="sm" />
              <time className="activity__time" dateTime={entry.at}>
                {formatDateTime(entry.at)}
              </time>
            </div>

            {entry.action && <p className="activity__action">{entry.action}</p>}
            {entry.note && <p className="activity__note">{entry.note}</p>}

            {(entry.actor || entry.by) && (
              <p className="activity__by">
                <i className="bi bi-person" aria-hidden="true" />
                {entry.actor ?? entry.by}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
