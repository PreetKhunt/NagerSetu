import Button from "../common/Button";
import FormField from "../common/FormField";
import SelectField from "../common/SelectField";
import {
  CATEGORIES,
  COMPLAINT_STATUS,
  DEPARTMENTS,
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

const DEPARTMENT_OPTIONS = [
  ANY,
  ...DEPARTMENTS.map((name) => ({ value: name, label: name })),
];

const SORT_SELECT = SORT_OPTIONS.map((o) => ({ value: o.id, label: o.label }));

/**
 * Officer queue controls: search, five filters, sort.
 *
 * Fully controlled — the page owns the filter object and hands it to
 * `filterComplaints`, the same helper the citizen list uses. When these become
 * query-string parameters on `GET /api/complaints` nothing here changes shape.
 */
export default function OfficerFilters({
  filters,
  onChange,
  onReset,
  resultCount,
  total,
}) {
  const set = (key) => (event) => onChange(key, event.target.value);

  const activeCount = [
    filters.status !== "all",
    filters.category !== "all",
    filters.priority !== "all",
    filters.department !== "all",
    Boolean(filters.from),
    Boolean(filters.to),
    Boolean(filters.search.trim()),
  ].filter(Boolean).length;

  // A reversed range would silently return nothing, which reads as "no
  // complaints" rather than "your dates are the wrong way round".
  const rangeInvalid =
    filters.from && filters.to && filters.from > filters.to;

  return (
    <div className="filters">
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
            placeholder="Search by ID, issue, citizen, area, department…"
            aria-label="Search complaints"
            value={filters.search}
            onChange={set("search")}
          />
        </div>
      </form>

      <div className="filters__grid filters__grid--officer">
        <SelectField
          label="Status"
          name="of-status"
          icon="bi-funnel"
          value={filters.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
        />
        <SelectField
          label="Priority"
          name="of-priority"
          icon="bi-speedometer2"
          value={filters.priority}
          onChange={set("priority")}
          options={PRIORITY_OPTIONS}
        />
        <SelectField
          label="Category"
          name="of-category"
          icon="bi-tags"
          value={filters.category}
          onChange={set("category")}
          options={CATEGORY_OPTIONS}
        />
        <SelectField
          label="Department"
          name="of-department"
          icon="bi-building"
          value={filters.department}
          onChange={set("department")}
          options={DEPARTMENT_OPTIONS}
        />
        <FormField
          label="From"
          name="of-from"
          type="date"
          icon="bi-calendar-event"
          value={filters.from}
          onChange={set("from")}
          max={filters.to || undefined}
        />
        <FormField
          label="To"
          name="of-to"
          type="date"
          icon="bi-calendar-check"
          value={filters.to}
          onChange={set("to")}
          min={filters.from || undefined}
          error={rangeInvalid ? "End date is before the start date." : undefined}
        />
        <SelectField
          label="Sort by"
          name="of-sort"
          icon="bi-sort-down"
          value={filters.sort}
          onChange={set("sort")}
          options={SORT_SELECT}
        />
      </div>

      <div className="filters__foot">
        <p className="filters__count" aria-live="polite">
          Showing <strong>{resultCount}</strong> of {total}
          {total === 1 ? " complaint" : " complaints"}
          {activeCount > 0 &&
            ` · ${activeCount} filter${activeCount === 1 ? "" : "s"} active`}
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
