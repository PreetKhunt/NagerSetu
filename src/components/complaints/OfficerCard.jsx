import Avatar from "../common/Avatar";
import { formatNumber } from "../../utils/formatters";

/** Assigned officer panel on the complaint detail page. */
export default function OfficerCard({ officer, department }) {
  if (!officer) return null;

  return (
    <div className="officer">
      <div className="officer__top">
        <Avatar name={officer.name} size="lg" />
        <div className="min-w-0">
          <p className="officer__name">{officer.name}</p>
          <p className="officer__role">{officer.designation}</p>
          {department && (
            <span className="chip chip--soft mt-2">
              <i className="bi bi-building" aria-hidden="true" />
              {department}
            </span>
          )}
        </div>
      </div>

      <dl className="officer__contact">
        <div>
          <dt>
            <i className="bi bi-telephone" aria-hidden="true" />
            Phone
          </dt>
          <dd>
            <a href={`tel:${officer.phone.replace(/[^\d+]/g, "")}`}>
              {officer.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt>
            <i className="bi bi-envelope" aria-hidden="true" />
            Email
          </dt>
          <dd>
            <a href={`mailto:${officer.email}`}>{officer.email}</a>
          </dd>
        </div>
      </dl>

      {officer.resolvedCount > 0 && (
        <p className="officer__stat">
          <i className="bi bi-award" aria-hidden="true" />
          {formatNumber(officer.resolvedCount)} complaints resolved
        </p>
      )}
    </div>
  );
}
