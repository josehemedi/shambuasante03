import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import {
  ArrowLeft,
  ClipboardCheck,
  FileHeart,
  Loader2,
  LogOut,
  Stethoscope,
  User,
} from "lucide-react"
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives"
import { PageHeader } from "@/components/PageHeader"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { useRolePath } from "@/hooks/useRolePath"
import { dischargeService, patientService } from "@/services/api"
import { formatDate } from "@/lib/utils"
import { ROLE_KEYS } from "@/config/roles"

const MySwal = withReactContent(Swal)

const ETATS_SORTIE = [
  { value: "GUERI", labelKey: "discharge.stateHealed" },
  { value: "AMELIORE", labelKey: "discharge.stateImproved" },
  { value: "STATIONNAIRE", labelKey: "discharge.stateStable" },
  { value: "TRANSFERE", labelKey: "discharge.stateTransferred" },
]

/**
 * Interface médecin : clôture officielle du dossier patient
 * (sortie médicale → envoi à l'archiviste).
 */
export default function PatientDossierCloture() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { path } = useRolePath()
  const { t, lang } = useI18n()
  const { roleKey } = useAuth()

  const numericId = useMemo(() => {
    if (!patientId) return null
    const raw = String(patientId).replace(/^PT-/i, "").trim()
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [patientId])

  const { data: patient, loading: patientLoading, error: patientError } = useAsync(
    () => (numericId ? patientService.getDossier(numericId) : Promise.resolve(null)),
    [numericId],
    { pollInterval: false, refetchOnFocus: false },
  )

  const [contexte, setContexte] = useState(null)
  const [loadingContext, setLoadingContext] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [diagnostic, setDiagnostic] = useState("")
  const [etatSortie, setEtatSortie] = useState("GUERI")
  const [recommandations, setRecommandations] = useState("")
  const [ordonnance, setOrdonnance] = useState("")
  const [observations, setObservations] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (roleKey !== ROLE_KEYS.DOCTOR) return
    if (!numericId) {
      setLoadingContext(false)
      setError(t("records.cloture.invalidPatient"))
      return
    }
    setLoadingContext(true)
    setError("")
    dischargeService
      .getContexte(numericId)
      .then(setContexte)
      .catch((e) => {
        setContexte(null)
        if (!e?.silent) setError(e?.message || t("discharge.loadError"))
      })
      .finally(() => setLoadingContext(false))
  }, [numericId, roleKey, t])

  if (roleKey !== ROLE_KEYS.DOCTOR) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("access.deniedBody")}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate(path("/records"))}>
          {t("records.cloture.backToRecords")}
        </Button>
      </Card>
    )
  }

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
        idPatient: numericId,
        idConsultation: contexte.idConsultationActive,
        idAdmission: contexte.idAdmissionActive,
        diagnosticFinal: diagnostic.trim(),
        etatSortie,
        recommandationsPostHospitalisation: recommandations.trim() || null,
        contenuOrdonnance: ordonnance.trim() || null,
        observationsOrdonnance: observations.trim() || null,
      })
      setDone(true)
      await MySwal.fire({
        icon: "success",
        title: t("discharge.successTitle"),
        text: result?.message || t("discharge.successText"),
        timer: 3500,
        showConfirmButton: false,
      })
    } catch (err) {
      if (!err?.silent) setError(err?.message || t("discharge.saveError"))
    } finally {
      setSaving(false)
    }
  }

  const name = patient?.name || contexte?.nomPatient || `Patient #${numericId || "—"}`
  const alreadyClosed =
    done ||
    patient?.statutClinique === "SORTI" ||
    patient?.statutClinique === "SORTIE_AUTORISEE"

  const showClosedPanel = alreadyClosed || (contexte && !contexte.peutAutoriser && !loadingContext)

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(path("/records"))}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("records.cloture.backToRecords")}
      </button>

      <PageHeader
        title={t("records.cloture.title")}
        subtitle={t("records.cloture.subtitle")}
        icon={ClipboardCheck}
      />

      {(patientLoading || loadingContext) && (
        <Card className="flex items-center justify-center gap-3 p-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("common.loading")}…
        </Card>
      )}

      {!patientLoading && patientError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {patientError.message || t("patients.detailNotFound")}
        </Card>
      )}

      {!patientLoading && !loadingContext && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-primary/80 to-sky-600/70" />
              <CardContent className="space-y-4 px-6 pb-6">
                <div className="flex items-end gap-4">
                  <Avatar name={name} className="-mt-10 h-20 w-20 border-4 border-card text-xl shadow-md" />
                  <div className="pb-1">
                    <h2 className="font-display text-xl font-bold text-foreground">{name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {patient?.codePatient || `PT-${numericId}`}
                      {patient?.age != null ? ` · ${patient.age} ${t("patients.years")}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {patient?.statutClinique && (
                    <Badge variant="outline">{patient.statutClinique}</Badge>
                  )}
                  {contexte?.typePriseEnCharge && (
                    <Badge variant="secondary">{contexte.typePriseEnCharge}</Badge>
                  )}
                </div>

                <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    {t("records.cloture.careContext")}
                  </p>
                  <p className="text-muted-foreground">
                    {contexte?.motifPriseEnCharge || t("records.cloture.noActiveCare")}
                  </p>
                  {contexte?.message && !contexte.peutAutoriser && (
                    <p className="text-amber-700 dark:text-amber-300">{contexte.message}</p>
                  )}
                </div>

                {(patient?.consultations || []).slice(0, 3).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("records.cloture.recentConsultations")}
                    </p>
                    <ul className="space-y-2">
                      {(patient.consultations || []).slice(0, 3).map((c) => (
                        <li
                          key={c.id}
                          className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
                        >
                          <p className="font-medium text-foreground">{c.diagnostic || c.motif || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.date ? formatDate(String(c.date).slice(0, 10), lang) : "—"}
                            {c.medecin ? ` · ${c.medecin}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  to={path(`/patients/${numericId}`)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <User className="h-4 w-4" />
                  {t("records.cloture.openFullDossier")}
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-primary" />
                  {t("discharge.authorizeTitle")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t("records.cloture.formHint")}</p>
              </CardHeader>
              <CardContent>
                {showClosedPanel ? (
                  <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                    <FileHeart className="mx-auto h-10 w-10 text-emerald-600" />
                    <p className="font-display text-lg font-semibold text-foreground">
                      {t("records.cloture.alreadyDoneTitle")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {contexte?.message || t("records.cloture.alreadyDoneBody")}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button variant="outline" onClick={() => navigate(path("/records"))}>
                        {t("records.cloture.backToRecords")}
                      </Button>
                      <Button onClick={() => navigate(path("/archives"))}>
                        {t("records.cloture.viewArchives")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("discharge.finalDiagnostic")}</label>
                      <textarea
                        className="min-h-[100px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                        value={diagnostic}
                        onChange={(e) => setDiagnostic(e.target.value)}
                        disabled={!contexte?.peutAutoriser || saving}
                        placeholder={t("discharge.diagnosticPlaceholder")}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("discharge.exitState")}</label>
                      <Select
                        value={etatSortie}
                        onValueChange={setEtatSortie}
                        disabled={!contexte?.peutAutoriser || saving}
                      >
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
                        className="min-h-[70px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                        value={recommandations}
                        onChange={(e) => setRecommandations(e.target.value)}
                        disabled={!contexte?.peutAutoriser || saving}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("discharge.prescription")}</label>
                      <textarea
                        className="min-h-[70px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
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

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(path("/records"))}
                        disabled={saving}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button type="submit" disabled={saving || loadingContext || !contexte?.peutAutoriser}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("common.saving")}
                          </>
                        ) : (
                          t("records.cloture.submit")
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
