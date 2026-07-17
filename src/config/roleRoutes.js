import { ROLE_KEYS } from "@/config/roles"

/**
 * Préfixe URL par rôle — spécifie l'espace de chaque utilisateur.
 * Ex. admin → http://localhost:5173/admin
 *     médecin → http://localhost:5173/medecin/...
 */
export const ROLE_ROUTE_PREFIX = {
  [ROLE_KEYS.SUPER_ADMIN]: "platform",
  [ROLE_KEYS.HOSPITAL_ADMIN]: "admin",
  [ROLE_KEYS.DOCTOR]: "medecin",
  [ROLE_KEYS.PATIENT]: "patient",
  [ROLE_KEYS.LAB_TECH]: "laborantin",
  [ROLE_KEYS.RECEPTIONIST]: "reception",
  [ROLE_KEYS.CASHIER]: "caisse",
  [ROLE_KEYS.ARCHIVIST]: "archiviste",
  [ROLE_KEYS.USER]: "user",
}

export const ALL_ROLE_PREFIXES = Object.values(ROLE_ROUTE_PREFIX)

const PREFIX_TO_ROLE = Object.fromEntries(
  Object.entries(ROLE_ROUTE_PREFIX).map(([role, prefix]) => [prefix, role]),
)

/** Préfixe URL pour un rôle (ex. "admin"). */
export function getRolePrefix(roleKey) {
  return ROLE_ROUTE_PREFIX[roleKey] || ROLE_ROUTE_PREFIX[ROLE_KEYS.USER]
}

/** Accueil du rôle : /admin, /medecin, … */
export function roleHomePath(roleKey) {
  return `/${getRolePrefix(roleKey)}`
}

/**
 * Préfixe un chemin module avec le rôle courant.
 * withRolePath("doctor", "/patients") → "/medecin/patients"
 * withRolePath("hospital_admin", "/") → "/admin"
 * Conserve ?query et #hash : "/teleconsultation?rdv=1" → "/medecin/teleconsultation?rdv=1"
 */
export function withRolePath(roleKey, modulePath = "/") {
  const base = roleHomePath(roleKey)
  if (!modulePath || modulePath === "/") return base
  const raw = String(modulePath)
  const hashIdx = raw.indexOf("#")
  const queryIdx = raw.indexOf("?")
  let pathOnly = raw
  let suffix = ""
  if (hashIdx >= 0) {
    suffix = raw.slice(hashIdx)
    pathOnly = raw.slice(0, hashIdx)
  }
  if (queryIdx >= 0 && (hashIdx < 0 || queryIdx < hashIdx)) {
    const qEnd = hashIdx >= 0 ? hashIdx : raw.length
    suffix = raw.slice(queryIdx, qEnd) + suffix
    pathOnly = raw.slice(0, queryIdx)
  }
  const normalized = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`
  if (!normalized || normalized === "/") return `${base}${suffix}`
  return `${base}${normalized}${suffix}`
}

/** Retire le préfixe de rôle éventuel : /admin/patients → /patients */
export function stripRolePrefix(pathname = "/") {
  if (!pathname || pathname === "/") return "/"
  const parts = String(pathname).split("/").filter(Boolean)
  if (parts.length === 0) return "/"
  if (ALL_ROLE_PREFIXES.includes(parts[0])) {
    const rest = parts.slice(1).join("/")
    return rest ? `/${rest}` : "/"
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`
}

export function getPrefixFromPath(pathname = "/") {
  const first = String(pathname).split("/").filter(Boolean)[0]
  return ALL_ROLE_PREFIXES.includes(first) ? first : null
}

export function roleKeyFromPrefix(prefix) {
  return PREFIX_TO_ROLE[prefix] || null
}

/** True si pathname appartient à l'espace du rôle (ou route publique/legacy). */
export function pathBelongsToRole(roleKey, pathname) {
  const expected = getRolePrefix(roleKey)
  const actual = getPrefixFromPath(pathname)
  if (!actual) return true // routes plates / publiques hors préfixe
  return actual === expected
}
