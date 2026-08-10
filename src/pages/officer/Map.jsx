import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card, { CardHeader } from "../../components/common/Card";
import SelectField from "../../components/common/SelectField";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import ComplaintMap from "../../components/officer/ComplaintMap";

import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { filterComplaints } from "../../utils/grievanceUtils";
import {
  CATEGORIES,
  COMPLAINT_STATUS,
  DEPARTMENTS,
  PRIORITY,
  PRIORITY_META,
  PATHS,
  STATUS_META,
  officerComplaintPath,
} from "../../utils/constants";

const ANY = { value: "all", label: "All" };

const STATUS_OPTIONS = [
  ANY,
  ...Object.values(COMPLAINT_STATUS).map((v) => ({
    value: v,
    label: STATUS_META[v].label,
  })),
];
const PRIORITY_OPTIONS = [
  ANY,
  ...Object.values(PRIORITY).map((v) => ({
    value: v,
    label: PRIORITY_META[v].label,
  })),
];
const CATEGORY_OPTIONS = [
  ANY,
  ...CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
];
const DEPARTMENT_OPTIONS = [
  ANY,
  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
];

/** Legend covers the priorities the brief calls out, highest first. */
const LEGEND = [PRIORITY.CRITICAL, PRIORITY.HIGH, PRIORITY.MEDIUM, PRIORITY.LOW];

/**
 * Complaint map.
 *
 * Markers are the same complaint records as everywhere else, positioned from
 * their stored coordinates — a complaint filed with "Use my location" plots at
 * the citizen's actual fix. The filters run through `filterComplaints`, so what
 * is visible on the map and what the selection panel lists can never disagree.
 */
export default function OfficerMap() {
  useDocumentTitle("Complaint map");

  const { complaints } = useGrievances();
  const [params] = useSearchParams();

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    department: "all",
    search: "",
    sort: "recent",
  });
  const [selectedId, setSelectedId] = useState(params.get("focus"));

  const visible = useMemo(
    () => filterComplaints(complaints, filters),
    [complaints, filters],
  );

  // A complaint filtered out of view must not stay pinned in the side panel.
  const selected = visible.find((c) => c.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const map = Object.fromEntries(LEGEND.map((p) => [p, 0]));
    for (const c of visible) {
      if (map[c.priority] != null) map[c.priority] += 1;
    }
    return map;
  }, [visible]);

  const set = (key) => (event) =>
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));

  const plotted = visible.filter((c) => c.coords?.latitude != null).length;

  return (
    <div className="stack-6">
      <PageHeader
        title="Complaint map"
        description="Where grievances are being reported, plotted from the coordinates captured at submission."
        breadcrumbs={[
          { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
          { label: "Map" },
        ]}
        actions={
          <Button
            variant="secondary"
            to={PATHS.OFFICER_COMPLAINTS}
            icon="bi-list-check"
          >
            Queue view
          </Button>
        }
      />

      <Card padding="lg">
        <div className="filters__grid filters__grid--officer">
          <SelectField
            label="Status"
            name="map-status"
            icon="bi-funnel"
            value={filters.status}
            onChange={set("status")}
            options={STATUS_OPTIONS}
          />
          <SelectField
            label="Priority"
            name="map-priority"
            icon="bi-speedometer2"
            value={filters.priority}
            onChange={set("priority")}
            options={PRIORITY_OPTIONS}
          />
          <SelectField
            label="Category"
            name="map-category"
            icon="bi-tags"
            value={filters.category}
            onChange={set("category")}
            options={CATEGORY_OPTIONS}
          />
          <SelectField
            label="Department"
            name="map-department"
            icon="bi-building"
            value={filters.department}
            onChange={set("department")}
            options={DEPARTMENT_OPTIONS}
          />
        </div>
      </Card>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <Card padding="lg">
            <CardHeader
              title={`${plotted} complaint${plotted === 1 ? "" : "s"} plotted`}
              subtitle="Select a marker to see the complaint"
            />

            <ComplaintMap
              complaints={visible}
              focusId={selected?.id}
              onSelect={setSelectedId}
            />

            <ul className="map-legend">
              {LEGEND.map((priority) => (
                <li key={priority}>
                  <span
                    className={`map-legend__dot map-legend__dot--${PRIORITY_META[priority].tone}`}
                    aria-hidden="true"
                  />
                  {PRIORITY_META[priority].label}
                  <span className="map-legend__count">{counts[priority]}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="col-12 col-xl-4">
          <Card padding="lg">
            <CardHeader title="Selected complaint" />

            {selected ? (
              <div className="stack-3">
                <p className="mono map-panel__id">{selected.id}</p>
                <h3 className="map-panel__title">{selected.title}</h3>

                <div className="cluster">
                  <StatusBadge status={selected.status} size="sm" />
                  <PriorityBadge priority={selected.priority} size="sm" />
                </div>

                <p className="map-panel__meta">
                  <i className="bi bi-geo-alt" aria-hidden="true" />
                  {selected.location}
                </p>
                <p className="map-panel__meta">
                  <i className="bi bi-building" aria-hidden="true" />
                  {selected.department}
                </p>

                <p className="map-panel__desc">{selected.description}</p>

                <Button
                  to={officerComplaintPath(selected.id)}
                  icon="bi-arrow-right"
                  block
                >
                  Open complaint
                </Button>
              </div>
            ) : (
              <p className="map-panel__hint">
                <i className="bi bi-cursor" aria-hidden="true" />
                Choose a marker on the map, or pick a complaint from the list
                below, to see its details here.
              </p>
            )}
          </Card>

          <Card padding="lg" className="mt-4">
            <CardHeader
              title="In view"
              subtitle={`${visible.length} matching the current filters`}
            />
            <ul className="map-list">
              {visible.slice(0, 8).map((complaint) => (
                <li key={complaint.id}>
                  <button
                    type="button"
                    className={`map-list__row${
                      complaint.id === selected?.id ? " map-list__row--active" : ""
                    }`}
                    onClick={() => setSelectedId(complaint.id)}
                  >
                    <span className="mono map-list__id">{complaint.id}</span>
                    <span className="map-list__title">{complaint.title}</span>
                    <PriorityBadge priority={complaint.priority} size="sm" />
                  </button>
                </li>
              ))}
            </ul>

            {visible.length > 8 && (
              <Link className="map-list__more" to={PATHS.OFFICER_COMPLAINTS}>
                {visible.length - 8} more in the queue
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
            )}

            {visible.length === 0 && (
              <p className="text-muted-soft mb-0">
                Nothing matches these filters.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
