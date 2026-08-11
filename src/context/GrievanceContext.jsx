import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { GrievanceContext } from "./contexts";
import { ACTIONS, reducer } from "./grievanceReducer";
import {
  assignOfficerApi,
  buildComplaint,
  clearState,
  createComplaintApi,
  fetchComplaintsFromApi,
  loadState,
  persistState,
  updateStatusApi,
} from "../services/grievanceService";
import { COMPLAINT_STATUS } from "../utils/constants";

/**
 * The single source of truth for complaints and notifications.
 *
 * Every screen — citizen dashboard, my complaints, officer command centre,
 * analytics, map, departments — reads this one list. Nothing keeps a private
 * dataset, so a complaint filed on one screen is visible on all the others
 * immediately, and a status change on the officer side reaches the citizen's
 * tracker without a refetch.
 *
 * Persistence is a side effect of state changes, not something callers do:
 * every dispatch writes through to localStorage, so a reload restores exactly
 * what was on screen. Replacing that with FastAPI is a change inside
 * `grievanceService`, not here. The transitions themselves live in
 * `grievanceReducer` so they can be tested without mounting React.
 */

export function GrievanceProvider({ children }) {
  // Lazy init: storage is read once, synchronously, before first paint. No
  // loading flash, and no effect that could race a page's first render.
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // `createComplaint` needs the current list to continue the id sequence, but
  // must not be re-created on every state change or every consumer re-renders.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    persistState(state);
  }, [state]);

  // Sync live database complaints on mount
  useEffect(() => {
    async function syncBackendData() {
      const apiComplaints = await fetchComplaintsFromApi();
      if (apiComplaints && apiComplaints.length > 0) {
        dispatch({ type: ACTIONS.SET_COMPLAINTS, complaints: apiComplaints });
      }
    }
    syncBackendData();
  }, []);

  const createComplaint = useCallback(async (draft, citizen) => {
    // Attempt API creation on FastAPI & Supabase PostgreSQL first
    const apiRecord = await createComplaintApi(draft, citizen);
    const complaint = apiRecord || buildComplaint(draft, stateRef.current.complaints, citizen);

    dispatch({ type: ACTIONS.CREATE, complaint });
    return complaint;
  }, []);

  const updateStatus = useCallback((id, change) => {
    dispatch({ type: ACTIONS.STATUS, id, change });
    updateStatusApi(id, change);
  }, []);

  const assignOfficer = useCallback((id, officer, actor) => {
    dispatch({ type: ACTIONS.ASSIGN, id, officer, actor });
    assignOfficerApi(id, officer, actor);
  }, []);

  const markNotificationRead = useCallback((id) => {
    dispatch({ type: ACTIONS.READ_NOTIFICATION, id });
  }, []);

  const markAllRead = useCallback((audience) => {
    dispatch({ type: ACTIONS.READ_ALL, audience });
  }, []);

  const resetDemoData = useCallback(() => {
    clearState();
    dispatch({ type: ACTIONS.RESET });
  }, []);

  const clearDemoData = useCallback(() => {
    clearState();
    dispatch({ type: ACTIONS.CLEAR });
  }, []);

  const value = useMemo(
    () => ({
      complaints: state.complaints,
      notifications: state.notifications,
      createComplaint,
      updateStatus,
      assignOfficer,
      markNotificationRead,
      markAllRead,
      resetDemoData,
      clearDemoData,
      STATUSES: COMPLAINT_STATUS,
    }),
    [
      state.complaints,
      state.notifications,
      createComplaint,
      updateStatus,
      assignOfficer,
      markNotificationRead,
      markAllRead,
      resetDemoData,
      clearDemoData,
    ],
  );

  return (
    <GrievanceContext.Provider value={value}>{children}</GrievanceContext.Provider>
  );
}
