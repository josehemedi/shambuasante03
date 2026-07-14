import { useLocation, Link } from "react-router-dom"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { useSubscription } from "@/auth/SubscriptionProvider"
import { canAccessPath } from "@/config/subscriptionPlans"
import { ROLE_KEYS } from "@/config/roles"
import { useI18n } from "@/i18n/I18nProvider"
import { Card, Button } from "@/components/ui/primitives"
import { roleHomePath, withRolePath } from "@/config/roleRoutes"

export function RequireAccess({ children }) {
  const { canAccess, role, bootstrapping, roleKey } = useAuth()
  const { subscription } = useSubscription()
  const { t } = useI18n()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    )
  }

  const roleAllowed = canAccess(location.pathname)
  const planAllowed =
    roleKey !== ROLE_KEYS.HOSPITAL_ADMIN || canAccessPath(subscription, location.pathname)

  if (roleAllowed && planAllowed) return children

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-foreground">
          {!roleAllowed ? t("access.deniedTitle") : t("access.planDeniedTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          {!roleAllowed ? (
            <>
              {t("access.deniedBody")}{" "}
              <span className="font-medium text-foreground">{t(role.labelKey)}</span>.
            </>
          ) : (
            t("access.planDeniedBody")
          )}
        </p>
        {!planAllowed && roleKey === ROLE_KEYS.HOSPITAL_ADMIN && (
          <Link to={withRolePath(roleKey, "/my-subscription")} className="mt-4 inline-block">
            <Button variant="outline">{t("access.upgradePlan")}</Button>
          </Link>
        )}
        <Link to={roleHomePath(roleKey)} className="mt-6 inline-block">
          <Button>
            <ArrowLeft className="h-4 w-4" />
            {t("access.backToDashboard")}
          </Button>
        </Link>
      </Card>
    </div>
  )
}
