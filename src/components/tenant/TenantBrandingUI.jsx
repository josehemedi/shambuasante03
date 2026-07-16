import { useState } from "react"
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Shield,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { useI18n } from "@/i18n/I18nProvider"
import { useTenantBranding } from "@/auth/TenantBrandingProvider"
import { Logo } from "@/components/Brand"
import {
  getHospitalTypeLabelKey,
  getTenantDisplayName,
  getTenantLocation,
} from "@/lib/tenantHost"
import { cn } from "@/lib/utils"

function TenantLogo({ tenant, className, size = "md" }) {
  const [failed, setFailed] = useState(false)
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9"
  const logoUrl = tenant?.logoUrl

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={cn(dim, "shrink-0 rounded-xl object-cover shadow-sm", className)}
        onError={() => setFailed(true)}
      />
    )
  }

  return <Logo className={className} />
}

function DetailRow({ icon: Icon, children, className }) {
  if (!children) return null
  return (
    <div className={cn("flex items-start gap-2 text-sm", className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  )
}

export function TenantContextCard({ className, compact = false }) {
  const { t } = useI18n()
  const { tenant, loading, hasTenant, displayName, location } = useTenantBranding()

  // Pas de tenant avant connexion — le tenant vient du compte, pas de l'URL
  if (!hasTenant && !loading) return null

  if (loading && !tenant) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("tenantBranding.loading")}
      </div>
    )
  }

  if (!tenant) return null

  const typeKey = getHospitalTypeLabelKey(tenant.type)
  const typeLabel = typeKey ? t(typeKey) : tenant.type

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <TenantLogo tenant={tenant} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold leading-tight text-foreground">
            {displayName}
          </p>
          {tenant.name && tenant.nomCommercial && tenant.name !== tenant.nomCommercial && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{tenant.name}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {typeLabel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Building2 className="h-3 w-3" />
                {typeLabel}
              </span>
            )}
            {tenant.planNom && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                <Shield className="h-3 w-3" />
                {tenant.planNom}
              </span>
            )}
            {!tenant.estActif && (
              <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                <AlertTriangle className="h-3 w-3" />
                {t("tenantBranding.inactive")}
              </span>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="space-y-2 px-4 py-3 text-muted-foreground">
          <DetailRow icon={MapPin}>{location || tenant.adresseComplete}</DetailRow>
          <DetailRow icon={Mail}>{tenant.email}</DetailRow>
          <DetailRow icon={Phone}>{tenant.telephone}</DetailRow>
        </div>
      )}
    </div>
  )
}

export function TenantContextStrip({ className }) {
  const { t } = useI18n()
  const { tenant, loading, hasTenant, displayName, location } = useTenantBranding()

  if (loading || !hasTenant || !tenant) return null

  const typeKey = getHospitalTypeLabelKey(tenant.type)
  const subtitle = location || (typeKey ? t(typeKey) : null)

  return (
    <div
      className={cn(
        "hidden min-w-0 max-w-[220px] items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 md:flex lg:max-w-xs",
        className,
      )}
    >
      <TenantLogo tenant={tenant} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
        {subtitle && (
          <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export function TenantHeroPanel() {
  const { t } = useI18n()
  const { tenant, hasTenant, displayName, location } = useTenantBranding()

  if (!hasTenant || !tenant) return null

  const typeKey = getHospitalTypeLabelKey(tenant.type)

  return (
    <div className="mt-8 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <TenantLogo tenant={tenant} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/75">
            {t("tenantBranding.portalLabel")}
          </p>
          <p className="mt-1 font-display text-2xl font-bold leading-tight text-primary-foreground">
            {displayName}
          </p>
          {(location || typeKey) && (
            <p className="mt-2 text-sm text-primary-foreground/85">
              {[typeKey ? t(typeKey) : null, location].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-primary-foreground/85">
        {tenant.email && (
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{tenant.email}</span>
          </p>
        )}
        {tenant.telephone && (
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{tenant.telephone}</span>
          </p>
        )}
        {tenant.planNom && (
          <p className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{t("tenantBranding.planLabel", { plan: tenant.planNom })}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export function TenantSidebarBadge() {
  const { t } = useI18n()
  const { tenant, hasTenant, displayName, location } = useTenantBranding()

  if (!hasTenant || !tenant) return null

  const typeKey = getHospitalTypeLabelKey(tenant.type)

  return (
    <div className="mb-2 rounded-xl border border-border bg-background/80 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <TenantLogo tenant={tenant} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {[typeKey ? t(typeKey) : null, location].filter(Boolean).join(" · ") ||
              t("tenantBranding.accountTenant")}
          </p>
        </div>
      </div>
    </div>
  )
}

export { TenantLogo, getTenantDisplayName, getTenantLocation }
