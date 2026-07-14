import { useState } from "react"
import { Building2, Loader2, Printer, Stethoscope } from "lucide-react"
import Swal from "sweetalert2"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { consultationService } from "@/services/api"

export default function ConsultationSheetPreviewModal({ isOpen, onClose, fiche }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [printing, setPrinting] = useState(false)

  if (!fiche) return null

  const analyses = fiche.analyses || []

  async function handlePrintPdf() {
    const idConsultation = fiche.idConsultation
    if (!idConsultation) return
    setPrinting(true)
    try {
      await consultationService.downloadFichePdf(idConsultation)
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("tele.consultSheet.printPdfError"),
      })
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            {t("tele.consultSheet.previewTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white px-6 py-6 text-foreground dark:bg-card">
          <div className="border-b-2 border-primary pb-4">
            <p className="flex items-center gap-2 font-display text-lg font-bold text-primary">
              <Building2 className="h-5 w-5" />
              {fiche.nomHopital || user?.tenantLabel || "Shambua Santé"}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("tele.consultSheet.title")}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("tele.consultSheet.date")}</p>
              <p className="font-medium">{fiche.dateConsultation || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("tele.consultSheet.rdv")}</p>
              <p className="font-medium">#{fiche.idRdv || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("tele.consultSheet.patient")}</p>
              <p className="font-display text-base font-semibold">{fiche.nomPatient || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("tele.consultSheet.doctor")}</p>
              <p className="font-medium">{fiche.nomMedecin || user?.name || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("tele.consultSheet.motif")}</p>
              <p className="font-medium">{fiche.motifVisite || "—"}</p>
            </div>
          </div>

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("tele.consultSheet.vitals")}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-sm">
              {[
                [t("workspace.weight"), fiche.poids ? `${fiche.poids} kg` : "—"],
                [t("workspace.height"), fiche.taille ? `${fiche.taille} cm` : "—"],
                [t("workspace.bloodPressure"), fiche.tensionArterielle || "—"],
                [t("workspace.temperature"), fiche.temperature ? `${fiche.temperature} °C` : "—"],
                [t("workspace.heartRate"), fiche.frequenceCardiaque ? `${fiche.frequenceCardiaque} bpm` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("tele.consultSheet.analyses")}
            </h3>
            {analyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("tele.consultSheet.noAnalyses")}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">{t("tele.consultSheet.analysisType")}</th>
                      <th className="px-3 py-2">{t("tele.consultSheet.analysisResult")}</th>
                      <th className="px-3 py-2">{t("tele.consultSheet.analysisNotes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((a, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{a.typeAnalyse || "—"}</td>
                        <td className="px-3 py-2">{a.resultat || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("workspace.diagnosis")}
            </h3>
            <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {fiche.diagnostic || "—"}
            </p>
          </section>

          <section className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("workspace.observations")}
            </h3>
            <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {fiche.observations || "—"}
            </p>
          </section>

          <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
            <Badge variant="outline">{t("tele.consultSheet.teleconsultationBadge")}</Badge>
            <p className="mt-2">{t("tele.consultSheet.footer")}</p>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handlePrintPdf} disabled={printing || !fiche.idConsultation}>
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {t("tele.consultSheet.print")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
