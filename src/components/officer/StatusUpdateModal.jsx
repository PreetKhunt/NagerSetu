import { useEffect, useState } from "react";

import Modal from "../common/Modal";
import Button from "../common/Button";
import SelectField from "../common/SelectField";
import TextareaField from "../common/TextareaField";
import StatusBadge from "../common/StatusBadge";
import { toStorableDataUrl } from "../../utils/imageTools";
import { COMPLAINT_STATUS, STATUS_META } from "../../utils/constants";

/**
 * Statuses an officer can move a complaint to.
 *
 * `registered` is absent deliberately: it is the state a complaint is born in,
 * and offering "move back to Registered" would let an officer erase the fact
 * that work had started rather than record it.
 */
const OPTIONS = [
  COMPLAINT_STATUS.ASSIGNED,
  COMPLAINT_STATUS.IN_PROGRESS,
  COMPLAINT_STATUS.RESOLVED,
  COMPLAINT_STATUS.REJECTED,
  COMPLAINT_STATUS.REOPENED,
].map((value) => ({ value, label: STATUS_META[value].label }));

/**
 * Officer status-change modal.
 *
 * Submitting calls `updateStatus` on the shared store, which appends the
 * timeline row, stamps `updatedAt`, raises the citizen's notification and
 * writes through to localStorage — so the citizen's tracker and every officer
 * statistic move on the same render.
 */
export default function StatusUpdateModal({
  open,
  complaint,
  onClose,
  onSubmit,
  officerName = "Officer",
}) {
  const [status, setStatus] = useState(COMPLAINT_STATUS.IN_PROGRESS);
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [proofName, setProofName] = useState("");
  const [proof, setProof] = useState(null);
  const [error, setError] = useState("");

  // Reset each time the modal opens, so a previous edit never leaks into the
  // next complaint an officer reviews.
  useEffect(() => {
    if (!open || !complaint) return;
    setStatus(
      complaint.status === COMPLAINT_STATUS.REGISTERED
        ? COMPLAINT_STATUS.ASSIGNED
        : COMPLAINT_STATUS.IN_PROGRESS,
    );
    setNote("");
    setResolution("");
    setProofName("");
    setProof(null);
    setError("");
  }, [open, complaint]);

  const resolving = status === COMPLAINT_STATUS.RESOLVED;

  const pickProof = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProofName(file.name);
    setProof(await toStorableDataUrl(file));
  };

  const submit = () => {
    if (resolving && !resolution.trim()) {
      setError("Describe what was done before marking this resolved.");
      return;
    }

    onSubmit({
      status,
      note: note.trim(),
      resolution: resolution.trim(),
      resolutionImage: proof,
      actor: officerName,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update complaint status"
      description={
        complaint
          ? `${complaint.id} — ${complaint.title}`
          : "Record what changed and who changed it."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="bi-check2" onClick={submit}>
            Save update
          </Button>
        </>
      }
    >
      <div className="stack-4">
        {complaint && (
          <p className="modal-note">
            Current status <StatusBadge status={complaint.status} size="sm" />
          </p>
        )}

        <SelectField
          label="New status"
          name="new-status"
          icon="bi-arrow-repeat"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setError("");
          }}
          options={OPTIONS}
          hint="The citizen sees this change immediately on their tracker."
        />

        <TextareaField
          label="Officer note"
          name="officer-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={400}
          showCount
          placeholder="What is happening on the ground? Visible in the complaint's activity history."
        />

        {resolving && (
          <>
            <TextareaField
              label="Resolution description"
              name="resolution"
              value={resolution}
              onChange={(event) => {
                setResolution(event.target.value);
                setError("");
              }}
              rows={4}
              maxLength={600}
              showCount
              required
              error={error}
              placeholder="Describe the work completed — the citizen reads this."
            />

            <div className="field">
              <span className="field__label">Resolution photo (optional)</span>
              <label className="proof-input">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={pickProof}
                />
                <i className="bi bi-camera" aria-hidden="true" />
                <span>{proofName || "Attach proof of work"}</span>
              </label>
              <p className="field__hint">
                Stored with the complaint and shown to the citizen as evidence.
              </p>
            </div>
          </>
        )}

        {!resolving && error && (
          <p className="field__error" role="alert">
            <i className="bi bi-exclamation-circle" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
