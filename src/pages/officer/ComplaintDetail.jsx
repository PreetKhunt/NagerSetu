import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import ConfidenceMeter from "../../components/common/ConfidenceMeter";
import ComplaintStatusTracker from "../../components/complaints/ComplaintStatusTracker";
import ActivityTimeline from "../../components/complaints/ActivityTimeline";
import ProblemClusterPanel from "../../components/complaints/ProblemClusterPanel";
import StatusUpdateModal from "../../components/officer/StatusUpdateModal";
import AssignOfficerModal from "../../components/officer/AssignOfficerModal";

import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import useComplaint from "../../hooks/useComplaint";
import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { formatDateTime, timeAgo } from "../../utils/formatters";
import { formatRemaining } from "../../utils/grievanceUtils";
import { findRelatedComplaints, DUPLICATE_THRESHOLD } from "../../services/DuplicateDetectionService";
import {
  CLOSED_STATUSES,
  PATHS,
  SLA_META,
  STATUS_META,
} from "../../utils/constants";

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

/**
 * Officer view of a single complaint.
 *
 * The record is read from the shared store by id, so this is the exact
 * complaint the citizen filed — same description, same photo, same AI
 * analysis, same timeline. Acting on it here writes back to that same store,
 * which is why the citizen's tracker and the dashboard counters move without
 * either page being reloaded.
 */
export default function OfficerComplaintDetail() {
  const { id } = useParams();
  const complaint = useComplaint(id);
  const { complaints, updateStatus, assignOfficer } = useGrievances();
  const { user } = useAuth();
  const toast = useToast();

  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  // Duplicate detection state
  const duplicateResult = useMemo(() => {
    if (!complaint || !complaints?.length) return null;
    return findRelatedComplaints(complaint, complaints, {
      threshold: DUPLICATE_THRESHOLD,
      limit: 50,
    });
  }, [complaint, complaints]);

  useDocumentTitle(complaint ? `${complaint.id} — review` : "Complaint");

  if (!complaint) {
    return (
      <div className="stack-6">
        <PageHeader
          title="Complaint not found"
          breadcrumbs={[
            { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
            { label: "Complaints", to: PATHS.OFFICER_COMPLAINTS },
            { label: "Not found" },
          ]}
        />
        <Card padding="lg">
          <EmptyState
            icon="bi-question-circle"
            title={`No complaint with the reference ${id}`}
            description="It may have been cleared from the demo data, or the reference may be mistyped."
            actionLabel="Back to the queue"
            actionTo={PATHS.OFFICER_COMPLAINTS}
          />
        </Card>
      </div>
    );
  }

  const officerName = user?.name ?? "Officer";
  const closed = CLOSED_STATUSES.includes(complaint.status);
  const slaMeta = SLA_META[complaint.sla.state];
  const ai = complaint.aiAnalysis ?? {};

  const applyStatus = (change) => {
    updateStatus(complaint.id, change);
    setStatusOpen(false);
    toast.success(
      "Status updated",
      `${complaint.id} is now ${STATUS_META[change.status]?.label ?? change.status}.`,
    );
  };

  const applyAssignment = (officer, actor) => {
    assignOfficer(complaint.id, officer, actor);
    setAssignOpen(false);
    toast.success("Officer assigned", `Complaint assigned to ${officer.name}.`);
  };

  return (
    <div className="stack-6">
      <PageHeader
        title={complaint.title}
        description={`${complaint.id} · filed ${timeAgo(complaint.createdAt)} by ${complaint.citizenName}`}
        breadcrumbs={[
          { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
          { label: "Complaints", to: PATHS.OFFICER_COMPLAINTS },
          { label: complaint.id },
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              icon="bi-person-check"
              onClick={() => setAssignOpen(true)}
            >
              {complaint.assignedOfficer ? "Reassign" : "Assign officer"}
            </Button>
            <Button icon="bi-arrow-repeat" onClick={() => setStatusOpen(true)}>
              Update status
            </Button>
          </>
        }
      />

      <div className="detail-strip">
        <StatusBadge status={complaint.status} />
        <PriorityBadge priority={complaint.priority} />
        <span className={`sla-chip sla-chip--${slaMeta.tone}`}>
          <i className={`bi ${slaMeta.icon}`} aria-hidden="true" />
          {complaint.sla.closed
            ? `Closed · ${slaMeta.label}`
            : `${slaMeta.label} · ${formatRemaining(complaint.sla.remainingMs)}`}
        </span>
        <span className="detail-strip__meta">
          Updated {timeAgo(complaint.updatedAt)}
        </span>
      </div>

      <ComplaintStatusTracker
        status={complaint.status}
        timeline={complaint.timeline}
      />

      <div className="row g-4">
        {/* ---------- Left: the complaint itself ---------- */}
        <div className="col-12 col-xl-8">
          <div className="stack-4">
            <Card padding="lg">
              <CardHeader
                title="Complaint information"
                subtitle="Exactly as the citizen submitted it"
              />

              <p className="detail__description">{complaint.description}</p>

              <div className="info-grid">
                <Row icon="bi-hash" label="Complaint ID">
                  <span className="mono">{complaint.id}</span>
                </Row>
                <Row icon="bi-tags" label="Category">
                  {complaint.categoryLabel}
                </Row>
                <Row icon="bi-card-text" label="Issue type">
                  {complaint.issueType}
                </Row>
                <Row icon="bi-building" label="Department">
                  {complaint.department}
                </Row>
                <Row icon="bi-clock" label="Created">
                  {formatDateTime(complaint.createdAt)}
                </Row>
                <Row icon="bi-arrow-repeat" label="Last updated">
                  {formatDateTime(complaint.updatedAt)}
                </Row>
                <Row icon="bi-translate" label="Language">
                  {complaint.language ?? "English"}
                </Row>
                <Row icon="bi-input-cursor-text" label="Submitted via">
                  {complaint.isVoice ? "Voice" : complaint.hasImage ? "Photo" : "Text"}
                </Row>
              </div>

              {complaint.voiceTranscript && (
                <div className="transcript-block">
                  <p className="transcript-block__label">
                    <i className="bi bi-mic" aria-hidden="true" />
                    Voice transcript
                  </p>
                  <p className="transcript-block__text">
                    “{complaint.voiceTranscript}”
                  </p>
                </div>
              )}
            </Card>

            <Card padding="lg">
              <CardHeader
                title="AI analysis"
                subtitle="Keyword classification run at submission — not a language model"
              />

              <div className="info-grid">
                <Row icon="bi-tags" label="Detected category">
                  {ai.categoryLabel ?? complaint.categoryLabel}
                </Row>
                <Row icon="bi-building" label="Suggested department">
                  {ai.suggestedDepartment ?? complaint.department}
                </Row>
                <Row icon="bi-speedometer2" label="Suggested priority">
                  <PriorityBadge
                    priority={ai.suggestedPriority ?? complaint.priority}
                    size="sm"
                  />
                </Row>
                <Row icon="bi-files" label="Duplicate reports">
                  {ai.duplicateCount ?? 0}
                </Row>
              </div>

              <div className="mt-3">
                <ConfidenceMeter value={(ai.confidence ?? 80) / 100} />
              </div>

              {ai.summary && <p className="ai-summary">{ai.summary}</p>}

              {ai.matchedKeywords?.length > 0 && (
                <p className="ai-keywords">
                  <span>Matched terms:</span>
                  {ai.matchedKeywords.map((word) => (
                    <span className="ai-keywords__chip" key={word}>
                      {word}
                    </span>
                  ))}
                </p>
              )}
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Image evidence"
                subtitle={
                  complaint.image
                    ? "Photo attached by the citizen"
                    : "No photo was attached to this complaint"
                }
              />

              {complaint.image ? (
                <img
                  className="evidence__img"
                  src={complaint.image}
                  alt={`Evidence submitted with complaint ${complaint.id}`}
                />
              ) : (
                <div className="evidence__none">
                  <i className="bi bi-image" aria-hidden="true" />
                  <p>
                    {complaint.imageDropped
                      ? "The photo could not be restored from local storage."
                      : "Nothing to review — this complaint was filed without a photo."}
                  </p>
                </div>
              )}

              {complaint.resolutionImage && (
                <>
                  <p className="evidence__label">Resolution photo</p>
                  <img
                    className="evidence__img"
                    src={complaint.resolutionImage}
                    alt={`Proof of work for complaint ${complaint.id}`}
                  />
                </>
              )}
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Activity history"
                subtitle="Every action taken on this complaint, newest first"
              />
              <ActivityTimeline entries={complaint.timeline} />
            </Card>
          </div>
        </div>

        {/* ---------- Right: who, where, and what to do next ---------- */}
        <div className="col-12 col-xl-4">
          <div className="stack-4">
            <Card padding="lg">
              <CardHeader title="Citizen information" />
              <div className="info-grid info-grid--single">
                <Row icon="bi-person" label="Name">
                  {complaint.citizenName}
                </Row>
                <Row icon="bi-person-badge" label="Citizen ID">
                  <span className="mono">{complaint.userId}</span>
                </Row>
                <Row icon="bi-clock-history" label="Filed">
                  {timeAgo(complaint.createdAt)}
                </Row>
              </div>
            </Card>

            <Card padding="lg">
              <CardHeader title="Assigned officer" />
              {complaint.assignedOfficer ? (
                <div className="assignee">
                  <span className="assignee__avatar" aria-hidden="true">
                    <i className="bi bi-person-check" />
                  </span>
                  <div>
                    <p className="assignee__name">
                      {complaint.assignedOfficer.name}
                    </p>
                    <p className="assignee__role">
                      {complaint.assignedOfficer.designation}
                    </p>
                    <p className="assignee__contact">
                      {complaint.assignedOfficer.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="assignee assignee--empty">
                  <span className="assignee__avatar" aria-hidden="true">
                    <i className="bi bi-person-dash" />
                  </span>
                  <div>
                    <p className="assignee__name">Not yet assigned</p>
                    <p className="assignee__role">
                      This complaint is waiting in the {complaint.department}{" "}
                      queue.
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                icon="bi-person-check"
                block
                className="mt-3"
                onClick={() => setAssignOpen(true)}
              >
                {complaint.assignedOfficer ? "Reassign officer" : "Assign officer"}
              </Button>
            </Card>

            <Card padding="lg">
              <CardHeader title="Location" />
              <p className="detail__place">
                <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                {complaint.location}
              </p>

              {complaint.coords && (
                <>
                  <p className="detail__coords mono">
                    {complaint.coords.latitude.toFixed(5)},{" "}
                    {complaint.coords.longitude.toFixed(5)}
                    {complaint.coords.approximate && (
                      <span className="detail__approx"> approximate</span>
                    )}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="bi-map"
                    to={`${PATHS.OFFICER_MAP}?focus=${encodeURIComponent(complaint.id)}`}
                  >
                    Show on the map
                  </Button>
                </>
              )}
            </Card>

            {closed && complaint.resolutionNote && (
              <Card padding="lg">
                <CardHeader title="Resolution" />
                <p className="detail__resolution">{complaint.resolutionNote}</p>
              </Card>
            )}

            {duplicateResult?.hasPossibleDuplicate && (
              <Card padding="lg">
                <CardHeader
                  title="Similar complaints"
                  subtitle="AI detected potential related reports based on description and location"
                />
                <ProblemClusterPanel
                  relatedMatches={duplicateResult.matches}
                  currentId={complaint.id}
                  isOfficer={true}
                  clusterId={duplicateResult.clusterId}
                />
              </Card>
            )}
          </div>
        </div>
      </div>

      <StatusUpdateModal
        open={statusOpen}
        complaint={complaint}
        officerName={officerName}
        onClose={() => setStatusOpen(false)}
        onSubmit={applyStatus}
      />

      <AssignOfficerModal
        open={assignOpen}
        complaint={complaint}
        actorName={officerName}
        onClose={() => setAssignOpen(false)}
        onSubmit={applyAssignment}
      />
    </div>
  );
}
