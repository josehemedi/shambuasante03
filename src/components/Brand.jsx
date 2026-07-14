import { useI18n } from "@/i18n/I18nProvider"
import { useTenantBranding } from "@/auth/TenantBrandingProvider"
import { TenantLogo } from "@/components/tenant/TenantBrandingUI"
import { getHospitalTypeLabelKey, getTenantLocation } from "@/lib/tenantHost"
import { cn } from "@/lib/utils"

export function Logo({ className }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 21s-7-4.35-9.33-9.06C1.1 8.7 2.67 5.5 5.8 5.5c1.9 0 3.2 1.1 4.2 2.5 1-1.4 2.3-2.5 4.2-2.5 3.13 0 4.7 3.2 3.13 6.44C19 16.65 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.18"
        />
        <path d="M6.5 12h2.2l1.3-2.4 1.8 4.4 1.2-2h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function BrandMark({ collapsed = false, preferTenant = true, variant = "default" }) {
  const { t } = useI18n()
  const { tenant, hasTenant, displayName } = useTenantBranding()
  const onHero = variant === "hero"

  if (preferTenant && hasTenant && tenant) {
    const typeKey = getHospitalTypeLabelKey(tenant.type)
    const location = getTenantLocation(tenant)
    const subtitle =
      location ||
      (typeKey ? t(typeKey) : null) ||
      t("tenantBranding.poweredBy")

    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <TenantLogo tenant={tenant} />
        {!collapsed && (
          <div className="flex min-w-0 flex-col leading-none">
            <span
              className={cn(
                "truncate font-display font-bold tracking-tight",
                onHero
                  ? "text-[15px] text-primary-foreground"
                  : "text-[15px] text-foreground",
              )}
            >
              {displayName}
            </span>
            <span
              className={cn(
                "mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider",
                onHero ? "text-primary-foreground/75" : "text-muted-foreground",
              )}
            >
              {subtitle}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <Logo />
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-[15px] font-bold tracking-tight",
              onHero ? "text-primary-foreground" : "text-foreground",
            )}
          >
            Shambua<span className={onHero ? "text-primary-foreground/90" : "text-primary"}>Sante</span>
          </span>
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium uppercase tracking-wider",
              onHero ? "text-primary-foreground/75" : "text-muted-foreground",
            )}
          >
            Health Cloud
          </span>
        </div>
      )}
    </div>
  )
}
