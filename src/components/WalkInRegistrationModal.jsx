import { useEffect, useMemo, useState } from "react"
import {
  X,
  UserPlus,
  Stethoscope,
  AlertTriangle,
  Loader2,
  Users,
  Clock,
} from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { useI18n } from "@/i18n/I18nProvider"
import { receptionService } from "@/services/api"
import { cn } from "@/lib/utils"

const URGENCY_OPTIONS = [
  { value: "NORMALE", tone: "border-border" },
  { value: "HAUTE", tone: "border-warning/50" },
  { value: "URGENCE", tone: "border-destructive/50" },
]

const EMPTY = {
  nom: "",
  prenom: "",
  sexe: "M",
  age: "",
  telephone: "",
  motifConsultation: "",
  serviceDemande: "",
  specialite: "",
  niveauUrgence: "NORMALE",
  idMedecin: "",
  affectationAutomatique: true,
}

export default function WalkInRegistrationModal({ isOpen, onClose, onSaved, saving = false }) {
  const { t } = useI18n()
  const [form, setForm] = useState(EMPTY)
  const [specialites, setSpecialites] = useState([])
  const [medecins, setMedecins] = useState([])
  const [loadingMedecins, setLoadingMedecins] = useState(false)
  const [error, setError] = useState("")

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY)
    setError("")
    receptionService
      .listSpecialites()
      .then((list) => setSpecialites(list || []))
      .catch(() => setSpecialites([]))
  }, [isOpen])

  const filterKey = form.specialite || form.serviceDemande

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setLoadingMedecins(true)
    receptionService
      .listMedecinsDisponibles({ specialite: filterKey || undefined })
      .then((list) => {
        if (!active) return
        setMedecins(list || [])
      })
      .catch(() => {
        if (!active) return
        setMedecins([])
      })
      .finally(() => {
        if (active) setLoadingMedecins(false)
      })
    return () => {
      active = false
    }
  }, [isOpen, filterKey])

  const selectedMedecin = useMemo(
    () => medecins.find((m) => String(m.idMedecin) === String(form.idMedecin)),
    [medecins, form.idMedecin],
  )

  const validate = () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      setError(t("walkIn.errors.nameRequired"))
      return false
    }
    if (form.age === "" || form.age == null || Number.isNaN(Number(form.age))) {
      setError(t("walkIn.errors.ageRequired"))
      return false
    }
    if (!form.motifConsultation.trim()) {
      setError(t("walkIn.errors.motifRequired"))
      return false
    }
    if (!form.serviceDemande.trim()) {
      setError(t("walkIn.errors.serviceRequired"))
      return false
    }
    if (!form.affectationAutomatique && !form.idMedecin) {
      setError(t("walkIn.errors.doctorRequired"))
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      await onSaved({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        sexe: form.sexe,
        age: Number(form.age),
        telephone: form.telephone.trim() || undefined,
        motifConsultation: form.motifConsultation.trim(),
        serviceDemande: form.serviceDemande.trim(),
        specialite: form.specialite || form.serviceDemande.trim(),
        niveauUrgence: form.niveauUrgence,
        idMedecin: form.affectationAutomatique ? null : Number(form.idMedecin),
        affectationAutomatique: form.affectationAutomatique,
      })
    } catch (err) {
      setError(err?.message || t("walkIn.errors.saveFailed"))
    }
  }

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-3xl">
      <Card className="overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-br from-[#1E56A0] via-blue-700 to-indigo-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">{t("walkIn.title")}</h2>
                <p className="mt-0.5 text-sm text-blue-100/90">{t("walkIn.subtitle")}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={saving}
              className="text-white hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="max-h-[min(72vh,720px)] space-y-5 overflow-y-auto p-6">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <section className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{t("walkIn.sectionPatient")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground">{t("walkIn.lastName")}</label>
                <Input className="mt-1" value={form.nom} onChange={(e) => update("nom", e.target.value)} disabled={saving} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("walkIn.firstName")}</label>
                <Input className="mt-1" value={form.prenom} onChange={(e) => update("prenom", e.target.value)} disabled={saving} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("walkIn.gender")}</label>
                <Select value={form.sexe} onValueChange={(v) => update("sexe", v)} disabled={saving}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">{t("patients.male")}</SelectItem>
                    <SelectItem value="F">{t("patients.female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("walkIn.age")}</label>
                <Input
                  type="number"
                  min={0}
                  max={130}
                  className="mt-1"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-muted-foreground">{t("walkIn.phone")}</label>
                <Input className="mt-1" value={form.telephone} onChange={(e) => update("telephone", e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{t("walkIn.sectionVisit")}</p>
            <div>
              <label className="text-sm text-muted-foreground">{t("walkIn.motif")}</label>
              <Input
                className="mt-1"
                value={form.motifConsultation}
                onChange={(e) => update("motifConsultation", e.target.value)}
                placeholder={t("walkIn.motifPlaceholder")}
                disabled={saving}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground">{t("walkIn.service")}</label>
                <Input
                  className="mt-1"
                  value={form.serviceDemande}
                  onChange={(e) => update("serviceDemande", e.target.value)}
                  placeholder={t("walkIn.servicePlaceholder")}
                  disabled={saving}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("walkIn.specialty")}</label>
                <Select
                  value={form.specialite || undefined}
                  onValueChange={(v) => update("specialite", v)}
                  disabled={saving}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder={t("walkIn.specialtyPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialites.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">{t("walkIn.urgency")}</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {URGENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={saving}
                    onClick={() => update("niveauUrgence", opt.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-sm transition",
                      opt.tone,
                      form.niveauUrgence === opt.value
                        ? "bg-primary/10 ring-2 ring-primary/30"
                        : "bg-muted/30 hover:bg-muted/50",
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {opt.value === "URGENCE" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      {t(`walkIn.urgencyLevel.${opt.value}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{t("walkIn.sectionDoctor")}</p>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.affectationAutomatique}
                  onChange={(e) => update("affectationAutomatique", e.target.checked)}
                  disabled={saving}
                />
                {t("walkIn.autoAssign")}
              </label>
            </div>

            {loadingMedecins ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("walkIn.loadingDoctors")}
              </div>
            ) : medecins.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                {t("walkIn.noDoctors")}
              </p>
            ) : (
              <div className="space-y-2">
                {medecins.slice(0, 8).map((m) => {
                  const active = String(m.idMedecin) === String(form.idMedecin)
                  return (
                    <button
                      key={m.idMedecin}
                      type="button"
                      disabled={saving || form.affectationAutomatique}
                      onClick={() => update("idMedecin", String(m.idMedecin))}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
                        active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:bg-muted/40",
                        form.affectationAutomatique && "opacity-70",
                      )}
                    >
                      <div>
                        <p className="font-medium text-foreground">Dr {m.nomComplet}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Stethoscope className="h-3.5 w-3.5" />
                          {m.specialite || "—"}
                          {m.enHoraire ? (
                            <Badge variant="success">{t("walkIn.onSchedule")}</Badge>
                          ) : (
                            <Badge variant="secondary">{t("walkIn.offSchedule")}</Badge>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 space-y-1 text-right text-xs text-muted-foreground">
                        <p className="flex items-center justify-end gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {t("walkIn.queueCount", { count: m.patientsEnFile })}
                        </p>
                        <p className="flex items-center justify-end gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {t("walkIn.assignedCount", { count: m.patientsAssignes })}
                        </p>
                      </div>
                    </button>
                  )
                })}
                {form.affectationAutomatique && (
                  <p className="text-xs text-muted-foreground">{t("walkIn.autoAssignHint")}</p>
                )}
                {!form.affectationAutomatique && selectedMedecin && (
                  <p className="text-xs text-primary">
                    {t("walkIn.selectedDoctor", { name: selectedMedecin.nomComplet })}
                  </p>
                )}
              </div>
            )}
          </section>
        </CardContent>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {t("walkIn.submit")}
          </Button>
        </div>
      </Card>
    </AnimatedModal>
  )
}
