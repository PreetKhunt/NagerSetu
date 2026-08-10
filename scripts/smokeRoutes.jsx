/**
 * Route smoke test — server-renders every route so runtime errors (bad
 * imports, undefined components, prop crashes) surface as console output
 * rather than only appearing in a browser tab.
 *
 * Loaded by scripts/smoke.mjs through Vite's SSR pipeline so JSX works.
 */
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import App from "../src/App.jsx";
import { AuthProvider } from "../src/context/AuthContext.jsx";
import { GrievanceProvider } from "../src/context/GrievanceContext.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import CitizenDashboard from "../src/pages/citizen/Dashboard.jsx";
import LodgeComplaint from "../src/pages/citizen/LodgeComplaint.jsx";
import ComplaintSubmitted from "../src/pages/citizen/ComplaintSubmitted.jsx";
import MyComplaints from "../src/pages/citizen/MyComplaints.jsx";
import ComplaintDetail from "../src/pages/citizen/ComplaintDetail.jsx";
import Notifications from "../src/pages/citizen/Notifications.jsx";
import Profile from "../src/pages/citizen/Profile.jsx";
import OfficerDashboard from "../src/pages/officer/Dashboard.jsx";
import OfficerComplaints from "../src/pages/officer/Complaints.jsx";
import OfficerComplaintDetail from "../src/pages/officer/ComplaintDetail.jsx";
import OfficerMap from "../src/pages/officer/Map.jsx";
import OfficerAnalytics from "../src/pages/officer/Analytics.jsx";
import OfficerDepartments from "../src/pages/officer/Departments.jsx";
import OfficerNotifications from "../src/pages/officer/Notifications.jsx";
import OfficerProfile from "../src/pages/officer/Profile.jsx";
import DashboardLayout from "../src/layouts/DashboardLayout.jsx";
import Sidebar from "../src/components/layout/Sidebar.jsx";
import Topbar from "../src/components/layout/Topbar.jsx";
import ComplaintStatusTracker from "../src/components/complaints/ComplaintStatusTracker.jsx";
import ActivityTimeline from "../src/components/complaints/ActivityTimeline.jsx";
import OfficerCard from "../src/components/complaints/OfficerCard.jsx";
import RelatedComplaints from "../src/components/complaints/RelatedComplaints.jsx";
import ComplaintTable from "../src/components/complaints/ComplaintTable.jsx";
import OfficerComplaintTable from "../src/components/officer/OfficerComplaintTable.jsx";
import ComplaintMap from "../src/components/officer/ComplaintMap.jsx";
import TrendChart from "../src/components/officer/TrendChart.jsx";
import SlaPanel from "../src/components/officer/SlaPanel.jsx";
import BarList from "../src/components/officer/BarList.jsx";
import { seedState } from "../src/services/grievanceService.js";
import { OFFICERS } from "../src/utils/mockData.js";
import {
  categoryBreakdown,
  complaintTrend,
  priorityBreakdown,
} from "../src/utils/grievanceUtils.js";
import { findRelated } from "../src/services/aiService.js";
import {
  COMPLAINT_STATUS,
  PATHS,
  complaintPath,
  officerComplaintPath,
} from "../src/utils/constants.js";

// The seed is what a first-run visitor gets, so rendering against it exercises
// exactly the records the demo opens with.
const COMPLAINTS = seedState().complaints;

// Built from PATHS so a renamed route fails here instead of silently
// falling through to the `*` catch-all and still reporting "ok".
const ROUTES = [
  PATHS.HOME,
  PATHS.LOGIN,
  PATHS.REGISTER,
  PATHS.TRACK,
  PATHS.CITIZEN_DASHBOARD,
  PATHS.CITIZEN_COMPLAINTS,
  PATHS.CITIZEN_NEW,
  PATHS.CITIZEN_SUCCESS,
  complaintPath(COMPLAINTS[0].id),
  PATHS.CITIZEN_NOTIFICATIONS,
  PATHS.CITIZEN_PROFILE,
  PATHS.OFFICER_DASHBOARD,
  PATHS.OFFICER_COMPLAINTS,
  officerComplaintPath(COMPLAINTS[0].id),
  PATHS.OFFICER_MAP,
  PATHS.OFFICER_ANALYTICS,
  PATHS.OFFICER_DEPARTMENTS,
  PATHS.OFFICER_NOTIFICATIONS,
  PATHS.OFFICER_PROFILE,
  "/this-route-does-not-exist",
];

/** Renders each route once. Returns the number of failures. */
export async function run() {
  let failed = 0;
  let attempts = 0;

  const attempt = (name, element) => {
    attempts += 1;
    try {
      const html = renderToString(element);
      console.log(`  ok    ${name.padEnd(34)} ${html.length} chars rendered`);
    } catch (error) {
      failed += 1;
      console.log(`  FAIL  ${name.padEnd(34)} ${error.message}`);
      console.log(error.stack);
    }
  };

  for (const path of ROUTES) {
    attempt(
      path,
      <StrictMode>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </StrictMode>,
    );
  }

  // A guarded route renders the session spinner; an unmatched one renders
  // NotFound. Without this the two are both "ok" and a typo'd PATHS value
  // would sail through as a passing test.
  console.log("\n  Route resolution (guarded vs unmatched):");

  const render = (path) =>
    renderToString(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );

  const notFoundLength = render("/definitely-not-a-route").length;
  const guarded = [
    PATHS.CITIZEN_DASHBOARD,
    PATHS.CITIZEN_COMPLAINTS,
    PATHS.CITIZEN_NEW,
    PATHS.CITIZEN_SUCCESS,
    complaintPath(COMPLAINTS[0].id),
    PATHS.CITIZEN_NOTIFICATIONS,
    PATHS.CITIZEN_PROFILE,
    PATHS.OFFICER_DASHBOARD,
    PATHS.OFFICER_COMPLAINTS,
    officerComplaintPath(COMPLAINTS[0].id),
    PATHS.OFFICER_MAP,
    PATHS.OFFICER_ANALYTICS,
    PATHS.OFFICER_DEPARTMENTS,
    PATHS.OFFICER_NOTIFICATIONS,
    PATHS.OFFICER_PROFILE,
  ];

  for (const path of guarded) {
    attempts += 1;
    const length = render(path).length;
    if (length !== notFoundLength) {
      console.log(`  ok    ${path.padEnd(34)} matched a guarded route`);
    } else {
      failed += 1;
      console.log(`  FAIL  ${path.padEnd(34)} fell through to NotFound`);
    }
  }

  // Guarded pages server-render as the session spinner (ProtectedRoute's
  // `initialising` effect never runs under SSR), so every page below is
  // rendered directly inside its providers — otherwise the shells above are
  // the only thing this test proves.
  const shell = (path, element, entry = path, state) => (
    <MemoryRouter initialEntries={[state ? { pathname: entry, state } : entry]}>
      <AuthProvider>
        <GrievanceProvider>
          <ToastProvider>
            <Routes>
              <Route path={path} element={element} />
            </Routes>
          </ToastProvider>
        </GrievanceProvider>
      </AuthProvider>
    </MemoryRouter>
  );

  const bare = (element) => (
    <MemoryRouter>
      <AuthProvider>
        <GrievanceProvider>
          <ToastProvider>{element}</ToastProvider>
        </GrievanceProvider>
      </AuthProvider>
    </MemoryRouter>
  );

  console.log("\n  Authenticated shell (rendered directly):");

  attempt("dashboard sidebar", bare(<Sidebar open onClose={() => {}} />));
  attempt("dashboard topbar", bare(<Topbar title="Dashboard" onMenuClick={() => {}} />));
  attempt("dashboard layout", bare(<DashboardLayout title="Dashboard" />));

  console.log("\n  Citizen pages:");

  const demo = COMPLAINTS[0];
  const closed = COMPLAINTS.find((c) => c.status === COMPLAINT_STATUS.RESOLVED);

  attempt("citizen dashboard", shell(PATHS.CITIZEN_DASHBOARD, <CitizenDashboard />));
  attempt("lodge complaint (text)", shell(PATHS.CITIZEN_NEW, <LodgeComplaint />));
  attempt(
    "lodge complaint (voice)",
    shell(PATHS.CITIZEN_NEW, <LodgeComplaint />, `${PATHS.CITIZEN_NEW}?mode=voice`),
  );
  attempt(
    "lodge complaint (image)",
    shell(PATHS.CITIZEN_NEW, <LodgeComplaint />, `${PATHS.CITIZEN_NEW}?mode=image`),
  );
  attempt(
    "complaint submitted",
    shell(PATHS.CITIZEN_SUCCESS, <ComplaintSubmitted />, PATHS.CITIZEN_SUCCESS, {
      complaintId: demo.id,
    }),
  );
  attempt(
    "complaint submitted (direct visit)",
    shell(PATHS.CITIZEN_SUCCESS, <ComplaintSubmitted />),
  );
  attempt("my complaints", shell(PATHS.CITIZEN_COMPLAINTS, <MyComplaints />));
  attempt(
    "my complaints (filtered)",
    shell(
      PATHS.CITIZEN_COMPLAINTS,
      <MyComplaints />,
      `${PATHS.CITIZEN_COMPLAINTS}?q=pothole&status=in_progress`,
    ),
  );
  attempt(
    "complaint detail",
    shell(`${PATHS.CITIZEN_COMPLAINTS}/:id`, <ComplaintDetail />, complaintPath(demo.id)),
  );
  if (closed) {
    attempt(
      "complaint detail (resolved)",
      shell(
        `${PATHS.CITIZEN_COMPLAINTS}/:id`,
        <ComplaintDetail />,
        complaintPath(closed.id),
      ),
    );
  }
  attempt(
    "complaint detail (unknown id)",
    shell(
      `${PATHS.CITIZEN_COMPLAINTS}/:id`,
      <ComplaintDetail />,
      complaintPath("GRV-0000-00000"),
    ),
  );
  attempt("citizen notifications", shell(PATHS.CITIZEN_NOTIFICATIONS, <Notifications />));
  attempt("citizen profile", shell(PATHS.CITIZEN_PROFILE, <Profile />));

  console.log("\n  Officer pages:");

  attempt("officer dashboard", shell(PATHS.OFFICER_DASHBOARD, <OfficerDashboard />));
  attempt("officer complaints", shell(PATHS.OFFICER_COMPLAINTS, <OfficerComplaints />));
  attempt(
    "officer complaints (filtered)",
    shell(
      PATHS.OFFICER_COMPLAINTS,
      <OfficerComplaints />,
      `${PATHS.OFFICER_COMPLAINTS}?q=pothole`,
    ),
  );
  attempt(
    "officer complaint detail",
    shell(
      `${PATHS.OFFICER_COMPLAINTS}/:id`,
      <OfficerComplaintDetail />,
      officerComplaintPath(demo.id),
    ),
  );
  if (closed) {
    attempt(
      "officer complaint detail (resolved)",
      shell(
        `${PATHS.OFFICER_COMPLAINTS}/:id`,
        <OfficerComplaintDetail />,
        officerComplaintPath(closed.id),
      ),
    );
  }
  attempt(
    "officer complaint detail (unknown id)",
    shell(
      `${PATHS.OFFICER_COMPLAINTS}/:id`,
      <OfficerComplaintDetail />,
      officerComplaintPath("GRV-0000-00000"),
    ),
  );
  attempt("officer map", shell(PATHS.OFFICER_MAP, <OfficerMap />));
  attempt("officer analytics", shell(PATHS.OFFICER_ANALYTICS, <OfficerAnalytics />));
  attempt("officer departments", shell(PATHS.OFFICER_DEPARTMENTS, <OfficerDepartments />));
  attempt(
    "officer notifications",
    shell(PATHS.OFFICER_NOTIFICATIONS, <OfficerNotifications />),
  );
  attempt("officer profile", shell(PATHS.OFFICER_PROFILE, <OfficerProfile />));

  console.log("\n  Data-driven components (real store records):");

  const detail = COMPLAINTS[0];

  attempt(
    "status tracker",
    <ComplaintStatusTracker status={detail.status} timeline={detail.timeline} />,
  );
  attempt("activity timeline", <ActivityTimeline entries={detail.timeline} />);
  if (closed) {
    attempt(
      "status tracker (resolved)",
      <ComplaintStatusTracker status={closed.status} timeline={closed.timeline} />,
    );
    attempt("activity timeline (resolved)", <ActivityTimeline entries={closed.timeline} />);
  }
  // Seed complaints are unassigned, and the card renders nothing without an
  // officer. `useComplaint` resolves the department's standing officer for the
  // detail page, so the same lookup is used here rather than a fabricated one.
  attempt(
    "officer card",
    <OfficerCard
      officer={detail.assignedOfficer ?? OFFICERS[detail.department]}
      department={detail.department}
    />,
  );
  attempt("officer card (unassigned)", <OfficerCard officer={null} />);
  attempt(
    "related complaints",
    <MemoryRouter>
      <RelatedComplaints items={findRelated(detail, COMPLAINTS)} />
    </MemoryRouter>,
  );
  attempt(
    "citizen complaints table",
    <MemoryRouter>
      <ComplaintTable complaints={COMPLAINTS} />
    </MemoryRouter>,
  );
  attempt(
    "officer complaints table",
    <MemoryRouter>
      <OfficerComplaintTable complaints={COMPLAINTS} />
    </MemoryRouter>,
  );
  attempt(
    "officer table (empty)",
    <MemoryRouter>
      <OfficerComplaintTable complaints={[]} />
    </MemoryRouter>,
  );
  attempt(
    "complaint map",
    <MemoryRouter>
      <ComplaintMap complaints={COMPLAINTS} />
    </MemoryRouter>,
  );
  attempt(
    "complaint map (empty)",
    <MemoryRouter>
      <ComplaintMap complaints={[]} />
    </MemoryRouter>,
  );
  attempt("trend chart", <TrendChart series={complaintTrend(COMPLAINTS)} />);
  // Fewer than two points is the "not enough history" branch, which is what a
  // freshly cleared demo shows.
  attempt("trend chart (no history)", <TrendChart series={[]} />);
  // SlaPanel derives every bucket itself from the records it is handed, so it
  // is passed the raw list — no precomputed sla field to disagree with.
  // Each urgent row links to the officer detail page, so this one needs a
  // router even though the empty variant does not.
  attempt(
    "sla panel",
    <MemoryRouter>
      <SlaPanel complaints={COMPLAINTS} />
    </MemoryRouter>,
  );
  attempt(
    "sla panel (empty)",
    <MemoryRouter>
      <SlaPanel complaints={[]} />
    </MemoryRouter>,
  );
  attempt(
    "bar list (categories)",
    <BarList
      items={categoryBreakdown(COMPLAINTS).map((c) => ({
        key: c.id,
        label: c.label,
        icon: c.icon,
        value: c.count,
      }))}
    />,
  );
  attempt(
    "bar list (priorities)",
    <BarList
      items={priorityBreakdown(COMPLAINTS).map((p) => ({
        key: p.priority,
        label: p.priority,
        value: p.count,
      }))}
    />,
  );
  attempt("bar list (empty)", <BarList items={[]} />);

  console.log(
    failed
      ? `\n${failed} of ${attempts} renders failed.`
      : `\nAll ${attempts} renders completed without errors.`,
  );
  return failed;
}
