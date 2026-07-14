import { stripRolePrefix } from "@/config/roleRoutes"

export const PLAN_NAMES = {
  BASIC: "Basic",
  PRO: "Professionnel",
  ENTERPRISE: "Entreprise",
}

export const PLAN_FEATURE = {
  PATIENTS: "PATIENTS",
  APPOINTMENTS: "APPOINTMENTS",
  CONSULTATIONS: "CONSULTATIONS",
  STAFF_MANAGEMENT: "STAFF_MANAGEMENT",
  LAB: "LAB",
  PHARMACY: "PHARMACY",
  BILLING: "BILLING",
  TELECONSULTATION: "TELECONSULTATION",
  REPORTS: "REPORTS",
  AI_ASSISTANT: "AI_ASSISTANT",
  PRIORITY_SUPPORT: "PRIORITY_SUPPORT",
  CUSTOMIZATION: "CUSTOMIZATION",
  ENHANCED_BACKUPS: "ENHANCED_BACKUPS",
  INTEGRATIONS: "INTEGRATIONS",
}

export const PATH_PLAN_FEATURE = {
  "/laboratory": PLAN_FEATURE.LAB,
  "/test-requests": PLAN_FEATURE.LAB,
  "/sample-tracking": PLAN_FEATURE.LAB,
  "/lab-results": PLAN_FEATURE.LAB,
  "/pharmacy": PLAN_FEATURE.PHARMACY,
  "/billing": PLAN_FEATURE.BILLING,
  "/tariffs": PLAN_FEATURE.BILLING,
  "/cashier": PLAN_FEATURE.BILLING,
  "/reports": PLAN_FEATURE.REPORTS,
  "/teleconsultation": PLAN_FEATURE.TELECONSULTATION,
  "/ai-assistant": PLAN_FEATURE.AI_ASSISTANT,
}

export const PLAN_BADGE = {
  Basic: "default",
  Professionnel: "secondary",
  Entreprise: "primary",
}

export const PLAN_ORDER = {
  Basic: 1,
  Professionnel: 2,
  Entreprise: 3,
  Starter: 1,
  Growth: 2,
  Enterprise: 3,
}

export const LEGACY_PLAN_MAP = {
  Starter: PLAN_NAMES.BASIC,
  Growth: PLAN_NAMES.PRO,
  Enterprise: PLAN_NAMES.ENTERPRISE,
}

export function normalizePlanName(name) {
  if (!name) return PLAN_NAMES.BASIC
  return LEGACY_PLAN_MAP[name] || name
}

export function hasPlanFeature(subscription, feature) {
  if (!subscription?.features?.length) return true
  return subscription.features.includes(feature)
}

export function canAccessPath(subscription, path) {
  const modulePath = stripRolePrefix(path)
  const matchPath = Object.keys(PATH_PLAN_FEATURE).find(
    (p) => modulePath === p || modulePath.startsWith(`${p}/`),
  )
  if (!matchPath) return true
  return hasPlanFeature(subscription, PATH_PLAN_FEATURE[matchPath])
}

export const ALL_PLAN_FEATURES = [
  PLAN_FEATURE.PATIENTS,
  PLAN_FEATURE.APPOINTMENTS,
  PLAN_FEATURE.CONSULTATIONS,
  PLAN_FEATURE.STAFF_MANAGEMENT,
  PLAN_FEATURE.LAB,
  PLAN_FEATURE.PHARMACY,
  PLAN_FEATURE.BILLING,
  PLAN_FEATURE.TELECONSULTATION,
  PLAN_FEATURE.REPORTS,
  PLAN_FEATURE.AI_ASSISTANT,
  PLAN_FEATURE.PRIORITY_SUPPORT,
  PLAN_FEATURE.CUSTOMIZATION,
  PLAN_FEATURE.ENHANCED_BACKUPS,
  PLAN_FEATURE.INTEGRATIONS,
]

export function planIncludesFeature(planName, feature) {
  const plan = normalizePlanName(planName)
  const matrix = {
    [PLAN_NAMES.BASIC]: new Set([
      PLAN_FEATURE.PATIENTS,
      PLAN_FEATURE.APPOINTMENTS,
      PLAN_FEATURE.CONSULTATIONS,
      PLAN_FEATURE.STAFF_MANAGEMENT,
    ]),
    [PLAN_NAMES.PRO]: new Set([
      PLAN_FEATURE.PATIENTS,
      PLAN_FEATURE.APPOINTMENTS,
      PLAN_FEATURE.CONSULTATIONS,
      PLAN_FEATURE.STAFF_MANAGEMENT,
      PLAN_FEATURE.LAB,
      PLAN_FEATURE.PHARMACY,
      PLAN_FEATURE.BILLING,
      PLAN_FEATURE.TELECONSULTATION,
      PLAN_FEATURE.REPORTS,
    ]),
    [PLAN_NAMES.ENTERPRISE]: new Set(ALL_PLAN_FEATURES),
  }
  return matrix[plan]?.has(feature) ?? false
}
