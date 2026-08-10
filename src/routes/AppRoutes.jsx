import { Route, Routes } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

import Landing from "../pages/Landing";
import TrackComplaint from "../pages/TrackComplaint";
import NotFound from "../pages/NotFound";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import CitizenDashboard from "../pages/citizen/Dashboard";
import LodgeComplaint from "../pages/citizen/LodgeComplaint";
import ComplaintSubmitted from "../pages/citizen/ComplaintSubmitted";
import MyComplaints from "../pages/citizen/MyComplaints";
import ComplaintDetail from "../pages/citizen/ComplaintDetail";
import Notifications from "../pages/citizen/Notifications";
import Profile from "../pages/citizen/Profile";

import OfficerDashboard from "../pages/officer/Dashboard";
import OfficerComplaints from "../pages/officer/Complaints";
import OfficerComplaintDetail from "../pages/officer/ComplaintDetail";
import OfficerMap from "../pages/officer/Map";
import OfficerAnalytics from "../pages/officer/Analytics";
import OfficerDepartments from "../pages/officer/Departments";
import OfficerNotifications from "../pages/officer/Notifications";
import OfficerProfile from "../pages/officer/Profile";

import { PATHS, ROLES } from "../utils/constants";

/**
 * Central route table. Every path lives in `PATHS` so links and guards never
 * drift apart. New sections plug in as children of the matching layout.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing + lookup */}
      <Route element={<PublicLayout />}>
        <Route path={PATHS.HOME} element={<Landing />} />
        <Route path={PATHS.TRACK} element={<TrackComplaint />} />
      </Route>

      {/* Auth (UI only) */}
      <Route element={<AuthLayout />}>
        <Route path={PATHS.LOGIN} element={<Login />} />
        <Route path={PATHS.REGISTER} element={<Register />} />
      </Route>

      {/* Citizen area — one layout instance for the whole section, so moving
          between pages never remounts the sidebar. */}
      <Route element={<ProtectedRoute allow={[ROLES.CITIZEN]} />}>
        <Route element={<DashboardLayout title="Citizen" />}>
          <Route
            path={PATHS.CITIZEN_DASHBOARD}
            element={<CitizenDashboard />}
          />
          <Route path={PATHS.CITIZEN_COMPLAINTS} element={<MyComplaints />} />
          <Route
            path={`${PATHS.CITIZEN_COMPLAINTS}/:id`}
            element={<ComplaintDetail />}
          />
          <Route path={PATHS.CITIZEN_NEW} element={<LodgeComplaint />} />
          <Route
            path={PATHS.CITIZEN_SUCCESS}
            element={<ComplaintSubmitted />}
          />
          <Route
            path={PATHS.CITIZEN_NOTIFICATIONS}
            element={<Notifications />}
          />
          <Route path={PATHS.CITIZEN_PROFILE} element={<Profile />} />
        </Route>
      </Route>

      {/* Officer area — same guard/layout shape as the citizen branch. The
          detail route is nested under the queue path so the sidebar link for
          Complaints stays highlighted while a single complaint is open. */}
      <Route element={<ProtectedRoute allow={[ROLES.OFFICER, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout title="Officer" />}>
          <Route
            path={PATHS.OFFICER_DASHBOARD}
            element={<OfficerDashboard />}
          />
          <Route
            path={PATHS.OFFICER_COMPLAINTS}
            element={<OfficerComplaints />}
          />
          <Route
            path={`${PATHS.OFFICER_COMPLAINTS}/:id`}
            element={<OfficerComplaintDetail />}
          />
          <Route path={PATHS.OFFICER_MAP} element={<OfficerMap />} />
          <Route
            path={PATHS.OFFICER_ANALYTICS}
            element={<OfficerAnalytics />}
          />
          <Route
            path={PATHS.OFFICER_DEPARTMENTS}
            element={<OfficerDepartments />}
          />
          <Route
            path={PATHS.OFFICER_NOTIFICATIONS}
            element={<OfficerNotifications />}
          />
          <Route path={PATHS.OFFICER_PROFILE} element={<OfficerProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
