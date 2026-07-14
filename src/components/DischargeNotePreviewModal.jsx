import { useRef } from "react"
import { FileDown, Printer, CheckCircle2, Building2 } from "lucide-react"
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
import { formatDate } from "@/lib/utils"

const ETAT_LABELS = {
  GUERI: "discharge.stateHealed",
  AMELIORE: "discharge.stateImproved",
  STATIONNAIRE: "discharge.stateStable",
  TRANSFERE: "discharge.stateTransferred",
  DECES: "discharge.stateDeceased",
}

export default function DischargeNotePreviewModal({
  isOpen,
  onClose,
  note,
  onDownloadPdf,
  pdfLoading = false,
}) {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const printRef = useRef(null)

  if (!note) return null

  const etatKey = ETAT_LABELS[note.etatSortie] || null
  const dateLabel = note.dateSortie
    ? formatDate(String(note.dateSortie).replace(" ", "T"), lang)
    : formatDate(new Date().toISOString().split("T")[0], lang)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open("", "_blank", "width=800,height=900")
    if (!win) return
    win.document.write(`
      <!DOCTYPE html><html><head><title>${t("discharge.noteTitle")}</title>
      <style>
        body { font-family: Georgia, serif; padding: 40px; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
        .header { border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
        .hospital { font-size: 22px; font-weight: bold; color: #0d9488; }
        .title { font-size: 18px; margin-top: 8px; letter-spacing: 0.05em; text-transform: uppercase; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 14px; }
        .section { margin-bottom: 20px; }
        .section h3 { font-size: 12px; text-transform: uppercase; color: #666; margin: 0 0 8px; letter-spacing: 0.08em; }
        .section p { margin: 0; line-height: 1.6; white-space: pre-wrap; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 13px; color: #555; }
        .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
      </style></head><body>${content.innerHTML}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            {t("discharge.previewTitle")}
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white px-6 py-6 text-foreground dark:bg-card">
          <div className="border-b-2 border-primary pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 font-display text-lg font-bold text-primary">
                  <Building2 className="h-5 w-5" />
                  {user?.tenantLabel || "Shambua Santé"}
                </p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("discharge.noteTitle")}
                </p>
              </div>
              <Badge variant="success">{t("discharge.statusDelivered")}</Badge>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("discharge.noteNumber")}</p>
              <p className="font-medium">{note.numeroBon || `BS-${note.idBonSortie}`}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("discharge.dischargeDate")}</p>
              <p className="font-medium">{dateLabel}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("discharge.patientName")}</p>
              <p className="font-display text-lg font-semibold">{note.nomPatient}</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("discharge.finalDiagnostic")}
              </h3>
              <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {note.diagnosticFinal || "—"}
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("discharge.exitState")}
              </h3>
              <Badge variant="outline">{etatKey ? t(etatKey) : note.etatSortie || "—"}</Badge>
            </section>

            {note.recommandations && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("discharge.recommendations")}
                </h3>
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {note.recommandations}
                </p>
              </section>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{t("discharge.authorizedBy")}:</span>{" "}
              {note.autorisePar || "—"}
            </p>
            {note.statutPaiementFinal && (
              <p className="mt-1 text-emerald-700 dark:text-emerald-400">{t("discharge.paymentSettled")}</p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            {t("discharge.print")}
          </Button>
          <Button type="button" onClick={onDownloadPdf} disabled={pdfLoading}>
            <FileDown className="h-4 w-4" />
            {pdfLoading ? t("common.saving") : t("discharge.downloadPdf")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
