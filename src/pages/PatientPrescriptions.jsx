import { motion } from "framer-motion"
import { Loader2, Pill, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Badge, Button, Card, CardContent } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { patientPortalService } from "@/services/api"

export default function PatientPrescriptions() {
  const { t, locale } = useI18n()
  const { data: prescriptions, loading, error, reload } = useAsync(
    () => patientPortalService.getPrescriptions(),
    [],
  )

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
        title={t("patientPortal.prescriptions.title")}
        subtitle={t("patientPortal.prescriptions.subtitle")}
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
          {t("patientPortal.prescriptions.loadError")}
        </p>
      ) : !prescriptions?.length ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-900/15 bg-blue-50/40 px-6 py-20 text-center">
          <Pill className="mb-4 h-12 w-12 text-blue-800/40" />
          <p className="text-lg font-semibold text-[#0b1f4a]">{t("patientPortal.prescriptions.emptyTitle")}</p>
          <p className="mt-2 max-w-md text-sm text-blue-800/55">{t("patientPortal.prescriptions.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx, index) => (
            <motion.div
              key={rx.idOrdonnance || rx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.2) }}
            >
              <Card className="border-blue-900/10">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-800/10 text-blue-800">
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-[#0b1f4a]">{rx.numero}</p>
                        <p className="mt-1 text-sm text-blue-800/55">{formatDate(rx.date)}</p>
                        <p className="mt-2 text-sm font-medium text-[#0b1f4a]">{rx.medecin}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{rx.statut}</Badge>
                  </div>
                  {rx.diagnostic && rx.diagnostic !== "—" && (
                    <p className="mt-4 text-sm text-blue-900/75">
                      <span className="font-medium">{t("patientPortal.prescriptions.diagnosis")}:</span> {rx.diagnostic}
                    </p>
                  )}
                  {rx.contenu && (
                    <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-xs text-foreground">
                      {rx.contenu}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
