import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS } from "@/config/roles"
import { useI18n } from "@/i18n/I18nProvider"
import { AlertTriangle } from "lucide-react"
import { stripRolePrefix, withRolePath } from "@/config/roleRoutes"

function isRenewalAllowedModule(modulePath) {
  return modulePath === "/" || modulePath === "/my-subscription" || modulePath.startsWith("/my-subscription/")
}

export function RequireSubscriptionRenewal({ children }) {
  const { roleKey, user } = useAuth()
  const location = useLocation()
  const { t } = useI18n()

  const renewalRequired =
    roleKey === ROLE_KEYS.HOSPITAL_ADMIN && Boolean(user?.tenantAccessRestricted)

  if (!renewalRequired) {
    return children
  }

  const modulePath = stripRolePrefix(location.pathname)

  if (!isRenewalAllowedModule(modulePath)) {
    return (
      <Navigate
        to={withRolePath(roleKey, "/my-subscription")}
        replace
        state={{ renewalRequired: true }}
      />
    )
  }

  return (
    <>
      {modulePath === "/" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">{t("mySubscription.renewalRequiredTitle")}</p>
            <p className="mt-1 text-muted-foreground">{t("mySubscription.renewalRequiredText")}</p>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
