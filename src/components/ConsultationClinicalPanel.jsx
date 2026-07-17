import { useEffect, useState } from "react"
import { useRolePath } from "@/hooks/useRolePath"
import { motion } from "framer-motion"
import {
  Activity,
  FileSignature,
  FlaskConical,
  HeartPulse,
  Loader2,
  Pill,
  Plus,
  Printer,
  Save,
  Stethoscope,
  Thermometer,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import Swal from "sweetalert2"
import { Card, CardContent, Button, Input, Badge, Avatar } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { consultationService, medecinLabService, ordonnanceService } from "@/services/api"
import ConsultationSignatureModal from "@/components/ConsultationSignatureModal"
import PrescriptionFromConsultationModal from "@/components/PrescriptionFromConsultationModal"
import { cn } from "@/lib/utils"

const DEFAULT_ANALYSIS_TYPES = [
  "Hémogramme (NFS)",
  "Glycémie",
  "Bilan lipidique",
  "TSH",
  "Créatinine",
  "Urée",
  "ECBU",
]

function emptyAnalysis() {
  return { typeAnalyse: "", resultat: "", notes: "" }
}

function toFormValue(value) {
  return value == null ? "" : String(value)
}

function Section({ title, icon: Icon, children, action, tone = "primary" }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              tone === "primary" && "bg-primary/12 text-primary",
              tone === "secondary" && "bg-secondary/15 text-secondary",
              tone === "accent" && "bg-emerald-500/12 text-emerald-700",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function VitalField({ label, value, onChange, disabled, placeholder, icon: Icon }) {
  return (
    <label className="group relative flex flex-col gap-1.5 rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary/70" />}
        {label}
      </span>
      <Input
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="h-9 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
      />
    </label>
  )
}

/**
 * Fiche clinique présentielle / téléconsult — charge par idConsultation ou idRdv.
 */
export default function ConsultationClinicalPanel({
  idConsultation,
  idRdv,
  patientName,
  motif,
  enabled = true,
  onClose,
}) {
  const { t } = useI18n()
  const { user } = useAuth()
  const { go } = useRolePath()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingLab, setSendingLab] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [rxOpen, setRxOpen] = useState(false)
  const [verifiedMedicalInfo, setVerifiedMedicalInfo] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [fiche, setFiche] = useState(null)
  const [labResults, setLabResults] = useState([])

  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [bloodPressure, setBloodPressure] = useState("")
  const [temperature, setTemperature] = useState("")
  const [heartRate, setHeartRate] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [observations, setObservations] = useState("")
  const [analyses, setAnalyses] = useState([emptyAnalysis()])

  useEffect(() => {
    if (!enabled) return undefined
    if (!idConsultation && !idRdv) return undefined

    let active = true
    setLoading(true)
    setLoadError("")

    const loader = idConsultation
      ? consultationService.getById(idConsultation)
      : consultationService.openFicheByRdv(idRdv)

    loader
      .then((data) => {
        if (!active) return
        applyFiche(data, patientName, motif)
      })
      .catch((err) => {
        if (!active) return
        setLoadError(err?.payload?.message || err?.message || t("tele.consultSheet.loadError"))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [enabled, idConsultation, idRdv, patientName, motif, t])

  useEffect(() => {
    if (!fiche?.idConsultation) return undefined
    let active = true
    const loadLab = () => {
      medecinLabService
        .list()
        .then((list) => {
          if (!active) return
          const linked = (list || []).filter(
            (row) =>
              row.idConsultation === fiche.idConsultation ||
              (fiche.idPatient && row.numericPatientId === fiche.idPatient),
          )
          setLabResults(linked)
        })
        .catch(() => {
          if (active) setLabResults([])
        })
    }
    loadLab()
    const timer = setInterval(loadLab, 12_000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [fiche?.idConsultation, fiche?.idPatient])

  function applyFiche(data, fallbackPatient, fallbackMotif) {
    setFiche(data)
    setWeight(toFormValue(data.poids))
    setHeight(toFormValue(data.taille))
    setBloodPressure(data.tensionArterielle || "")
    setTemperature(toFormValue(data.temperature))
    setHeartRate(toFormValue(data.frequenceCardiaque))
    setDiagnosis(data.diagnostic || "")
    setObservations(data.observations || "")
    setAnalyses(
      data.analyses?.length
        ? data.analyses.map((a) => ({
            typeAnalyse: a.typeAnalyse || "",
            resultat: a.resultat || "",
            notes: a.notes || "",
          }))
        : [emptyAnalysis()],
    )
    if (!data.nomPatient && fallbackPatient) {
      setFiche((prev) => ({
        ...prev,
        nomPatient: fallbackPatient,
        motifVisite: data.motifVisite || fallbackMotif,
      }))
    }
  }

  function buildPayload(finaliser = false) {
    return {
      poids: weight ? Number(weight) : null,
      taille: height ? Number.parseInt(height, 10) : null,
      tensionArterielle: bloodPressure || null,
      temperature: temperature ? Number(temperature) : null,
      frequenceCardiaque: heartRate ? Number.parseInt(heartRate, 10) : null,
      diagnostic: diagnosis || null,
      observations: observations || null,
      analyses: analyses
        .filter((a) => a.typeAnalyse?.trim() || a.resultat?.trim() || a.notes?.trim())
        .map((a) => ({
          typeAnalyse: a.typeAnalyse.trim(),
          resultat: a.resultat.trim(),
          notes: a.notes.trim(),
        })),
      finaliser,
    }
  }

  async function persistFiche(finaliser = false) {
    if (!fiche?.idConsultation) return null
    const updated = await consultationService.saveFiche(fiche.idConsultation, buildPayload(finaliser))
    applyFiche(updated, patientName, motif)
    return updated
  }

  async function handleSave() {
    if (!fiche?.idConsultation) return
    setSaving(true)
    try {
      await persistFiche(true)
      await Swal.fire({
        icon: "success",
        title: t("tele.consultSheet.saveSuccessTitle"),
        text: t("tele.consultSheet.saveSuccess"),
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("tele.consultSheet.saveError"),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleSendToLab() {
    if (!fiche?.idConsultation || !fiche?.idPatient) return
    const types = analyses.map((a) => a.typeAnalyse?.trim()).filter(Boolean)
    if (types.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: t("common.error"),
        text: "Ajoutez au moins une analyse à envoyer au laboratoire.",
      })
      return
    }
    setSendingLab(true)
    try {
      await persistFiche(false)
      for (const type of types) {
        await medecinLabService.create({
          idPatient: fiche.idPatient,
          idConsultation: fiche.idConsultation,
          testCode: type.slice(0, 12).toUpperCase().replace(/\s+/g, "_"),
          testName: type,
          priority: "Routine",
          notes: observations || diagnosis || "",
          submit: true,
        })
      }
      const list = await medecinLabService.list()
      setLabResults(
        (list || []).filter(
          (row) =>
            row.idConsultation === fiche.idConsultation ||
            row.numericPatientId === fiche.idPatient,
        ),
      )
      await Swal.fire({
        icon: "success",
        title: "Envoyé au laboratoire",
        text: `${types.length} demande(s) transmise(s) au laborantin de votre établissement.`,
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || "Impossible d'envoyer au laboratoire.",
      })
    } finally {
      setSendingLab(false)
    }
  }

  async function handlePrint() {
    if (!fiche?.idConsultation) return
    setPrinting(true)
    try {
      if (fiche?.statut !== "SIGNEE") await persistFiche(false)
      await consultationService.downloadFichePdf(fiche.idConsultation)
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

  async function handleOpenSignature() {
    if (!fiche?.idConsultation || fiche?.statut === "SIGNEE") return
    try {
      await persistFiche(false)
      setSignatureOpen(true)
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("tele.consultSheet.saveError"),
      })
    }
  }

  async function handleSavePrescription({ contenuOrdonnance, observations: obs, diagnostic }) {
    await ordonnanceService.create({
      idPatient: fiche.idPatient,
      idMedecin: user?.idMedecin,
      diagnostic: diagnostic || diagnosis || "",
      contenuOrdonnance,
      observations: obs || "",
    })
    await Swal.fire({
      icon: "success",
      title: "Ordonnance créée",
      text: "L'ordonnance a été enregistrée pour ce patient.",
      timer: 2000,
      showConfirmButton: false,
    })
  }

  const isSigned = fiche?.statut === "SIGNEE"
  const displayName = fiche?.nomPatient || patientName || "Patient"
  const canSign =
    Boolean(fiche?.idConsultation) &&
    !isSigned &&
    Boolean(diagnosis?.trim()) &&
    verifiedMedicalInfo &&
    !loading &&
    !saving

  if (!enabled) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="overflow-hidden border-primary/20 shadow-xl shadow-primary/5">
          {/* Hero bandeau */}
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-sky-800 px-5 py-6 text-white sm:px-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <Avatar name={displayName} className="h-14 w-14 border-2 border-white/30 text-base" />
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-white/20 bg-white/15 text-white backdrop-blur-sm">
                      <Stethoscope className="h-3 w-3" />
                      Consultation présentielle
                    </Badge>
                    {isSigned ? (
                      <Badge className="border-emerald-300/40 bg-emerald-500/30 text-white">Signée</Badge>
                    ) : (
                      <Badge className="border-amber-200/30 bg-amber-400/25 text-white">En cours</Badge>
                    )}
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">{displayName}</h2>
                  <p className="max-w-xl text-sm text-white/80">
                    Motif : {fiche?.motifVisite || motif || "—"}
                  </p>
                  {fiche?.idConsultation && (
                    <p className="text-[11px] uppercase tracking-wider text-white/55">
                      Fiche #{fiche.idConsultation}
                      {fiche.nomMedecin ? ` · Dr ${fiche.nomMedecin}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {onClose && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={onClose}
                  >
                    <X className="h-3.5 w-3.5" />
                    Fermer
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={handlePrint}
                  disabled={loading || printing || !fiche?.idConsultation}
                >
                  {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                  PDF
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-teal-900 shadow-md hover:bg-white/95"
                  onClick={handleSave}
                  disabled={loading || saving || !fiche?.idConsultation || isSigned}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="space-y-8 bg-gradient-to-b from-muted/30 via-background to-background py-6 sm:px-7">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement de la fiche…
              </div>
            )}
            {loadError && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {loadError}
              </div>
            )}

            {!loading && !loadError && (
              <>
                <Section title="Constantes vitales" icon={Activity}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <VitalField
                      label="Poids (kg)"
                      icon={UserRound}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      disabled={isSigned}
                      placeholder="72"
                    />
                    <VitalField
                      label="Taille (cm)"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      disabled={isSigned}
                      placeholder="170"
                    />
                    <VitalField
                      label="Tension"
                      icon={Activity}
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      disabled={isSigned}
                      placeholder="120/80"
                    />
                    <VitalField
                      label="Température"
                      icon={Thermometer}
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      disabled={isSigned}
                      placeholder="37.0"
                    />
                    <VitalField
                      label="Pouls"
                      icon={HeartPulse}
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      disabled={isSigned}
                      placeholder="72"
                    />
                  </div>
                </Section>

                <Section title="Examen clinique" icon={Stethoscope}>
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                    <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Diagnostic
                      <Input
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        disabled={isSigned}
                        placeholder="Diagnostic principal…"
                        className="h-11 text-sm font-medium normal-case tracking-normal"
                      />
                    </label>
                    <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Observations cliniques
                      <textarea
                        className="min-h-[110px] w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        disabled={isSigned}
                        placeholder="Anamnèse, examen physique, conduite à tenir…"
                      />
                    </label>
                  </div>
                </Section>

                <Section
                  title="Analyses prescrites"
                  icon={FlaskConical}
                  tone="secondary"
                  action={
                    !isSigned && (
                      <Button size="sm" variant="outline" onClick={() => setAnalyses((p) => [...p, emptyAnalysis()])}>
                        <Plus className="h-3.5 w-3.5" /> Ajouter
                      </Button>
                    )
                  }
                >
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_ANALYSIS_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        disabled={isSigned}
                        className="rounded-full border border-secondary/30 bg-secondary/5 px-3 py-1 text-[11px] font-medium text-secondary-foreground transition hover:bg-secondary/15 disabled:opacity-50"
                        onClick={() => {
                          const emptyIdx = analyses.findIndex((a) => !a.typeAnalyse?.trim())
                          if (emptyIdx >= 0) {
                            setAnalyses((prev) =>
                              prev.map((row, i) => (i === emptyIdx ? { ...row, typeAnalyse: type } : row)),
                            )
                          } else {
                            setAnalyses((prev) => [...prev, { typeAnalyse: type, resultat: "", notes: "" }])
                          }
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {analyses.map((row, index) => (
                      <div
                        key={index}
                        className="grid gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-sm sm:grid-cols-[1fr_1fr_auto]"
                      >
                        <Input
                          placeholder="Type d'analyse"
                          value={row.typeAnalyse}
                          disabled={isSigned}
                          onChange={(e) =>
                            setAnalyses((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, typeAnalyse: e.target.value } : r)),
                            )
                          }
                        />
                        <Input
                          placeholder="Notes pour le labo"
                          value={row.notes}
                          disabled={isSigned}
                          onChange={(e) =>
                            setAnalyses((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, notes: e.target.value } : r)),
                            )
                          }
                        />
                        {!isSigned && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setAnalyses((prev) =>
                                prev.length <= 1 ? [emptyAnalysis()] : prev.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>

                {labResults.length > 0 && (
                  <Section title="Résultats laboratoire" icon={FlaskConical} tone="accent">
                    <ul className="space-y-2">
                      {labResults.map((lab) => (
                        <li
                          key={lab.id}
                          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">{lab.testName}</span>
                            <Badge variant={lab.status === "Completed" ? "success" : "secondary"}>
                              {lab.status}
                            </Badge>
                          </div>
                          {lab.resultatTexte ? (
                            <p className="mt-1.5 text-muted-foreground">
                              {lab.resultatTexte}
                              {lab.interpretation ? ` · ${lab.interpretation}` : ""}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-xs text-muted-foreground">En attente du laborantin…</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Barre d'actions clinique */}
                <div className="sticky bottom-3 z-10 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-lg backdrop-blur-md sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSendToLab}
                        disabled={loading || sendingLab || saving || !fiche?.idConsultation || isSigned}
                      >
                        {sendingLab ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FlaskConical className="h-3.5 w-3.5" />
                        )}
                        Envoyer au labo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRxOpen(true)}
                        disabled={!fiche?.idConsultation || !fiche?.idPatient}
                      >
                        <Pill className="h-3.5 w-3.5" />
                        Ordonnance
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => go("/records")}>
                        Voir le dossier
                      </Button>
                    </div>

                    {!isSigned && (
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={verifiedMedicalInfo}
                            onChange={(e) => setVerifiedMedicalInfo(e.target.checked)}
                          />
                          Infos vérifiées
                        </label>
                        <Button size="sm" disabled={!canSign} onClick={handleOpenSignature}>
                          <FileSignature className="h-3.5 w-3.5" />
                          Signer la fiche
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ConsultationSignatureModal
        isOpen={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        fiche={fiche}
        summary={{ diagnostic: diagnosis, observations }}
        onSigned={(result) => {
          setVerifiedMedicalInfo(false)
          setFiche((prev) => ({
            ...prev,
            statut: "SIGNEE",
            dateSignature: result?.dateSignature,
            referenceSignature: result?.referenceSignature,
            hashAbrege: result?.hashAbrege,
            nomMedecin: result?.nomMedecin || prev?.nomMedecin,
            numeroOrdreMedecin: result?.numeroOrdre,
          }))
          setSignatureOpen(false)
        }}
      />

      <PrescriptionFromConsultationModal
        open={rxOpen}
        onClose={() => setRxOpen(false)}
        patientName={displayName}
        diagnostic={diagnosis}
        onSave={handleSavePrescription}
      />
    </>
  )
}
