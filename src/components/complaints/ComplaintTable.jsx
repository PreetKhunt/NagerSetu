import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import PriorityBadge from "../common/PriorityBadge";
import { formatDate } from "../../utils/formatters";
import { complaintPath } from "../../utils/constants";

/**
 * Desktop table view of the complaints list.
 *
 * Hidden below 992px by CSS — the card view is the mobile presentation, so
 * the table never has to scroll sideways.
 */
export default function ComplaintTable({ complaints }) {
  return (
    <div className="table-ds__wrap">
      <table className="table-ds">
        <caption className="sr-only">
          Your complaints, with status and priority
        </caption>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Issue</th>
            <th scope="col">Category</th>
            <th scope="col">Location</th>
            <th scope="col">Priority</th>
            <th scope="col">Status</th>
            <th scope="col">Date</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((complaint) => (
            <tr key={complaint.id}>
              <td>
                <Link className="table-ds__id" to={complaintPath(complaint.id)}>
                  {complaint.id}
                </Link>
              </td>
              <td>
                <span className="table-ds__title">{complaint.title}</span>
              </td>
              <td>{complaint.categoryLabel}</td>
              <td>
                <span className="table-ds__muted">{complaint.location}</span>
              </td>
              <td>
                <PriorityBadge priority={complaint.priority} size="sm" />
              </td>
              <td>
                <StatusBadge status={complaint.status} size="sm" />
              </td>
              <td>
                <span className="table-ds__muted">
                  {formatDate(complaint.createdAt)}
                </span>
              </td>
              <td className="text-end">
                <Link
                  className="table-ds__action"
                  to={complaintPath(complaint.id)}
                  aria-label={`View ${complaint.id}`}
                >
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
