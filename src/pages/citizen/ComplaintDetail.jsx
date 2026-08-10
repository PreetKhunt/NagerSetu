import { useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import ConfidenceMeter from "../../components/common/ConfidenceMeter";
import MapPlaceholder from "../../components/common/MapPlaceholder";
import ComplaintStatusTracker from "../../components/complaints/ComplaintStatusTracker";
import ActivityTimeline from "../../components/complaints/ActivityTimeline";
import OfficerCard from "../../components/complaints/OfficerCard";
import RelatedComplaints from "../../components/complaints/RelatedComplaints";

import useToast from "../../hooks/useToast";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useComplaint from "../../hooks/useComplaint";
import useGrievances from "../../hooks/useGrievances";
import { COMPLAINT_STATUS, PATHS } from "../../utils/constants";
import { formatDate, formatDateTime, timeAgo } from "../../utils/formatters";

/**
 * Full record for one complaint: lifecycle, activity log, assigned officer,
 * location and AI-flagged duplicates.
 *
 * Everything on the page comes from the shared store, so an officer moving
 * this complaint to In Progress changes what the citizen sees here — no
 * refetch, no second copy of the record. Reopening writes back to that same
 * store, which is why the officer queue picks it up immediately.
 */
export default function ComplaintDetail() {
  const { id } = useParams();
  useDocumentTitle(id ? `Complaint ${id}` : "Complaint");

  const toast = useToast();
  const complaint = useComplaint(id);
  const { updateStatus } = useGrievances();
  const [reopenOpen, setReopenOpen] = useState(false);

  const reopen = () => {
    updateStatus(complaint.id, {
      status: COMPLAINT_STATUS.REOPENED,
      note: "Reopened by the citizen — the issue has recurred.",
      actor: complaint.citizenName ?? "Citizen",
    });
    setReopenOpen(false);
    toast.success("Complaint reopened", "The department has been notified.");
  };

  if (!complaint) {
    return (
      <Card padding="lg">
        <EmptyState
          icon="bi-search"
          title="Complaint not found"
          description={`No complaint matches the ID "${id}".`}
          actionLabel="Back to my complaints"
          actionTo={PATHS.CITIZEN_COMPLAINTS}
          secondaryLabel="Track by ID"
          secondaryTo={PATHS.TRACK}
        />
      </Card>
    );
  }

  const isResolved = complaint.status === COMPLAINT_STATUS.RESOLVED;

  return (
    <div className="stack-5">
      <PageHeader
        title={complaint.title}
        description={`Reference ${complaint.id} · reported ${timeAgo(complaint.createdAt)}`}
        breadcrumbs={[
          { label: "Citizen", to: PATHS.CITIZEN_DASHBOARD },
          { label: "My complaints", to: PATHS.CITIZEN_COMPLAINTS },
          { label: complaint.id },
        ]}
        actions={
          <>
            {isResolved && (
              <Button
                variant="secondary"
                icon="bi-arrow-counterclockwise"
                onClick={() => setReopenOpen(true)}
              >
                Reopen
              </Button>
            )}
            <Button
              variant="ghost"
              icon="bi-printer"
              onClick={() => window.print()}
            >
              Print
            </Button>
          </>
        }
      />

      <div className="row g-4">
        {/* ---------- Main column ---------- */}
        <div className="col-12 col-xl-8">
          <div className="stack-4">
            <Card padding="lg">
              <div className="detail__badges">
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} showSource />
                <span className="chip chip--soft">
                  <i className="bi bi-building" aria-hidden="true" />
                  {complaint.department}
                </span>
                <span className="chip chip--soft">
                  <i className="bi bi-tags" aria-hidden="true" />
                  {complaint.categoryLabel}
                </span>
                {complaint.language && (
                  <span className="chip chip--soft">
                    <i className="bi bi-translate" aria-hidden="true" />
                    {complaint.language}
                  </span>
                )}
                {complaint.isVoice && (
                  <span className="chip chip--soft">
                    <i className="bi bi-mic-fill" aria-hidden="true" />
                    Voice complaint
                  </span>
                )}
              </div>

              <div className="detail__tracker">
                <ComplaintStatusTracker
                  status={complaint.status}
                  timeline={complaint.timeline}
                />
              </div>

              <h2 className="detail__heading">Description</h2>
              <p className="detail__desc">{complaint.description}</p>

              {complaint.hasImage && (
                <figure className="detail__photo">
                  {complaint.image ? (
                    // The citizen's own upload, held as a data URL in the
                    // store. Seed records have no file, so those fall back to
                    // the frame rather than a broken <img>.
                    <img
                      className="detail__photo-img"
                      src={complaint.image}
                      alt={`Photo attached to complaint ${complaint.id}`}
                    />
                  ) : (
                    <div className="detail__photo-frame" aria-hidden="true">
                      <i className="bi bi-image" />
                    </div>
                  )}
                  <figcaption>
                    <i className="bi bi-paperclip" aria-hidden="true" />
                    {complaint.imageName ?? "Photo attached by you"}
                  </figcaption>
                </figure>
              )}

              <dl className="detail__facts">
                <div>
                  <dt>Complaint ID</dt>
                  <dd className="mono">{complaint.id}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{complaint.location}</dd>
                </div>
                <div>
                  <dt>Reported on</dt>
                  <dd>{formatDateTime(complaint.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDateTime(complaint.updatedAt ?? complaint.createdAt)}</dd>
                </div>
              </dl>

              {complaint.aiConfidence != null && (
                <div className="detail__confidence">
                  <ConfidenceMeter
                    value={complaint.aiConfidence}
                    label="AI classification confidence"
                    size="sm"
                  />
                </div>
              )}
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Activity history"
                subtitle="Every update recorded against this complaint"
              />
              <ActivityTimeline entries={complaint.timeline} />
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Location"
                subtitle={complaint.location}
                action={
                  <span className="chip chip--soft">
                    <i className="bi bi-pin-map" aria-hidden="true" />
                    Ward mapped
                  </span>
                }
              />
              <MapPlaceholder location={complaint.location} />
            </Card>
          </div>
        </div>

        {/* ---------- Side column ---------- */}
        <div className="col-12 col-xl-4">
          <div className="stack-4">
            <Card padding="lg">
              <CardHeader
                title={isResolved ? "Resolution" : "Estimated resolution"}
                subtitle={
                  isResolved
                    ? "This complaint is closed"
                    : `Target set from the ${complaint.priority} priority SLA`
                }
              />

              {isResolved ? (
                <>
                  <p className="eta eta--done">
                    <i className="bi bi-check2-circle" aria-hidden="true" />
                    Closed on {formatDate(complaint.updatedAt ?? complaint.createdAt)}
                  </p>
                  {complaint.resolutionNote && (
                    <p className="eta__note mb-0">{complaint.resolutionNote}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="eta">
                    <i className="bi bi-calendar-check" aria-hidden="true" />
                    <span>
                      <strong>{formatDate(complaint.eta)}</strong>
                      <span className="eta__sub">
                        {complaint.slaDays}-day service commitment
                      </span>
                    </span>
                  </p>
                  <p className="eta__note">
                    You are notified at every stage. If the target passes, the
                    complaint escalates to the ward officer automatically.
                  </p>
                </>
              )}
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Assigned officer"
                subtitle="Contact for updates on this issue"
              />
              <OfficerCard
                officer={complaint.officer}
                department={complaint.department}
              />
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Similar reports nearby"
                subtitle="Flagged by AI as possible duplicates"
              />
              <RelatedComplaints items={complaint.related} />
            </Card>
          </div>
        </div>
      </div>

      <Modal
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reopen this complaint?"
        description="Use this if the problem has come back or was not properly fixed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setReopenOpen(false)}>
              Cancel
            </Button>
            <Button icon="bi-arrow-counterclockwise" onClick={reopen}>
              Reopen complaint
            </Button>
          </>
        }
      >
        <p className="mb-0 text-muted-soft">
          {complaint.id} goes back to {complaint.department} with its original
          history attached, so nobody has to start from scratch.
        </p>
      </Modal>
    </div>
  );
}
