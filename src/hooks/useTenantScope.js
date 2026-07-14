import { useMemo } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { useI18n } from "@/i18n/I18nProvider"

/**
 * Contexte multi-tenant SaaS : établissement courant (JWT + X-Hopital-Id).
 * Toutes les vues clinique doivent s'appuyer sur ce hook plutôt que sur des données globales.
 */
export function useTenantScope() {
  const { user } = useAuth()
  const { t } = useI18n()

  return useMemo(() => {
    const hopitalId = user?.idHopital ?? null
    const hospitalName = user?.tenantLabel || t("tenant.defaultHospital")
    const hasTenant = hopitalId != null

    return {
      hopitalId,
      hospitalName,
      hasTenant,
      facilityBadge: hasTenant ? t("tenant.facilityId", { id: hopitalId }) : null,
      isolatedHint: t("tenant.isolatedData"),
      missingMessage: t("tenant.missingContext"),
      scopedSubtitle: (key, params = {}) =>
        hasTenant ? t(key, { hospital: hospitalName, ...params }) : t("tenant.missingContext"),
    }
  }, [user?.idHopital, user?.tenantLabel, t])
}
