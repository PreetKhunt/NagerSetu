import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import ComplaintStatusTracker from "../../components/complaints/ComplaintStatusTracker";

import useToast from "../../hooks/useToast";
import useComplaint from "../../hooks/useComplaint";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { PATHS, complaintPath } from "../../utils/constants";
import { formatDateTime } from "../../utils/formatters";

/** One row of the reference card. */
function Detail({ icon, label, children, mono = false }) {
  return (
    <div className="receipt__row">
      <span className="receipt__label">
        <i className={`bi ${icon}`} aria-hidden="true" />
        {label}
      </span>
      <span className={`receipt__value${mono ? " mono" : ""}`}>{children}</span>
    </div>
  );
}

/**
 * Post-submission confirmation.
 *
 * Router state carries only the id; the record itself is read from the store,
 * so this page cannot show a stale snapshot of a complaint that has already
 * moved on. A direct visit with no id has nothing to confirm and is redirected
 * to the list instead of rendering an empty receipt.
 */
export default function ComplaintSubmitted() {
  useDocumentTitle("Complaint registered");

  const { state } = useLocation();
  const toast = useToast();
  const complaint = useComplaint(state?.complaintId);
  const [copied, setCopied] = useState(false);

  // Reset the "Copied" label so the button does not stay stuck.
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!complaint) {
    return <Navigate to={PATHS.CITIZEN_COMPLAINTS} replace />;
  }

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(complaint.id);
      setCopied(true);
    } catch {
      toast.info("Copy the ID", complaint.id);
    }
  };

  return (
    <div className="success-page">
      <Card padding="lg" className="success-card">
        <span className="success-card__glow" aria-hidden="true" />

        <div className="success-card__mark" aria-hidden="true">
          <span className="success-card__ring" />
          <i className="bi bi-check-lg" />
        </div>

        <h1 className="success-card__title">Complaint Registered Successfully</h1>
        <p className="success-card__sub">
          Your report reached {complaint.department}. Save the reference below —
          you can track it any time, even without signing in.
        </p>

        <div className="success-card__id">
          <span className="success-card__id-label">Complaint ID</span>
          <strong className="success-card__id-value mono">{complaint.id}</strong>
          <button
            type="button"
            className="success-card__copy"
            onClick={copyId}
            aria-live="polite"
          >
            <i
              className={`bi ${copied ? "bi-check-lg" : "bi-clipboard"}`}
              aria-hidden="true"
            />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <dl className="receipt">
          <Detail icon="bi-card-text" label="Issue">
            {complaint.title}
          </Detail>
          <Detail icon="bi-tags" label="Category">
            {complaint.categoryLabel}
          </Detail>
          <Detail icon="bi-speedometer2" label="Priority">
            <PriorityBadge priority={complaint.priority} size="sm" showSource />
          </Detail>
          <Detail icon="bi-building" label="Department">
            {complaint.department}
          </Detail>
          <Detail icon="bi-geo-alt" label="Location">
            {complaint.location}
          </Detail>
          <Detail icon="bi-clock" label="Submitted">
            {formatDateTime(complaint.createdAt)}
          </Detail>
          <Detail icon="bi-activity" label="Status">
            <StatusBadge status={complaint.status} size="sm" />
          </Detail>
        </dl>

        <div className="success-card__tracker">
          <ComplaintStatusTracker
            status={complaint.status}
            timeline={complaint.timeline}
          />
        </div>

        <div className="success-card__actions">
          <Button to={complaintPath(complaint.id)} icon="bi-geo" size="lg">
            Track Complaint
          </Button>
          <Button
            variant="secondary"
            to={PATHS.CITIZEN_COMPLAINTS}
            icon="bi-card-checklist"
            size="lg"
          >
            View My Complaints
          </Button>
        </div>

        <p className="success-card__next">
          <i className="bi bi-bell" aria-hidden="true" />
          You will be notified when an officer is assigned. Expect a first
          update within 24 hours.
        </p>

        <Link className="success-card__link" to={PATHS.CITIZEN_NEW}>
          Report another issue
        </Link>
      </Card>
    </div>
  );
}
