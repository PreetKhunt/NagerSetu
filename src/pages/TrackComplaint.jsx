import { useState } from "react";
import Button from "../components/common/Button";
import FormField from "../components/common/FormField";
import Card, { CardHeader } from "../components/common/Card";
import SectionHeading from "../components/common/SectionHeading";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import PriorityBadge from "../components/common/PriorityBadge";
import ComplaintStatusTracker from "../components/complaints/ComplaintStatusTracker";
import ActivityTimeline from "../components/complaints/ActivityTimeline";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useGrievances from "../hooks/useGrievances";
import { formatDateTime } from "../utils/formatters";
import { PATHS } from "../utils/constants";

const SAMPLE_ID = "GRV-2026-004812";

/**
 * Public complaint lookup — no sign-in required, mirroring how citizens
 * actually check on a report they filed at a kiosk or over the phone.
 *
 * Reads the same store the dashboards write to, so an ID handed out by the
 * success screen a minute ago resolves here, and the status shown is whatever
 * the officer last set.
 */
export default function TrackComplaint() {
  useDocumentTitle("Track a complaint");

  const { complaints } = useGrievances();

  const [id, setId] = useState("");
  const [status, setStatus] = useState("idle"); // idle | found | missing
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = id.trim();
    if (!trimmed) {
      setError("Enter the complaint ID from your acknowledgement message");
      return;
    }

    setError("");
    const key = trimmed.toLowerCase();
    const match = complaints.find((c) => c.id.toLowerCase() === key);

    setComplaint(match ?? null);
    setStatus(match ? "found" : "missing");
  };

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Complaint lookup"
          title="Track a complaint"
          description="Enter the reference ID you received when the complaint was registered. No account needed."
        />

        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-7">
            <Card padding="lg">
              <form onSubmit={handleSubmit} noValidate>
                <FormField
                  label="Complaint ID"
                  name="complaint-id"
                  icon="bi-hash"
                  placeholder={SAMPLE_ID}
                  hint={`Format: GRV-YYYY-NNNNNN. Try ${SAMPLE_ID} in this prototype.`}
                  value={id}
                  onChange={(event) => {
                    setId(event.target.value);
                    setError("");
                  }}
                  error={error}
                  required
                />

                <div className="cluster">
                  <Button type="submit" icon="bi-search">
                    Track complaint
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setId(SAMPLE_ID);
                      setError("");
                    }}
                  >
                    Use the sample ID
                  </Button>
                </div>
              </form>
            </Card>

            {status === "missing" && (
              <Card padding="lg" className="mt-4">
                <EmptyState
                  icon="bi-search"
                  title="No complaint with that ID"
                  description="Check the reference against your acknowledgement SMS or email. IDs look like GRV-2026-004812."
                  actionLabel="Lodge a new complaint"
                  actionTo={PATHS.REGISTER}
                />
              </Card>
            )}

            {status === "found" && complaint && (
              <Card padding="lg" className="mt-4">
                <p className="track-found">
                  <i className="bi bi-check2-circle" aria-hidden="true" />
                  <span>
                    <strong>Complaint found</strong>
                    <span className="track-found__sub">
                      Last updated {formatDateTime(complaint.updatedAt ?? complaint.createdAt)}
                    </span>
                  </span>
                </p>

                <CardHeader
                  title={complaint.title}
                  subtitle={`${complaint.id} · ${complaint.location}`}
                />

                <div className="cluster mb-4">
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} showSource />
                  <span className="chip chip--soft">
                    <i className="bi bi-building" aria-hidden="true" />
                    {complaint.department}
                  </span>
                  <span className="chip chip--soft">
                    <i className="bi bi-cpu" aria-hidden="true" />
                    AI {complaint.aiAnalysis?.confidence ?? 80}% confident
                  </span>
                </div>

                <p className="text-muted-soft">{complaint.description}</p>

                <div className="my-5">
                  <ComplaintStatusTracker
                    status={complaint.status}
                    timeline={complaint.timeline}
                  />
                </div>

                <h3 className="h6 mb-3">Activity log</h3>
                <ActivityTimeline entries={complaint.timeline} />
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
