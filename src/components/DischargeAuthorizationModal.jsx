import { useEffect, useState } from "react"
import { LogOut, Stethoscope } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { dischargeService } from "@/services/api"

const ETATS_SORTIE = [
  { value: "GUERI", labelKey: "discharge.stateHealed" },
  { value: "AMELIORE", labelKey: "discharge.stateImproved" },
  { value: "STATIONNAIRE", labelKey: "discharge.stateStable" },
  { value: "TRANSFERE", labelKey: "discharge.stateTransferred" },
]

export default function DischargeAuthorizationModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
}) {
  const { t } = useI18n()
  const [contexte, setContexte] = useState(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [diagnostic, setDiagnostic] = useState("")
  const [etatSortie, setEtatSortie] = useState("GUERI")
  const [recommandations, setRecommandations] = useState("")
  const [ordonnance, setOrdonnance] = useState("")
  const [observations, setObservations] = useState("")

  useEffect(() => {
    if (!isOpen || !patientId) return
    setError("")
    setDiagnostic("")
    setEtatSortie("GUERI")
    setRecommandations("")
    setOrdonnance("")
    setObservations("")
    setLoadingContext(true)
    dischargeService
      .getContexte(patientId)
      .then(setContexte)
      .catch((e) => {
        setContexte(null)
        setError(e?.message || t("discharge.loadError"))
      })
      .finally(() => setLoadingContext(false))
  }, [isOpen, patientId, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!diagnostic.trim()) {
      setError(t("discharge.diagnosticRequired"))
      return
    }
    if (!contexte?.peutAutoriser) {
      setError(contexte?.message || t("discharge.notAllowed"))
      return
    }

    setSaving(true)
    setError("")
    try {
      const result = await dischargeService.autoriser({
        idPatient: Number(patientId),
        idConsultation: contexte.idConsultationActive,
        idAdmission: contexte.idAdmissionActive,
        diagnosticFinal: diagnostic.trim(),
        etatSortie,
        recommandationsPostHospitalisation: recommandations.trim() || null,
        contenuOrdonnance: ordonnance.trim() || null,
        observationsOrdonnance: observations.trim() || null,
      })
      onSuccess?.(result)
      onClose()
    } catch (err) {
      setError(err?.message || t("discharge.saveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-primary" />
            {t("discharge.authorizeTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-foreground">{patientName}</p>
            {loadingContext ? (
              <p className="mt-1 text-muted-foreground">{t("common.loading")}…</p>
            ) : contexte ? (
              <div className="mt-2 space-y-1 text-muted-foreground">
                <p>
                  {t("discharge.clinicalStatus")}:{" "}
                  <Badge variant="outline">{contexte.statutClinique || "—"}</Badge>
                </p>
                {contexte.typePriseEnCharge && (
                  <p className="inline-flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {contexte.typePriseEnCharge} — {contexte.motifPriseEnCharge || "—"}
                  </p>
                )}
                {!contexte.peutAutoriser && (
                  <p className="text-destructive">{contexte.message}</p>
                )}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("discharge.finalDiagnostic")}</label>
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={diagnostic}
              onChange={(e) => setDiagnostic(e.target.value)}
              disabled={!contexte?.peutAutoriser || saving}
              placeholder={t("discharge.diagnosticPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("discharge.exitState")}</label>
            <Select value={etatSortie} onValueChange={setEtatSortie} disabled={!contexte?.peutAutoriser || saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ETATS_SORTIE.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {t(s.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("discharge.recommendations")}</label>
            <textarea
              className="min-h-[60px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={recommandations}
              onChange={(e) => setRecommandations(e.target.value)}
              disabled={!contexte?.peutAutoriser || saving}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("discharge.prescription")}</label>
            <textarea
              className="min-h-[60px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={ordonnance}
              onChange={(e) => setOrdonnance(e.target.value)}
              disabled={!contexte?.peutAutoriser || saving}
              placeholder={t("discharge.prescriptionPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("discharge.observations")}</label>
            <Input
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              disabled={!contexte?.peutAutoriser || saving}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving || loadingContext || !contexte?.peutAutoriser}
            >
              {saving ? t("common.saving") : t("discharge.authorizeButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
