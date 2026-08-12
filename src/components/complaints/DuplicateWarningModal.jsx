import { useNavigate } from "react-router-dom";

import Modal from "../common/Modal";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import { complaintPath } from "../../utils/constants";
import { timeAgo, toPercent } from "../../utils/formatters";
import { COMPLAINT_STATUS } from "../../utils/constants";

/**
 * DuplicateWarningModal
 *
 * Shown BEFORE the citizen's complaint is submitted when the
 * DuplicateDetectionService finds one or more possibly related complaints.
 *
 * The citizen can:
 *  1. Track an existing complaint — no new record is created.
 *  2. Submit Anyway  — the normal submission flow continues.
 *
 * Language is deliberately tentative ("may describe the same problem") —
 * deterministic matching is not perfect and the citizen should always have
 * the final say.
 */
export default function DuplicateWarningModal({
  open,
  onClose,
  onSubmitAnyway,
  matches = [],
  isStrong = false,
}) {
  const navigate = useNavigate();
  const count = matches.length;

  const headingIcon   = isStrong ? "bi-exclamation-triangle-fill" : "bi-info-circle-fill";
  const headingTone   = isStrong ? "dup-warn__heading--strong" : "dup-warn__heading--mild";
  const headingText   = count > 1
    ? `${count} Similar Reports Found`
    : "Possible Related Complaint";

  const subText = count > 1
    ? `${count} existing complaint${count > 1 ? "s" : ""} may describe the same problem in this area.`
    : "An existing complaint may describe the same problem in this area.";

  const handleTrack = (id) => {
    onClose();
    navigate(complaintPath(id));
  };

  const statusNote = (match) => {
    if (match.status === COMPLAINT_STATUS.RESOLVED) {
      return "A similar problem was previously reported and resolved. Submit if the issue has returned.";
    }
    if (match.status === COMPLAINT_STATUS.IN_PROGRESS) {
      return "This problem may already be handled by a field team.";
    }
    if (match.status === COMPLAINT_STATUS.ASSIGNED) {
      return "An officer has already been assigned to this area.";
    }
    return null;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      title=""
      hideClose={false}
      footer={
        <>
          <Button
            variant="secondary"
            icon="bi-x"
            onClick={onClose}
          >
            Go back
          </Button>
          <Button
            variant="primary"
            icon="bi-send"
            onClick={onSubmitAnyway}
          >
            Submit Anyway
          </Button>
        </>
      }
    >
      {/* --- Header --- */}
      <div className="dup-warn__header">
        <span className={`dup-warn__icon ${isStrong ? "dup-warn__icon--strong" : ""}`}>
          <i className={`bi ${headingIcon}`} aria-hidden="true" />
        </span>
        <div>
          <h3 className={`dup-warn__title ${headingTone}`}>{headingText}</h3>
          <p className="dup-warn__sub">{subText}</p>
        </div>
      </div>

      {/* --- Match list --- */}
      <ul className="dup-warn__list" aria-label="Possibly related complaints">
        {matches.map((match) => {
          const note = statusNote(match);
          return (
            <li key={match.id} className="dup-warn__item">
              <div className="dup-warn__item-head">
                <div className="dup-warn__item-meta">
                  <span className="dup-warn__item-id mono">{match.id}</span>
                  <StatusBadge status={match.status} size="sm" />
                </div>
                <span className="dup-warn__similarity" title="Estimated similarity">
                  <i className="bi bi-diagram-3" aria-hidden="true" />
                  {toPercent(match.similarity)} similar
                </span>
              </div>

              <p className="dup-warn__item-title">{match.title}</p>

              <div className="dup-warn__item-foot">
                <span className="dup-warn__item-loc">
                  <i className="bi bi-geo-alt" aria-hidden="true" />
                  {match.distanceLabel}
                </span>
                <span className="dup-warn__item-time">
                  <i className="bi bi-clock" aria-hidden="true" />
                  {timeAgo(match.createdAt)}
                </span>
                {match.categoryLabel && (
                  <span className="chip chip--soft chip--xs">
                    {match.categoryLabel}
                  </span>
                )}
              </div>

              {note && (
                <p className="dup-warn__item-note">
                  <i className="bi bi-info-circle" aria-hidden="true" />
                  {note}
                </p>
              )}

              <div className="dup-warn__item-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  icon="bi-eye"
                  onClick={() => handleTrack(match.id)}
                >
                  Track existing complaint
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* --- Footer note --- */}
      <p className="dup-warn__footer-note">
        <i className="bi bi-shield-check" aria-hidden="true" />
        This is an AI similarity estimate, not a confirmed duplicate. You can
        always submit your report if you believe it describes a separate issue.
      </p>
    </Modal>
  );
}
