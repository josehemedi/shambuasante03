import { Building2, Shield, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/primitives"
import { useTenantScope } from "@/hooks/useTenantScope"
import { cn } from "@/lib/utils"

/**
 * Bandeau visuel rappelant l'isolation des données par établissement (multi-tenant SaaS).
 */
export function TenantScopeBar({ className, compact = false }) {
  const { hopitalId, hospitalName, hasTenant, facilityBadge, isolatedHint, missingMessage } =
    useTenantScope()

  if (!hasTenant) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning",
          className,
        )}
        role="alert"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{missingMessage}</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex flex-wrap items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs",
          className,
        )}
      >
        <Shield className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">{hospitalName}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-mono text-muted-foreground">{facilityBadge}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/8 via-card to-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" />
        </span>
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            {hospitalName}
            <Badge variant="primary" className="font-mono text-[10px]">
              {facilityBadge}
            </Badge>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 text-primary" />
            {isolatedHint}
          </p>
        </div>
      </div>
      <Badge variant="success" className="w-fit shrink-0 gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        SaaS · {hopitalId}
      </Badge>
    </div>
  )
}
