import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getToken, setHopitalId } from "@/services/httpClient"
import { tenantPublicService } from "@/services/api"
import {
  getTenantDisplayName,
  getTenantLocation,
  resolveSubdomainFromHost,
} from "@/lib/tenantHost"

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

export function TenantBrandingProvider({ children }) {
  const [subdomain] = useState(() => resolveSubdomainFromHost())
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(Boolean(subdomain))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!subdomain) {
      setTenant(null)
      setLoading(false)
      setError(null)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    tenantPublicService
      .getBySubdomain(subdomain)
      .then((data) => {
        if (cancelled) return
        setTenant(data)
        setError(null)
        if (!getToken() && data?.idHopital != null) {
          setHopitalId(data.idHopital)
        }
      })
      .catch((err) => {
        if (cancelled) return
        setTenant(null)
        setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [subdomain])

  const displayName = getTenantDisplayName(tenant)
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
      subdomain,
      tenant,
      loading,
      error,
      hasTenant: Boolean(tenant),
      displayName,
      location,
    }),
    [subdomain, tenant, loading, error, displayName, location],
  )

  return <TenantBrandingContext.Provider value={value}>{children}</TenantBrandingContext.Provider>
}

export function useTenantBranding() {
  const ctx = useContext(TenantBrandingContext)
  return ctx ?? EMPTY
}
