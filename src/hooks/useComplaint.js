import { useMemo } from "react";

import useGrievances from "./useGrievances";
import { findRelated } from "../services/aiService";
import { slaFor } from "../utils/grievanceUtils";
import { DEFAULT_OFFICER, OFFICERS } from "../utils/mockData";

/**
 * One complaint from the shared store, with the extras the detail screens
 * render layered on top.
 *
 * The extras are derived, not stored: the assigned officer falls back to the
 * department desk, duplicates are scored against the live list, and the target
 * date comes from the same SLA function the officer dashboard counts breaches
 * with. Deriving here means a status change made on the officer side is
 * reflected on the citizen's page without either screen refetching anything.
 *
 * `null` when nothing matches — callers render their own not-found state,
 * because "still loading" and "does not exist" want different copy.
 */
export default function useComplaint(id) {
  const { complaints } = useGrievances();

  return useMemo(() => {
    if (!id) return null;

    const key = String(id).trim().toLowerCase();
    const complaint = complaints.find((c) => c.id.toLowerCase() === key);
    if (!complaint) return null;

    const sla = slaFor(complaint);

    return {
      ...complaint,
      officer:
        complaint.assignedOfficer ??
        OFFICERS[complaint.department] ??
        DEFAULT_OFFICER,
      related: findRelated(complaint, complaints),
      sla,
      // Closed complaints have no target left to meet; the detail page shows
      // the closing date instead of a countdown.
      eta: sla.closed ? null : sla.dueAt,
      slaDays: Math.round(sla.windowHours / 24),
    };
  }, [complaints, id]);
}
