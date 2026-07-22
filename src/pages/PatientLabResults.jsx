import { motion } from "framer-motion"
import { FlaskConical, Loader2, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Badge, Button, Card, CardContent } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { patientPortalService } from "@/services/api"

export default function PatientLabResults() {
  const { t, locale } = useI18n()
  const { data: results, loading, error, reload } = useAsync(() => patientPortalService.getLabResults(), [])

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
        title={t("patientPortal.labResults.title")}
        subtitle={t("patientPortal.labResults.subtitle")}
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
          {t("patientPortal.labResults.loadError")}
        </p>
      ) : !results?.length ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-900/15 bg-blue-50/40 px-6 py-20 text-center">
          <FlaskConical className="mb-4 h-12 w-12 text-blue-800/40" />
          <p className="text-lg font-semibold text-[#0b1f4a]">{t("patientPortal.labResults.emptyTitle")}</p>
          <p className="mt-2 max-w-md text-sm text-blue-800/55">{t("patientPortal.labResults.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((row, index) => (
            <motion.div
              key={row.idAnalyse || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.2) }}
            >
              <Card className="border-blue-900/10">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-800/10 text-blue-800">
                        <FlaskConical className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#0b1f4a]">{row.typeAnalyse || "—"}</p>
                        <p className="mt-1 text-sm text-blue-800/55">
                          {t("patientPortal.labResults.resultDate")}: {formatDate(row.dateResultat || row.dateDemande)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{row.statut || "—"}</Badge>
                  </div>
                  {row.resultat && (
                    <p className="mt-4 rounded-xl bg-muted/40 p-3 text-sm text-foreground">{row.resultat}</p>
                  )}
                  {row.interpretation && (
                    <p className="mt-2 text-sm text-blue-900/75">
                      <span className="font-medium">{t("patientPortal.labResults.interpretation")}:</span>{" "}
                      {row.interpretation}
                    </p>
                  )}
                  {row.valeursReference && (
                    <p className="mt-2 text-xs text-blue-800/55">
                      {t("patientPortal.labResults.reference")}: {row.valeursReference}
                    </p>
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
