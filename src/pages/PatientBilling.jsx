import { motion } from "framer-motion"
import { Loader2, Receipt, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Badge, Button, Card, CardContent } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { patientPortalService } from "@/services/api"
import { cn } from "@/lib/utils"

const STATUS_STYLE = {
  PAYE: "success",
  PARTIEL: "warning",
  IMPAYE: "destructive",
  ANNULE: "secondary",
}

export default function PatientBilling() {
  const { t, locale } = useI18n()
  const { data: invoices, loading, error, reload } = useAsync(() => patientPortalService.getInvoices(), [])

  function formatMoney(value) {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)
  }

  function formatDate(value) {
    if (!value) return "—"
    return new Date(value).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title={t("patientPortal.billing.title")}
        subtitle={t("patientPortal.billing.subtitle")}
        actions={
          <Button variant="outline" size="sm" className="gap-2" onClick={reload} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t("common.refresh")}
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("patientPortal.billing.loadError")}
        </p>
      ) : !invoices?.length ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-900/15 bg-blue-50/40 px-6 py-20 text-center">
          <Receipt className="mb-4 h-12 w-12 text-blue-800/40" />
          <p className="text-lg font-semibold text-[#0b1f4a]">{t("patientPortal.billing.emptyTitle")}</p>
          <p className="mt-2 max-w-md text-sm text-blue-800/55">{t("patientPortal.billing.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, index) => (
            <motion.div
              key={inv.idFacture || inv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.2) }}
            >
              <Card className="border-blue-900/10">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-800/10 text-blue-800">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-[#0b1f4a]">{inv.numero}</p>
                      <p className="mt-1 text-sm text-blue-800/55">{formatDate(inv.date)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <Badge variant={STATUS_STYLE[inv.statut] || "secondary"}>
                      {t(`patientPortal.billing.status.${inv.statut}`) !== `patientPortal.billing.status.${inv.statut}`
                        ? t(`patientPortal.billing.status.${inv.statut}`)
                        : inv.statut}
                    </Badge>
                    <p className={cn("text-lg font-semibold tabular-nums text-[#0b1f4a]")}>
                      {formatMoney(inv.montantTtc)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
