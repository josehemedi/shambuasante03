import { useEffect, useMemo, useState } from "react"
import {
  X,
  UserPlus,
  Stethoscope,
  Loader2,
  Clock,
  Shield,
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
import { receptionService, patientService } from "@/services/api"
import { cn } from "@/lib/utils"

const TYPE_VISITE_OPTIONS = [
  "CONSULTATION_GENERALE",
  "URGENCE",
  "CONTROLE",
  "LABORATOIRE",
  "PEDIATRIE",
  "AUTRE",
]

const SERVICE_OPTIONS = [
  "Médecine générale",
  "Pédiatrie",
  "Urgences",
  "Laboratoire",
  "Gynécologie",
  "Chirurgie",
]

const EMPTY = {
  idPatient: null,
  nom: "",
  prenom: "",
  sexe: "M",
  age: "",
  telephone: "",
  typeVisite: "CONSULTATION_GENERALE",
  motifConsultation: "",
  serviceDemande: "",
  specialite: "",
  idMedecin: "",
  observationsAdministratives: "",
  modePaiement: "",
}

function formatArrivalNow(locale) {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date())
  } catch {
    return new Date().toLocaleString()
  }
}

export default function WalkInRegistrationModal({ isOpen, onClose, onSaved, saving = false }) {
  const { t, locale } = useI18n()
  const [form, setForm] = useState(EMPTY)
  const [specialites, setSpecialites] = useState([])
  const [medecins, setMedecins] = useState([])
  const [loadingMedecins, setLoadingMedecins] = useState(false)
  const [error, setError] = useState("")
  const [patientQuery, setPatientQuery] = useState("")
  const [patientHits, setPatientHits] = useState([])
  const [searchingPatients, setSearchingPatients] = useState(false)
  const [arrivalLabel, setArrivalLabel] = useState(() => formatArrivalNow(locale))

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY)
    setError("")
    setPatientQuery("")
    setPatientHits([])
    setArrivalLabel(formatArrivalNow(locale))
    receptionService
      .listSpecialites()
      .then((list) => setSpecialites(list || []))
      .catch(() => setSpecialites([]))
  }, [isOpen, locale])

  useEffect(() => {
    if (!isOpen || patientQuery.trim().length < 2) {
      setPatientHits([])
      return undefined
    }
    let active = true
    const timer = setTimeout(() => {
      setSearchingPatients(true)
      patientService
        .search({ nom: patientQuery.trim() })
        .then((list) => {
          if (active) setPatientHits(list || [])
        })
        .catch(() => {
          if (active) setPatientHits([])
        })
        .finally(() => {
          if (active) setSearchingPatients(false)
        })
    }, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [isOpen, patientQuery])

  const selectExistingPatient = (p) => {
    const age =
      p.age != null
        ? String(p.age)
        : p.dateNaissance
          ? String(Math.max(0, new Date().getFullYear() - new Date(p.dateNaissance).getFullYear()))
          : ""
    setForm((prev) => ({
      ...prev,
      idPatient: p.idPatient,
      nom: p.nom || "",
      prenom: p.prenom || "",
      sexe: p.sexe || "M",
      age,
      telephone: p.telephone || "",
    }))
    setPatientQuery(`${p.prenom || ""} ${p.nom || ""}`.trim())
    setPatientHits([])
  }

  const clearPatientSelection = () => {
    setForm((prev) => ({
      ...prev,
      idPatient: null,
      nom: "",
      prenom: "",
      sexe: "M",
      age: "",
      telephone: "",
    }))
    setPatientQuery("")
  }

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
    if (!form.idPatient && (form.age === "" || form.age == null || Number.isNaN(Number(form.age)))) {
      setError(t("walkIn.errors.ageRequired"))
      return false
    }
    if (!form.typeVisite) {
      setError(t("walkIn.errors.typeRequired"))
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
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      const result = await onSaved({
        idPatient: form.idPatient || undefined,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        sexe: form.sexe,
        age: form.age !== "" ? Number(form.age) : undefined,
        telephone: form.telephone.trim() || undefined,
        typeVisite: form.typeVisite,
        motifConsultation: form.motifConsultation.trim(),
        serviceDemande: form.serviceDemande.trim(),
        specialite: form.specialite || form.serviceDemande.trim(),
        idMedecin: form.idMedecin ? Number(form.idMedecin) : null,
        affectationAutomatique: false,
        mode: "PHYSIQUE",
        observationsAdministratives: form.observationsAdministratives.trim() || undefined,
        modePaiement: form.modePaiement.trim() || undefined,
      })
      if (result?.idAdmission != null) {
        try {
          await receptionService.downloadTicketPdf(result.idAdmission)
        } catch {
          /* l'enregistrement a réussi même si le PDF échoue */
        }
      }
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
              className="text-white hover:bg-white/15 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <CardContent className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <section className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{t("walkIn.sectionPatient")}</p>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">{t("walkIn.searchExisting")}</label>
              <Input
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value)
                  if (form.idPatient) {
                    setForm((prev) => ({ ...prev, idPatient: null }))
                  }
                }}
                placeholder={t("walkIn.searchExistingPlaceholder")}
              />
              {searchingPatients && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("common.loading")}
                </p>
              )}
              {patientHits.length > 0 && (
                <ul className="max-h-36 overflow-y-auto rounded-lg border border-border bg-card shadow-sm">
                  {patientHits.slice(0, 8).map((p) => (
                    <li key={p.idPatient}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                        onClick={() => selectExistingPatient(p)}
                      >
                        <span>
                          {p.prenom} {p.nom}
                          {p.codePatient ? ` · ${p.codePatient}` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">{p.telephone || ""}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {form.idPatient && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">{t("walkIn.existingSelected")} #{form.idPatient}</Badge>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearPatientSelection}>
                    {t("walkIn.createNewInstead")}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">{t("walkIn.lastName")}</label>
                <Input value={form.nom} onChange={(e) => update("nom", e.target.value)} disabled={!!form.idPatient} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">{t("walkIn.firstName")}</label>
                <Input value={form.prenom} onChange={(e) => update("prenom", e.target.value)} disabled={!!form.idPatient} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">{t("walkIn.gender")}</label>
                <Select value={form.sexe} onValueChange={(v) => update("sexe", v)} disabled={!!form.idPatient}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">{t("patients.male")}</SelectItem>
                    <SelectItem value="F">{t("patients.female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">{t("walkIn.age")}</label>
                <Input
                  type="number"
                  min={0}
                  max={130}
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  disabled={!!form.idPatient}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm text-muted-foreground">{t("walkIn.phone")}</label>
                <Input
                  value={form.telephone}
                  onChange={(e) => update("telephone", e.target.value)}
                  disabled={!!form.idPatient}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{t("walkIn.sectionVisit")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">{t("walkIn.visitType")}</label>
                <Select value={form.typeVisite} onValueChange={(v) => update("typeVisite", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_VISITE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {t(`walkIn.visitTypes.${opt}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">{t("walkIn.service")}</label>
                <Input
                  list="day-visit-services"
                  value={form.serviceDemande}
                  onChange={(e) => update("serviceDemande", e.target.value)}
                  placeholder={t("walkIn.servicePlaceholder")}
                />
                <datalist id="day-visit-services">
                  {SERVICE_OPTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                  {specialites.map((s) => (
                    <option key={`sp-${s}`} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm text-muted-foreground">{t("walkIn.motif")}</label>
                <Input
                  value={form.motifConsultation}
                  onChange={(e) => update("motifConsultation", e.target.value)}
                  placeholder={t("walkIn.motifPlaceholder")}
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("walkIn.priority")}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{t("walkIn.priorityLocked")}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("walkIn.mode")}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {t("walkIn.modePresentiel")}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("walkIn.arrivalAt")}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {arrivalLabel}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">{t("walkIn.observations")}</label>
                <Input
                  value={form.observationsAdministratives}
                  onChange={(e) => update("observationsAdministratives", e.target.value)}
                  placeholder={t("walkIn.observationsPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">{t("walkIn.payment")}</label>
                <Input
                  value={form.modePaiement}
                  onChange={(e) => update("modePaiement", e.target.value)}
                  placeholder={t("walkIn.paymentPlaceholder")}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{t("walkIn.sectionDoctor")}</p>
              <Badge variant="secondary">{t("walkIn.doctorOptional")}</Badge>
            </div>
            {loadingMedecins ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("walkIn.loadingDoctors")}
              </p>
            ) : medecins.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("walkIn.noDoctors")}</p>
            ) : (
              <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => update("idMedecin", "")}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                    !form.idMedecin
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {t("walkIn.noDoctorSelected")}
                </button>
                {medecins.map((m) => (
                  <button
                    key={m.idMedecin}
                    type="button"
                    onClick={() => update("idMedecin", String(m.idMedecin))}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      String(form.idMedecin) === String(m.idMedecin)
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      {m.nomComplet}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.specialite || "—"}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedMedecin && (
              <p className="text-xs text-muted-foreground">
                {t("walkIn.selectedDoctor", { name: selectedMedecin.nomComplet })}
              </p>
            )}
          </section>
        </CardContent>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4">
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
