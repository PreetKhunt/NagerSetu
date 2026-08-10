import { useEffect, useMemo, useState } from "react";

import Modal from "../common/Modal";
import Button from "../common/Button";
import { ASSIGNABLE_OFFICERS } from "../../utils/mockData";
import { getInitials } from "../../utils/formatters";

/**
 * Assign a complaint to a field officer.
 *
 * Officers whose department matches the complaint are listed first and flagged
 * — cross-department assignment is allowed (a drainage problem sometimes needs
 * roads on site) but should be a deliberate choice, not an accident of list
 * order. Confirming calls `assignOfficer` on the shared store, which sets
 * `assignedOfficer`, moves a pending complaint to Assigned, and appends the
 * "Complaint assigned to …" timeline row.
 */
export default function AssignOfficerModal({
  open,
  complaint,
  onClose,
  onSubmit,
  actorName = "Officer",
}) {
  const [selectedId, setSelectedId] = useState(null);

  const roster = useMemo(() => {
    if (!complaint) return ASSIGNABLE_OFFICERS;
    return [...ASSIGNABLE_OFFICERS].sort((a, b) => {
      const aMatch = a.department === complaint.department ? 0 : 1;
      const bMatch = b.department === complaint.department ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [complaint]);

  // Preselect whoever already holds it, otherwise the best-matching officer.
  useEffect(() => {
    if (!open) return;
    setSelectedId(complaint?.assignedOfficer?.id ?? roster[0]?.id ?? null);
  }, [open, complaint, roster]);

  const selected = roster.find((officer) => officer.id === selectedId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign to an officer"
      description={
        complaint
          ? `${complaint.id} — ${complaint.department}`
          : "Choose who takes ownership of this complaint."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon="bi-person-check"
            disabled={!selected}
            onClick={() => selected && onSubmit(selected, actorName)}
          >
            Assign complaint
          </Button>
        </>
      }
    >
      <fieldset className="roster">
        <legend className="sr-only">Available officers</legend>

        {roster.map((officer) => {
          const sameDept = officer.department === complaint?.department;
          const active = officer.id === selectedId;

          return (
            <label
              className={`roster__item${active ? " roster__item--active" : ""}`}
              key={officer.id}
            >
              <input
                type="radio"
                name="assignee"
                className="sr-only"
                value={officer.id}
                checked={active}
                onChange={() => setSelectedId(officer.id)}
              />

              <span className="roster__avatar" aria-hidden="true">
                {getInitials(officer.name)}
              </span>

              <span className="roster__body">
                <span className="roster__name">
                  {officer.name}
                  {sameDept && (
                    <span className="roster__tag">Owning department</span>
                  )}
                </span>
                <span className="roster__role">
                  {officer.designation} · {officer.department}
                </span>
                <span className="roster__contact">{officer.email}</span>
              </span>

              <span className="roster__check" aria-hidden="true">
                <i className="bi bi-check-lg" />
              </span>
            </label>
          );
        })}
      </fieldset>

      {complaint?.assignedOfficer && (
        <p className="modal-note mt-3 mb-0">
          <i className="bi bi-info-circle" aria-hidden="true" />
          Currently assigned to {complaint.assignedOfficer.name}. Choosing
          someone else reassigns the complaint and records it in the timeline.
        </p>
      )}
    </Modal>
  );
}
