/**
 * Helpers d'affichage établissement (branding).
 * Le tenant SaaS est résolu via le compte connecté (idHopital JWT), pas l'URL.
 */

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
