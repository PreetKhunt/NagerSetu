import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import OfficerFilters from "../../components/officer/OfficerFilters";
import OfficerComplaintTable from "../../components/officer/OfficerComplaintTable";
import Pagination from "../../components/officer/Pagination";

import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { filterComplaints, paginate } from "../../utils/grievanceUtils";
import { OFFICER_PAGE_SIZE, PATHS } from "../../utils/constants";

const INITIAL = {
  search: "",
  status: "all",
  category: "all",
  priority: "all",
  department: "all",
  from: "",
  to: "",
  sort: "recent",
};

/**
 * The officer work queue.
 *
 * Filtering and sorting run through `filterComplaints` — the same pure helper
 * the citizen list uses — over the one shared complaint array, and pagination
 * slices the result afterwards. Nothing here holds its own copy of the data,
 * so a complaint filed a second ago is in this table on the next render.
 *
 * `?status=` is read from the URL on mount so the dashboard tiles and the
 * departments page can deep-link into a pre-filtered queue.
 */
export default function OfficerComplaints() {
  useDocumentTitle("Complaint queue");

  const { complaints } = useGrievances();
  const [params] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    ...INITIAL,
    search: params.get("q") ?? "",
    status: params.get("status") ?? "all",
    priority: params.get("priority") ?? "all",
    department: params.get("department") ?? "all",
  }));
  const [page, setPage] = useState(1);

  const results = useMemo(
    () => filterComplaints(complaints, filters),
    [complaints, filters],
  );

  const view = paginate(results, page, OFFICER_PAGE_SIZE);

  // Changing a filter must return to page 1 — staying on page 4 of a result
  // set that now has two pages shows an empty table for no visible reason.
  const change = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const reset = () => {
    setFilters(INITIAL);
    setPage(1);
  };

  return (
    <div className="stack-6">
      <PageHeader
        title="Complaint queue"
        description="Every grievance in the system, filterable by status, priority, department and date."
        breadcrumbs={[
          { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
          { label: "Complaints" },
        ]}
      />

      <Card padding="lg">
        <OfficerFilters
          filters={filters}
          onChange={change}
          onReset={reset}
          resultCount={results.length}
          total={complaints.length}
        />
      </Card>

      {view.items.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={complaints.length ? "bi-search" : "bi-inbox"}
            title={
              complaints.length
                ? "No complaints match these filters"
                : "No complaints have been filed yet"
            }
            description={
              complaints.length
                ? "Try widening the date range or clearing a filter — the queue itself is not empty."
                : "As soon as a citizen submits a grievance it lands here, already classified and routed to a department."
            }
            secondaryLabel={complaints.length ? "Clear filters" : undefined}
            onSecondary={complaints.length ? reset : undefined}
          />
        </Card>
      ) : (
        <Card padding="none">
          <OfficerComplaintTable complaints={view.items} />
          <div className="queue-foot">
            <Pagination
              page={view.page}
              pages={view.pages}
              from={view.from}
              to={view.to}
              total={view.total}
              onChange={setPage}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
