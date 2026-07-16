import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { getTenantDisplayName, getTenantLocation } from "@/lib/tenantHost"
import { tenantService } from "@/services/api"

const TenantBrandingContext = createContext(null)

const EMPTY = {
  subdomain: null,
  tenant: null,
  loading: false,
  error: null,
  hasTenant: false,
  displayName: null,
  location: null,
}

/**
 * Branding établissement = compte connecté (idHopital JWT), jamais le sous-domaine URL.
 */
export function TenantBrandingProvider({ children }) {
  const { user, isAuthenticated, bootstrapping } = useAuth()
  const hopitalId = isAuthenticated ? user?.idHopital ?? null : null

  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (bootstrapping) return undefined

    if (!isAuthenticated || hopitalId == null) {
      setTenant(null)
      setLoading(false)
      setError(null)
      document.title = "Shambua Santé"
      return undefined
    }

    let cancelled = false
    setLoading(true)

    // Affichage immédiat depuis le profil auth, puis enrichissement API
    setTenant((prev) =>
      prev?.idHopital === hopitalId
        ? prev
        : {
            idHopital: hopitalId,
            name: user?.tenantLabel || null,
            nomCommercial: user?.tenantLabel || null,
            estActif: true,
          },
    )

    tenantService
      .getCurrent()
      .then((data) => {
        if (cancelled) return
        setTenant(data)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        // Garde le label auth si l'API échoue (ex. SUPER_ADMIN sans hôpital ciblé)
        setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bootstrapping, isAuthenticated, hopitalId, user?.tenantLabel])

  const displayName = getTenantDisplayName(tenant) || user?.tenantLabel || null
  const location = getTenantLocation(tenant)

  useEffect(() => {
    if (displayName) {
      document.title = `${displayName} | Shambua Santé`
    } else {
      document.title = "Shambua Santé"
    }
  }, [displayName])

  const value = useMemo(
    () => ({
      subdomain: null,
      tenant,
      loading: bootstrapping || loading,
      error,
      hasTenant: Boolean(tenant?.idHopital || hopitalId),
      displayName,
      location,
    }),
    [tenant, loading, bootstrapping, error, displayName, location, hopitalId],
  )

  return <TenantBrandingContext.Provider value={value}>{children}</TenantBrandingContext.Provider>
}

export function useTenantBranding() {
  const ctx = useContext(TenantBrandingContext)
  return ctx ?? EMPTY
}
