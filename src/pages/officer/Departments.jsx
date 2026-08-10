import { useMemo } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";

import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { departmentWorkload } from "../../utils/grievanceUtils";
import { PATHS } from "../../utils/constants";

/**
 * Icons per department. Purely presentational — the departments themselves
 * come from `DEPARTMENTS` via `departmentWorkload`, so adding one there does
 * not require touching this page (it just falls back to a generic icon).
 */
const ICONS = {
  "Public Works Department": "bi-cone-striped",
  "Sanitation Department": "bi-trash3",
  "Water Supply Board": "bi-droplet-half",
  "Electrical Department": "bi-lightbulb",
  "Drainage Department": "bi-water",
  "Power Distribution": "bi-lightning-charge",
  "Urban Development": "bi-building-gear",
};

/**
 * Department workload.
 *
 * Every figure on this page is counted from the live complaint list at render
 * time — file a complaint that routes to Sanitation and its Total and Pending
 * both increase here. Departments with nothing in the queue stay listed at
 * zero rather than disappearing, because a department vanishing from the page
 * reads as a bug rather than as an empty queue.
 */
export default function OfficerDepartments() {
  useDocumentTitle("Departments");

  const { complaints } = useGrievances();
  const departments = useMemo(
    () => departmentWorkload(complaints),
    [complaints],
  );

  const busiest = departments[0]?.total ?? 0;

  return (
    <div className="stack-6">
      <PageHeader
        title="Departments"
        description="Live workload for every department, counted from the complaints currently in the system."
        breadcrumbs={[
          { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
          { label: "Departments" },
        ]}
      />

      {complaints.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="bi-building"
            title="No complaints to distribute yet"
            description="Department workloads are derived from live complaints. Once citizens start filing, each department's queue appears here."
            actionLabel="Open the queue"
            actionTo={PATHS.OFFICER_COMPLAINTS}
          />
        </Card>
      ) : (
        <div className="row g-3">
          {departments.map((dept) => {
            const open = dept.pending + dept.assigned + dept.inProgress;
            const load = busiest ? (dept.total / busiest) * 100 : 0;

            return (
              <div className="col-12 col-md-6 col-xxl-4" key={dept.name}>
                <Card padding="lg" className="dept-card">
                  <div className="dept-card__head">
                    <span className="icon-tile icon-tile--primary">
                      <i
                        className={`bi ${ICONS[dept.name] ?? "bi-buildings"}`}
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <h3 className="dept-card__name">{dept.name}</h3>
                      <p className="dept-card__sub">
                        {open} open · {dept.total} total
                      </p>
                    </div>
                  </div>

                  <div
                    className="mini-bar"
                    role="progressbar"
                    aria-valuenow={dept.total}
                    aria-valuemin={0}
                    aria-valuemax={busiest}
                    aria-label={`${dept.name} share of the busiest department`}
                  >
                    <div className="mini-bar__fill" style={{ width: `${load}%` }} />
                  </div>

                  <dl className="dept-card__stats">
                    <div>
                      <dt>Total</dt>
                      <dd>{dept.total}</dd>
                    </div>
                    <div>
                      <dt>Pending</dt>
                      <dd className="is-amber">{dept.pending}</dd>
                    </div>
                    <div>
                      <dt>In progress</dt>
                      <dd className="is-teal">{dept.inProgress}</dd>
                    </div>
                    <div>
                      <dt>Resolved</dt>
                      <dd className="is-success">{dept.resolved}</dd>
                    </div>
                  </dl>

                  <div className="dept-card__foot">
                    {dept.slaBreached > 0 ? (
                      <span className="sla-chip sla-chip--critical">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                        {dept.slaBreached} past SLA
                      </span>
                    ) : (
                      <span className="sla-chip sla-chip--success">
                        <i className="bi bi-check2" aria-hidden="true" />
                        Within SLA
                      </span>
                    )}

                    <span className="dept-card__rate">
                      {dept.resolutionRate == null
                        ? "No data"
                        : `${dept.resolutionRate}% closed`}
                    </span>
                  </div>

                  <Link
                    className="dept-card__link"
                    to={`${PATHS.OFFICER_COMPLAINTS}?department=${encodeURIComponent(dept.name)}`}
                  >
                    View queue
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </Link>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
