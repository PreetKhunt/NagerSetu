import Button from "../common/Button";
import SelectField from "../common/SelectField";
import {
  CATEGORIES,
  COMPLAINT_STATUS,
  PRIORITY_META,
  SORT_OPTIONS,
  STATUS_META,
} from "../../utils/constants";

const ANY = { value: "all", label: "All" };

const STATUS_OPTIONS = [
  ANY,
  ...Object.values(COMPLAINT_STATUS).map((value) => ({
    value,
    label: STATUS_META[value].label,
  })),
];

const CATEGORY_OPTIONS = [
  ANY,
  ...CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
];

const PRIORITY_OPTIONS = [
  ANY,
  ...Object.entries(PRIORITY_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

/**
 * Search + filter + sort bar for the complaints list.
 *
 * Fully controlled: the page owns `filters` and this only reports changes,
 * so the same state can later drive a server-side query.
 */
export default function ComplaintFilters({
  filters,
  onChange,
  onReset,
  resultCount,
  view,
  onViewChange,
}) {
  const set = (key) => (event) => onChange(key, event.target.value);

  const activeCount = [
    filters.status !== "all",
    filters.category !== "all",
    filters.priority !== "all",
    Boolean(filters.search.trim()),
  ].filter(Boolean).length;

  return (
    <div className="filters">
      <div className="filters__top">
        <form
          className="filters__search"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="input-group-ds input-group-ds--icon">
            <i className="input-group-ds__icon bi bi-search" aria-hidden="true" />
            <input
              type="search"
              className="input-ds"
              placeholder="Search by ID, issue, area or department…"
              aria-label="Search complaints"
              value={filters.search}
              onChange={set("search")}
            />
          </div>
        </form>

        <div className="filters__view" role="group" aria-label="Layout">
          <button
            type="button"
            className={`icon-btn${view === "cards" ? " icon-btn--active" : ""}`}
            onClick={() => onViewChange("cards")}
            aria-pressed={view === "cards"}
            aria-label="Card view"
          >
            <i className="bi bi-grid-1x2" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`icon-btn${view === "table" ? " icon-btn--active" : ""}`}
            onClick={() => onViewChange("table")}
            aria-pressed={view === "table"}
            aria-label="Table view"
          >
            <i className="bi bi-table" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="filters__grid">
        <SelectField
          label="Status"
          name="filter-status"
          icon="bi-funnel"
          value={filters.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
        />
        <SelectField
          label="Category"
          name="filter-category"
          icon="bi-tags"
          value={filters.category}
          onChange={set("category")}
          options={CATEGORY_OPTIONS}
        />
        <SelectField
          label="Priority"
          name="filter-priority"
          icon="bi-speedometer2"
          value={filters.priority}
          onChange={set("priority")}
          options={PRIORITY_OPTIONS}
        />
        <SelectField
          label="Sort by"
          name="filter-sort"
          icon="bi-sort-down"
          value={filters.sort}
          onChange={set("sort")}
          options={SORT_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
        />
      </div>

      <div className="filters__foot">
        <p className="filters__count" aria-live="polite">
          <strong>{resultCount}</strong>
          {resultCount === 1 ? " complaint" : " complaints"}
          {activeCount > 0 && ` · ${activeCount} filter${activeCount === 1 ? "" : "s"} active`}
        </p>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" icon="bi-x-circle" onClick={onReset}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
