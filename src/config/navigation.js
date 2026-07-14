import {
  LayoutDashboard,
  Users,
  Video,
  Stethoscope,
  CalendarDays,
  FileHeart,
  Pill,
  FlaskConical,
  Receipt,
  Sparkles,
  Building2,
  CreditCard,
  TrendingUp,
  Activity,
  ScrollText,
  Settings,
  UserCog,
  TestTube,
  Microscope,
  FileBarChart,
  MessageSquare,
  Pill as PillIcon,
  Banknote,
  Archive,
  Clock,
  Monitor,
  Calculator,
} from "lucide-react"
import { ROLE_KEYS } from "@/config/roles"
import {
  getPrefixFromPath,
  getRolePrefix,
  stripRolePrefix,
  withRolePath,
} from "@/config/roleRoutes"

const ALL = Object.values(ROLE_KEYS)

// Every navigation item declares which roles may see/access it.
// Sidebar groups render only when they contain at least one visible item.
export const navSections = [
  {
    group: "overview",
    items: [
      { key: "dashboard", path: "/", icon: LayoutDashboard, labelKey: "nav.dashboard", roles: ALL },
    ],
  },
  {
    group: "platform",
    items: [
      { key: "hospitals", path: "/hospitals", icon: Building2, labelKey: "nav.hospitals", roles: [ROLE_KEYS.SUPER_ADMIN] },
      { key: "subscriptions", path: "/subscriptions", icon: CreditCard, labelKey: "nav.subscriptions", roles: [ROLE_KEYS.SUPER_ADMIN] },
      { key: "revenue", path: "/revenue-analytics", icon: TrendingUp, labelKey: "nav.revenue", roles: [ROLE_KEYS.SUPER_ADMIN] },
      { key: "platformAi", path: "/ai-analytics", icon: Sparkles, labelKey: "nav.aiAnalytics", roles: [ROLE_KEYS.SUPER_ADMIN], badge: "AI" },
      { key: "monitoring", path: "/system-monitoring", icon: Activity, labelKey: "nav.monitoring", roles: [ROLE_KEYS.SUPER_ADMIN] },
      { key: "audit", path: "/audit-logs", icon: ScrollText, labelKey: "nav.audit", roles: [ROLE_KEYS.SUPER_ADMIN] },
      { key: "platformSettings", path: "/platform-settings", icon: Settings, labelKey: "nav.platformSettings", roles: [ROLE_KEYS.SUPER_ADMIN] },
    ],
  },
  {
    group: "clinical",
    items: [
      { key: "doctorWorkspace", path: "/doctor-workspace", icon: Stethoscope, labelKey: "nav.doctorWorkspace", roles: [ROLE_KEYS.DOCTOR] },
      { key: "waitingRoom", path: "/waiting-room", icon: Clock, labelKey: "nav.waitingRoom", roles: [ROLE_KEYS.DOCTOR] },
      { key: "waitingRoomDisplay", path: "/waiting-room-display", icon: Monitor, labelKey: "nav.waitingRoomDisplay", roles: [ROLE_KEYS.DOCTOR, ROLE_KEYS.RECEPTIONIST] },
      { key: "teleconsultation", path: "/teleconsultation", icon: Video, labelKey: "nav.teleconsultation", roles: [ROLE_KEYS.DOCTOR, ROLE_KEYS.PATIENT], badge: "Live", planFeature: "TELECONSULTATION" },
      { key: "appointments", path: "/appointments", icon: CalendarDays, labelKey: "nav.appointments", roles: [ROLE_KEYS.DOCTOR, ROLE_KEYS.PATIENT, ROLE_KEYS.RECEPTIONIST] },
      { key: "records", path: "/records", icon: FileHeart, labelKey: "nav.records", roles: [ROLE_KEYS.DOCTOR, ROLE_KEYS.PATIENT] },
    ],
  },
  {
    group: "laboratory",
    items: [
      { key: "testRequests", path: "/test-requests", icon: TestTube, labelKey: "nav.testRequests", roles: [ROLE_KEYS.LAB_TECH, ROLE_KEYS.DOCTOR], planFeature: "LAB" },
      { key: "sampleTracking", path: "/sample-tracking", icon: Microscope, labelKey: "nav.sampleTracking", roles: [ROLE_KEYS.LAB_TECH], planFeature: "LAB" },
      { key: "labResults", path: "/lab-results", icon: FlaskConical, labelKey: "nav.labResults", roles: [ROLE_KEYS.LAB_TECH], planFeature: "LAB" },
      { key: "laboratory", path: "/laboratory", icon: FlaskConical, labelKey: "nav.laboratory", roles: [ROLE_KEYS.HOSPITAL_ADMIN], planFeature: "LAB" },
      { key: "prescriptions", path: "/prescriptions", icon: Pill, labelKey: "nav.prescriptions", roles: [ROLE_KEYS.DOCTOR] },
    ],
  },
  {
    group: "cashier",
    items: [
      { key: "cashierDesk", path: "/cashier", icon: Banknote, labelKey: "nav.cashierDesk", roles: [ROLE_KEYS.CASHIER], planFeature: "BILLING" },
    ],
  },
  {
    group: "operations",
    items: [
      { key: "patients", path: "/patients", icon: Users, labelKey: "nav.patients", roles: [ROLE_KEYS.HOSPITAL_ADMIN, ROLE_KEYS.DOCTOR, ROLE_KEYS.RECEPTIONIST] },
      { key: "pharmacy", path: "/pharmacy", icon: Pill, labelKey: "nav.pharmacy", roles: [ROLE_KEYS.HOSPITAL_ADMIN], planFeature: "PHARMACY" },
      { key: "billing", path: "/billing", icon: Receipt, labelKey: "nav.billing", roles: [ROLE_KEYS.HOSPITAL_ADMIN], planFeature: "BILLING" },
      { key: "tariffs", path: "/tariffs", icon: Calculator, labelKey: "nav.tariffs", roles: [ROLE_KEYS.HOSPITAL_ADMIN], planFeature: "BILLING" },
      { key: "mySubscription", path: "/my-subscription", icon: CreditCard, labelKey: "nav.mySubscription", roles: [ROLE_KEYS.HOSPITAL_ADMIN] },
      { key: "messages", path: "/messages", icon: MessageSquare, labelKey: "nav.messages", roles: [ROLE_KEYS.PATIENT] },
    ],
  },
  {
    group: "management",
    items: [
      { key: "archives", path: "/archives", icon: Archive, labelKey: "nav.archives", roles: [ROLE_KEYS.ARCHIVIST, ROLE_KEYS.HOSPITAL_ADMIN, ROLE_KEYS.DOCTOR, ROLE_KEYS.RECEPTIONIST] },
      { key: "staff", path: "/staff", icon: UserCog, labelKey: "nav.staff", roles: [ROLE_KEYS.HOSPITAL_ADMIN] },
      { key: "users", path: "/users", icon: Users, labelKey: "nav.users", roles: [ROLE_KEYS.SUPER_ADMIN, ROLE_KEYS.HOSPITAL_ADMIN] },
      { key: "reports", path: "/reports", icon: FileBarChart, labelKey: "nav.reports", roles: [ROLE_KEYS.HOSPITAL_ADMIN, ROLE_KEYS.LAB_TECH], planFeature: "REPORTS" },
    ],
  },
  {
    group: "intelligence",
    items: [
      { key: "ai", path: "/ai-assistant", icon: Sparkles, labelKey: "nav.ai", roles: [ROLE_KEYS.SUPER_ADMIN, ROLE_KEYS.HOSPITAL_ADMIN, ROLE_KEYS.DOCTOR], badge: "AI", planFeature: "AI_ASSISTANT" },
    ],
  },
]

// Flattened lookup of MODULE path -> allowed roles for guard checks.
const accessMap = navSections.reduce((acc, section) => {
  section.items.forEach((item) => {
    acc[item.path] = item.roles
  })
  return acc
}, {})

/**
 * Vérifie l'accès RBAC.
 * Accepte /patients ou /admin/patients (préfixe rôle).
 */
export function canRoleAccess(roleKey, path) {
  const prefix = getPrefixFromPath(path)
  if (prefix && prefix !== getRolePrefix(roleKey)) {
    return false
  }

  const modulePath = stripRolePrefix(path)

  if (modulePath === "/waiting-room-display" || path === "/waiting-room-display") {
    return (accessMap["/waiting-room-display"] || []).includes(roleKey)
  }

  if (modulePath === "/") return true

  const matchPath = Object.keys(accessMap).find(
    (p) => p !== "/" && (modulePath === p || modulePath.startsWith(`${p}/`)),
  )
  if (!matchPath) return true
  return accessMap[matchPath].includes(roleKey)
}

/** Sections sidebar avec chemins déjà préfixés pour le rôle. */
export function getNavForRole(roleKey, enabledFeatures = null) {
  const featureSet = enabledFeatures ? new Set(enabledFeatures) : null
  return navSections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => {
          if (!item.roles.includes(roleKey)) return false
          if (featureSet && item.planFeature && !featureSet.has(item.planFeature)) return false
          return true
        })
        .map((item) => ({
          ...item,
          path:
            item.path === "/waiting-room-display"
              ? "/waiting-room-display"
              : withRolePath(roleKey, item.path),
          modulePath: item.path,
        })),
    }))
    .filter((section) => section.items.length > 0)
}

export { withRolePath, roleHomePath } from "@/config/roleRoutes"
