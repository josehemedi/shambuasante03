import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { ROLE_KEYS } from "@/config/roles"
import { normalizePlanName } from "@/config/subscriptionPlans"
import { tenantSubscriptionService } from "@/services/api"
import { useAuth } from "@/auth/AuthProvider"

const SubscriptionContext = createContext(null)

export function SubscriptionProvider({ children }) {
  const { roleKey, isAuthenticated } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!isAuthenticated || roleKey !== ROLE_KEYS.HOSPITAL_ADMIN) {
      setSubscription(null)
      return null
    }
    setLoading(true)
    try {
      const data = await tenantSubscriptionService.getCurrent()
      setSubscription(data)
      return data
    } catch {
      setSubscription(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, roleKey])

  useEffect(() => {
    reload()
  }, [reload])

  const value = useMemo(
    () => ({
      subscription,
      loading,
      reload,
      planName: normalizePlanName(subscription?.planNom),
      features: subscription?.features || [],
      maxUsers: subscription?.maxUsers ?? null,
      currentUserCount: subscription?.currentUserCount ?? 0,
      teleconsultationMonthlyLimit: subscription?.teleconsultationMonthlyLimit ?? null,
      teleconsultationUsedThisMonth: subscription?.teleconsultationUsedThisMonth ?? 0,
    }),
    [subscription, loading, reload],
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider")
  }
  return ctx
}
