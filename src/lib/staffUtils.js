import { ROLE_KEYS } from "@/config/roles"

export const STAFF_ROLE_KEYS = [
  ROLE_KEYS.HOSPITAL_ADMIN,
  ROLE_KEYS.DOCTOR,
  ROLE_KEYS.RECEPTIONIST,
  ROLE_KEYS.CASHIER,
  ROLE_KEYS.LAB_TECH,
  ROLE_KEYS.ARCHIVIST,
  ROLE_KEYS.USER,
]

export const ROLE_DEPARTMENT_KEYS = {
  [ROLE_KEYS.HOSPITAL_ADMIN]: "staffPage.deptAdministration",
  [ROLE_KEYS.DOCTOR]: "staffPage.deptClinical",
  [ROLE_KEYS.RECEPTIONIST]: "staffPage.deptAdministration",
  [ROLE_KEYS.CASHIER]: "staffPage.deptBilling",
  [ROLE_KEYS.LAB_TECH]: "staffPage.deptLaboratory",
  [ROLE_KEYS.ARCHIVIST]: "staffPage.deptAdministration",
  [ROLE_KEYS.USER]: "staffPage.deptSupport",
}

export const ROLE_BADGE_VARIANT = {
  [ROLE_KEYS.HOSPITAL_ADMIN]: "secondary",
  [ROLE_KEYS.DOCTOR]: "primary",
  [ROLE_KEYS.RECEPTIONIST]: "accent",
  [ROLE_KEYS.CASHIER]: "warning",
  [ROLE_KEYS.LAB_TECH]: "warning",
  [ROLE_KEYS.ARCHIVIST]: "secondary",
  [ROLE_KEYS.USER]: "default",
}

export const STAFF_STATUS_VARIANT = {
  active: "success",
  offline: "secondary",
  disabled: "destructive",
}

export function isStaffMember(user) {
  return user?.role && STAFF_ROLE_KEYS.includes(user.role)
}

export function getStaffStatus(user) {
  if (!user?.accountEnabled) return "disabled"
  if (user.connected) return "active"
  return "offline"
}

export function getStaffStatusKey(status) {
  if (status === "active") return "staffPage.statusActive"
  if (status === "offline") return "staffPage.statusOffline"
  return "staffPage.statusDisabled"
}

export function getDepartmentKey(role) {
  return ROLE_DEPARTMENT_KEYS[role] || "staffPage.deptGeneral"
}
