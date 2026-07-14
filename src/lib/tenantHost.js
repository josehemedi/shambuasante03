/**
 * Extrait le sous-domaine tenant depuis le hostname du navigateur.
 * Ex. bandalsante.localhost → "bandalsante"
 */
export function resolveSubdomainFromHost(hostname) {
  if (typeof window === "undefined") return null
  const host = (hostname || window.location.hostname || "").toLowerCase().trim()
  if (!host || host === "localhost" || host === "127.0.0.1") return null

  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length)
    return sub && sub !== "localhost" ? sub : null
  }

  const parts = host.split(".")
  if (parts.length >= 3) {
    return parts[0] || null
  }

  return null
}

export function getTenantDisplayName(tenant) {
  if (!tenant) return null
  return tenant.nomCommercial || tenant.name || null
}

export function getTenantLocation(tenant) {
  if (!tenant) return null
  const parts = [tenant.ville, tenant.pays].filter(Boolean)
  return parts.length ? parts.join(", ") : null
}

const HOSPITAL_TYPE_KEYS = {
  CLINIQUE: "hospitals.typeClinic",
  HOPITAL_GENERAL: "hospitals.typeGeneral",
  CENTRE_MEDICAL: "hospitals.typeMedicalCenter",
  MATERNITE: "hospitals.typeMaternity",
  LABORATOIRE: "hospitals.typeLaboratory",
}

export function getHospitalTypeLabelKey(type) {
  if (!type) return null
  return HOSPITAL_TYPE_KEYS[type] || null
}
