import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ComplaintCard from "../../components/complaints/ComplaintCard";
import ComplaintFilters from "../../components/complaints/ComplaintFilters";
import ComplaintTable from "../../components/complaints/ComplaintTable";

import useDocumentTitle from "../../hooks/useDocumentTitle";
import useGrievances from "../../hooks/useGrievances";
import { filterComplaints } from "../../utils/grievanceUtils";
import { PATHS, complaintPath } from "../../utils/constants";

const INITIAL_FILTERS = {
  search: "",
  status: "all",
  category: "all",
  priority: "all",
  sort: "recent",
};

/**
 * All complaints for the signed-in citizen.
 *
 * Filtering runs through the shared `filterComplaints` helper — the same one
 * the officer table uses — so the two lists can never interpret an identical
 * filter differently. There is no skeleton state because the store is read
 * synchronously; a placeholder for data that is already present would be
 * theatre.
 */
export default function MyComplaints() {
  useDocumentTitle("My complaints");

  const { complaints } = useGrievances();

  // Seeded once from ?q= so the topbar search can hand off to this page.
  const [params] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...INITIAL_FILTERS,
    search: params.get("q") ?? "",
  }));
  const [view, setView] = useState("cards");

  const results = useMemo(
    () => filterComplaints(complaints, filters),
    [complaints, filters],
  );

  const change = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  // Compared by value, not identity: `change()` always produces a new object,
  // and a fresh citizen with no complaints must see the welcome empty state
  // rather than "nothing matches these filters".
  const filtered = Object.keys(INITIAL_FILTERS).some(
    (key) => filters[key] !== INITIAL_FILTERS[key],
  );
  const isEmpty = results.length === 0;

  return (
    <div className="stack-5">
      <PageHeader
        title="My complaints"
        description="Every issue you have reported, with its current status and the department handling it."
        breadcrumbs={[
          { label: "Citizen", to: PATHS.CITIZEN_DASHBOARD },
          { label: "My complaints" },
        ]}
        actions={
          <Button to={PATHS.CITIZEN_NEW} icon="bi-plus-lg">
            New complaint
          </Button>
        }
      />

      <ComplaintFilters
        filters={filters}
        onChange={change}
        onReset={() => setFilters(INITIAL_FILTERS)}
        resultCount={results.length}
        view={view}
        onViewChange={setView}
      />

      {isEmpty && (
        <Card padding="lg">
          {filtered ? (
            <EmptyState
              icon="bi-funnel"
              title="No complaints match these filters"
              description="Try widening the status or category filter, or clear the search."
              actionLabel="Clear filters"
              onAction={() => setFilters(INITIAL_FILTERS)}
            />
          ) : (
            <EmptyState
              icon="bi-clipboard-check"
              title="No complaints yet"
              description="When you report a civic issue it appears here, with its status updated at every stage."
              actionLabel="Lodge your first complaint"
              actionTo={PATHS.CITIZEN_NEW}
              secondaryLabel="Track by ID"
              secondaryTo={PATHS.TRACK}
            />
          )}
        </Card>
      )}

      {!isEmpty && (
        <>
          {/* Table is desktop-only; the card list is the mobile presentation. */}
          {view === "table" && (
            <>
              <div className="d-none d-lg-block">
                <Card padding="none">
                  <ComplaintTable complaints={results} />
                </Card>
              </div>
              <div className="d-lg-none stack-3">
                {results.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    to={complaintPath(complaint.id)}
                  />
                ))}
              </div>
            </>
          )}

          {view === "cards" && (
            <div className="stack-3">
              {results.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  to={complaintPath(complaint.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
