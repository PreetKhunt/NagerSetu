import { STATUS_FLOW, STATUS_META, COMPLAINT_STATUS } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";

/**
 * Visualises Registered → Assigned → In Progress → Resolved.
 *
 * `timeline` (optional) supplies the date shown under each completed step;
 * without it the tracker still renders from `status` alone.
 * Terminal states outside the happy path (rejected) short-circuit to a notice.
 */
export default function ComplaintStatusTracker({
  status,
  timeline = [],
  orientation = "horizontal",
}) {
  const isRejected = status === COMPLAINT_STATUS.REJECTED;
  const effectiveStatus = status === COMPLAINT_STATUS.REOPENED
    ? COMPLAINT_STATUS.IN_PROGRESS
    : status;

  const currentIndex = STATUS_FLOW.indexOf(effectiveStatus);
  const dateFor = (key) => timeline.find((t) => t.status === key)?.at;

  return (
    <div>
      <ol
        className={`tracker${orientation === "vertical" ? " tracker--vertical" : ""}`}
        aria-label="Complaint progress"
      >
        {STATUS_FLOW.map((key, index) => {
          const meta = STATUS_META[key];
          const isDone = currentIndex > index;
          const isCurrent = currentIndex === index;
          const at = dateFor(key);

          return (
            <li
              key={key}
              className={[
                "tracker__step",
                isDone && "tracker__step--done",
                isCurrent && "tracker__step--current",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isCurrent ? "step" : undefined}
            >
              {index < STATUS_FLOW.length - 1 && (
                <span className="tracker__connector" aria-hidden="true" />
              )}

              <span className="tracker__dot">
                <i
                  className={`bi ${isDone ? "bi-check-lg" : meta.icon}`}
                  aria-hidden="true"
                />
              </span>

              <span className="d-block">
                <span className="tracker__label d-block">{meta.label}</span>
                {at && <span className="tracker__date d-block">{formatDate(at)}</span>}
                {isCurrent && !at && (
                  <span className="tracker__date d-block">In progress</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {isRejected && (
        <p className="d-flex align-items-center gap-2 mt-3 mb-0 text-danger fw-semibold small">
          <i className="bi bi-x-circle-fill" aria-hidden="true" />
          This complaint was closed as rejected. You can reopen it with more details.
        </p>
      )}
    </div>
  );
}
