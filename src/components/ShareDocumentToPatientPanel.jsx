import { useState } from "react"
import { FileUp, Loader2, Send } from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { medecinShareService } from "@/services/api"

const MySwal = withReactContent(Swal)

/**
 * Panneau médecin : envoyer un document médical au patient (PDF, image…).
 */
export default function ShareDocumentToPatientPanel({ idPatient, patientName }) {
  const { t } = useI18n()
  const [titre, setTitre] = useState("")
  const [typeDocument, setTypeDocument] = useState("DOCUMENT")
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)

  if (!idPatient) return null

  const handleSend = async () => {
    if (!file) {
      await MySwal.fire({
        icon: "warning",
        title: t("shareToPatient.docMissingFile"),
      })
      return
    }
    const confirm = await MySwal.fire({
      icon: "question",
      title: t("shareToPatient.docConfirmTitle"),
      html: t("shareToPatient.docConfirmHtml", {
        patient: patientName || `#${idPatient}`,
        file: file.name,
      }),
      showCancelButton: true,
      confirmButtonText: t("shareToPatient.confirmSend"),
      cancelButtonText: t("common.cancel"),
      confirmButtonColor: "#1e40af",
    })
    if (!confirm.isConfirmed) return

    setSending(true)
    try {
      const result = await medecinShareService.sendDocument({
        idPatient: Number(idPatient),
        typeDocument,
        titre: titre.trim() || file.name,
        file,
      })
      setFile(null)
      setTitre("")
      await MySwal.fire({
        icon: "success",
        title: t("shareToPatient.successTitle"),
        text: t("shareToPatient.successBody", {
          patient: result?.nomPatient || patientName || "—",
          email: result?.emailMasque || "—",
        }),
        timer: 3200,
        showConfirmButton: false,
      })
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("shareToPatient.errorTitle"),
        text: err?.message || t("shareToPatient.errorBody"),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4 text-primary" />
          {t("shareToPatient.docPanelTitle")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("shareToPatient.docPanelSubtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("shareToPatient.docTitle")}</label>
            <Input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={t("shareToPatient.docTitlePlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("shareToPatient.docType")}</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={typeDocument}
              onChange={(e) => setTypeDocument(e.target.value)}
            >
              <option value="DOCUMENT">{t("shareToPatient.types.DOCUMENT")}</option>
              <option value="RADIO">{t("shareToPatient.types.RADIO")}</option>
              <option value="COMPTE_RENDU">{t("shareToPatient.types.COMPTE_RENDU")}</option>
              <option value="AUTRE">{t("shareToPatient.types.AUTRE")}</option>
            </select>
          </div>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center hover:bg-muted/40">
          <FileUp className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {file ? file.name : t("shareToPatient.docPickFile")}
          </span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <Button onClick={handleSend} disabled={sending || !file} className="w-full gap-2 sm:w-auto">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t("shareToPatient.sendDocument")}
        </Button>
      </CardContent>
    </Card>
  )
}
