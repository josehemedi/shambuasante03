import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { RequireAccess } from "@/auth/RequireAccess"
import { RequireAuth } from "@/auth/RequireAuth"
import { RequireRoleSpace } from "@/auth/RoleSpace"
import { SubscriptionProvider } from "@/auth/SubscriptionProvider"
import { useAuth } from "@/auth/AuthProvider"
import { ALL_ROLE_PREFIXES, withRolePath, stripRolePrefix } from "@/config/roleRoutes"
import Appointments from "@/pages/Appointments"
import Dashboard from "@/pages/Dashboard"
import Patients from "@/pages/Patients"
import PatientDetail from "@/pages/PatientDetail"
import Teleconsultation from "@/pages/Teleconsultation"
import AiAssistant from "@/pages/AiAssistant"
import RagAdmin from "@/pages/RagAdmin"
import UserManagement from "@/pages/UserManagement"
import SystemMonitoring from "@/pages/SystemMonitoring"
import AiAnalytics from "@/pages/AiAnalytics"
import AuditLogs from "@/pages/AuditLogs"
import PlatformSettings from "@/pages/PlatformSettings"
import RevenueAnalytics from "@/pages/RevenueAnalytics"
import Hospitals from "@/pages/Hospitals"
import Subscriptions from "@/pages/Subscriptions"
import MySubscription from "@/pages/MySubscription"
import Login from "@/pages/auth/Login"
import ForgotPassword from "@/pages/auth/ForgotPassword"
import ResetPassword from "@/pages/auth/ResetPassword"
import Prescriptions from "@/pages/Prescriptions"
import DoctorWorkspace from "@/pages/DoctorWorkspace"
import TestRequests from "@/pages/TestRequests"
import Records from "@/pages/Records"
import PatientDossierCloture from "@/pages/PatientDossierCloture"
import ArchivesDashboard from "@/pages/ArchivesDashboard"
import ArchiveDetail from "@/pages/ArchiveDetail"
import Laboratory from "@/pages/Laboratory"
import Staff from "@/pages/Staff"
import Reports from "@/pages/Reports"
import Pharmacy from "@/pages/Pharmacy"
import LabResults from "@/pages/LabResults"
import SampleTracking from "@/pages/SampleTracking"
import Billing from "@/pages/Billing"
import HospitalTariffs from "@/pages/HospitalTariffs"
import CashierDesk from "@/pages/CashierDesk"
import WaitingRoom from "@/pages/WaitingRoom"
import WaitingRoomDisplay from "@/pages/WaitingRoomDisplay"

function LegacyToRoleSpace() {
  const { roleKey } = useAuth()
  const location = useLocation()
  const modulePath = stripRolePrefix(location.pathname)
  const target =
    withRolePath(roleKey, modulePath === "/" ? "/" : modulePath) +
    (location.search || "") +
    (location.hash || "")
  return <Navigate to={target} replace state={location.state} />
}

function Guard({ children }) {
  return <RequireAccess>{children}</RequireAccess>
}

const ROLE_CHILD_ROUTES = [
  { index: true, element: <Dashboard /> },
  { path: "doctor-workspace", element: <Guard><DoctorWorkspace /></Guard> },
  { path: "waiting-room", element: <Guard><WaitingRoom /></Guard> },
  { path: "patients", element: <Guard><Patients /></Guard> },
  { path: "patients/:id", element: <Guard><PatientDetail /></Guard> },
  { path: "teleconsultation", element: <Guard><Teleconsultation /></Guard> },
  { path: "ai-assistant", element: <Guard><AiAssistant /></Guard> },
  { path: "rag-admin", element: <Guard><RagAdmin /></Guard> },
  { path: "users", element: <Guard><UserManagement /></Guard> },
  { path: "system-monitoring", element: <Guard><SystemMonitoring /></Guard> },
  { path: "laboratory", element: <Guard><Laboratory /></Guard> },
  { path: "staff", element: <Guard><Staff /></Guard> },
  { path: "reports", element: <Guard><Reports /></Guard> },
  { path: "pharmacy", element: <Guard><Pharmacy /></Guard> },
  { path: "billing", element: <Guard><Billing /></Guard> },
  { path: "tariffs", element: <Guard><HospitalTariffs /></Guard> },
  { path: "cashier", element: <Guard><CashierDesk /></Guard> },
  { path: "my-subscription", element: <Guard><MySubscription /></Guard> },
  { path: "test-requests", element: <Guard><TestRequests /></Guard> },
  { path: "sample-tracking", element: <Guard><SampleTracking /></Guard> },
  { path: "lab-results", element: <Guard><LabResults /></Guard> },
  { path: "appointments", element: <Guard><Appointments /></Guard> },
  { path: "records", element: <Guard><Records /></Guard> },
  { path: "records/:patientId/cloture", element: <Guard><PatientDossierCloture /></Guard> },
  { path: "archives", element: <Guard><ArchivesDashboard /></Guard> },
  { path: "archives/:id", element: <Guard><ArchiveDetail /></Guard> },
  { path: "prescriptions", element: <Guard><Prescriptions /></Guard> },
  { path: "hospitals", element: <Guard><Hospitals /></Guard> },
  { path: "subscriptions", element: <Guard><Subscriptions /></Guard> },
  { path: "revenue-analytics", element: <Guard><RevenueAnalytics /></Guard> },
  { path: "ai-analytics", element: <Guard><AiAnalytics /></Guard> },
  { path: "audit-logs", element: <Guard><AuditLogs /></Guard> },
  { path: "platform-settings", element: <Guard><PlatformSettings /></Guard> },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/waiting-room-display"
        element={
          <RequireAuth>
            <SubscriptionProvider>
              <RequireAccess>
                <WaitingRoomDisplay />
              </RequireAccess>
            </SubscriptionProvider>
          </RequireAuth>
        }
      />

      {ALL_ROLE_PREFIXES.map((prefix) => (
        <Route
          key={prefix}
          path={`/${prefix}`}
          element={
            <RequireAuth>
              <RequireRoleSpace>
                <AppLayout />
              </RequireRoleSpace>
            </RequireAuth>
          }
        >
          {ROLE_CHILD_ROUTES.map((route) =>
            route.index ? (
              <Route key={`${prefix}-index`} index element={route.element} />
            ) : (
              <Route key={`${prefix}-${route.path}`} path={route.path} element={route.element} />
            ),
          )}
          <Route key={`${prefix}-unknown`} path="*" element={<Navigate to={`/${prefix}`} replace />} />
        </Route>
      ))}

      <Route
        path="/"
        element={
          <RequireAuth>
            <LegacyToRoleSpace />
          </RequireAuth>
        }
      />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <LegacyToRoleSpace />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
