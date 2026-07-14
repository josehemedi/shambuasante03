import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS } from "@/config/roles"
import HospitalAdminDashboard from "@/pages/dashboards/HospitalAdminDashboard"
import SuperAdminDashboard from "@/pages/dashboards/SuperAdminDashboard"
import DoctorDashboard from "@/pages/dashboards/DoctorDashboard"
import PatientDashboard from "@/pages/dashboards/PatientDashboard"
import LabDashboard from "@/pages/dashboards/LabDashboard"
import ReceptionistDashboard from "@/pages/dashboards/ReceptionistDashboard"
import CashierDashboard from "@/pages/dashboards/CashierDashboard"
import ArchivesDashboard from "@/pages/ArchivesDashboard"

// Renders the dashboard dedicated to the authenticated user's role.
const dashboards = {
  [ROLE_KEYS.SUPER_ADMIN]: SuperAdminDashboard,
  [ROLE_KEYS.HOSPITAL_ADMIN]: HospitalAdminDashboard,
  [ROLE_KEYS.DOCTOR]: DoctorDashboard,
  [ROLE_KEYS.PATIENT]: PatientDashboard,
  [ROLE_KEYS.LAB_TECH]: LabDashboard,
  [ROLE_KEYS.RECEPTIONIST]: ReceptionistDashboard,
  [ROLE_KEYS.CASHIER]: CashierDashboard,
  [ROLE_KEYS.ARCHIVIST]: ArchivesDashboard,
}

export default function Dashboard() {
  const { roleKey } = useAuth()
  const RoleDashboard = dashboards[roleKey] || HospitalAdminDashboard
  return <RoleDashboard />
}
