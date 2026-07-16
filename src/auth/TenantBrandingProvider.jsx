import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { getTenantDisplayName, getTenantLocation } from "@/lib/tenantHost"
import { tenantService } from "@/services/api"

const TenantBrandingContext = createContext(null)

const EMPTY = {
  tenant: null,
  loading: false,
  error: null,
  hasTenant: false,
  displayName: null,
  location: null,
}

/**
 * Branding établissement = uniquement le compte connecté (idHopital JWT).
 * Aucune détection par sous-domaine / hostname.
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
    document.title = displayName ? `${displayName} | Shambua Santé` : "Shambua Santé"
  }, [displayName])

  const value = useMemo(
    () => ({
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
