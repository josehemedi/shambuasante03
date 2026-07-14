import { useState } from "react"
import { FileSignature, Loader2, ShieldAlert } from "lucide-react"
import Swal from "sweetalert2"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { consultationService } from "@/services/api"

export default function ConsultationSignatureModal({
  isOpen,
  onClose,
  fiche,
  summary,
  onSigned,
}) {
  const { t } = useI18n()
  const [password, setPassword] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  function handleClose() {
    if (submitting) return
    setPassword("")
    setConfirmed(false)
    setError("")
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fiche?.idConsultation) return
    if (!password.trim()) {
      setError(t("signature.passwordRequired"))
      return
    }
    if (!confirmed) {
      setError(t("signature.confirmationRequired"))
      return
    }

    setSubmitting(true)
    setError("")
    try {
      const result = await consultationService.signer(fiche.idConsultation, {
        motDePasse: password,
        confirmation: true,
      })
      handleClose()
      await Swal.fire({
        icon: "success",
        title: t("signature.successTitle"),
        html: `
          <p>${t("signature.successBody")}</p>
          <div style="margin-top:12px;text-align:left;font-size:14px;">
            <p><strong>${t("signature.signedBy")}</strong> ${result.nomMedecin || "—"}</p>
            <p><strong>${t("signature.signedAt")}</strong> ${result.dateSignature || "—"}</p>
            <p><strong>${t("signature.reference")}</strong> ${result.referenceSignature || "—"}</p>
          </div>
        `,
      })
      onSigned?.(result)
    } catch (err) {
      const code = err?.payload?.code || err?.payload?.error
      const message = err?.payload?.message || err?.message || t("signature.error")
      if (code === "CONSULTATION_DEJA_SIGNEE") {
        setError(t("signature.alreadySigned"))
      } else if (code === "MOT_DE_PASSE_INVALIDE") {
        setError(t("signature.invalidPassword"))
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            {t("signature.modalTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <p className="mb-2 font-semibold text-foreground">{t("signature.summaryTitle")}</p>
            <dl className="space-y-1 text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>{t("workspace.diagnosis")}</dt>
                <dd className="text-right font-medium text-foreground">{summary.diagnostic || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t("workspace.observations")}</dt>
                <dd className="max-w-[55%] text-right font-medium text-foreground">{summary.observations || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t("signature.ordonnance")}</dt>
                <dd className="text-right font-medium text-foreground">{summary.ordonnance || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t("signature.lockWarning")}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">{t("signature.passwordLabel")}</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("signature.passwordPlaceholder")}
              className="mt-1"
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>{t("signature.legalConfirmation")}</span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("signature.confirmButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
