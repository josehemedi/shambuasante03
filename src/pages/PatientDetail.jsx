import { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  FileText,
  CalendarDays,
  AlertCircle,
  User,
  Briefcase,
  Hash,
  Building2,
  LogOut,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { patientService } from "@/services/api"
import { formatDate } from "@/lib/utils"
import DischargeAuthorizationModal from "@/components/DischargeAuthorizationModal"

const MySwal = withReactContent(Swal)

const rdvStatusVariant = {
  PROGRAMME: "default",
  CONFIRME: "success",
  TERMINE: "secondary",
  ANNULE: "destructive",
  ABSENT: "warning",
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const { user, roleKey } = useAuth()
  const { data: patient, loading, error, reload } = useAsync(() => patientService.getDossier(id), [id])
  const [tab, setTab] = useState("overview")
  const [dischargeOpen, setDischargeOpen] = useState(false)

  const isDoctor = roleKey === "doctor"

  const tenantMismatch = useMemo(() => {
    if (!patient || user?.idHopital == null || patient.idHopital == null) return false
    return Number(patient.idHopital) !== Number(user.idHopital)
  }, [patient, user?.idHopital])

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">{t("common.loading")}…</div>
  }

  if (error || !patient || tenantMismatch) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{t("patients.detailNotFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-4 w-4" />
          {t("patients.backToList")}
        </Button>
      </div>
    )
  }

  const vitals = [
    { icon: Activity, label: t("patients.bloodPressure"), value: patient.vitals.bp, tone: "text-primary" },
    { icon: Heart, label: t("patients.heartRate"), value: patient.vitals.hr === "—" ? "—" : `${patient.vitals.hr} bpm`, tone: "text-destructive" },
    { icon: Thermometer, label: t("patients.temperature"), value: patient.vitals.temp, tone: "text-warning" },
    { icon: Droplets, label: t("patients.oxygen"), value: patient.vitals.o2, tone: "text-accent-foreground" },
  ]

  const tabs = [
    { key: "overview", label: t("patients.overview") },
    { key: "appointments", label: t("patients.appointments") },
    { key: "consultations", label: t("patients.consultationsTab") },
    { key: "antecedents", label: t("patients.antecedentsTab") },
  ]

  const infoRows = [
    { icon: Hash, label: t("patients.id"), value: patient.codePatient || patient.id },
    { icon: User, label: t("patients.birthDate"), value: patient.dateNaissance ? formatDate(patient.dateNaissance, lang) : "—" },
    { icon: Briefcase, label: t("patients.profession"), value: patient.profession || "—" },
    { icon: Building2, label: t("patients.companyId"), value: patient.idSociete ?? "—" },
    { icon: Hash, label: t("patients.employeeId"), value: patient.numeroMatricule || "—" },
    { icon: CalendarDays, label: t("patients.registrationDate"), value: patient.dateEnregistrement ? formatDate(String(patient.dateEnregistrement).split("T")[0], lang) : "—" },
  ]

  return (
    <div>
      <button
        onClick={() => navigate("/patients")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("patients.backToList")}
      </button>

      <Card className="mb-4 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-accent/70" />
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar name={patient.name} className="-mt-10 h-24 w-24 border-4 border-card text-2xl shadow-md" />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-foreground">{patient.name}</h1>
                  <Badge variant={patient.estActif ? "success" : "secondary"}>
                    {patient.estActif ? t("patients.active") : t("patients.inactive")}
                  </Badge>
                  {patient.statutClinique && patient.statutClinique !== "AMBULATOIRE" && (
                    <Badge variant="outline">{patient.statutClinique}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {patient.codePatient || patient.id} · {patient.age} {t("patients.years")} · {t(`patients.${patient.gender}`)}
                </p>
              </div>
            </div>
            {isDoctor && patient.statutClinique !== "SORTI" && patient.statutClinique !== "SORTIE_AUTORISEE" && (
              <Button onClick={() => setDischargeOpen(true)}>
                <LogOut className="h-4 w-4" />
                {t("discharge.authorizeButton")}
              </Button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {patient.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {patient.phone}
              </span>
            )}
            {patient.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {patient.email}
              </span>
            )}
            {patient.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {patient.address}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {vitals.map((v, i) => (
          <motion.div key={v.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-4">
              <v.icon className={`h-5 w-5 ${v.tone}`} />
              <p className="mt-2 font-display text-lg font-bold text-foreground">{v.value}</p>
              <p className="text-xs text-muted-foreground">{v.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === tb.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === tb.key && <motion.span layoutId="patient-tab" className="absolute inset-0 rounded-lg bg-primary/10" />}
            <span className="relative">{tb.label}</span>
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("patients.personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <row.icon className="h-4 w-4" />
                    {row.label}
                  </span>
                  <span className="text-sm font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs text-muted-foreground">{t("patients.bloodType")}</p>
                  <p className="font-display text-2xl font-bold text-destructive">{patient.bloodType}</p>
                </div>
                <Droplets className="h-9 w-9 text-destructive/40" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  {t("patients.allergies")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {patient.allergies.length > 0 ? (
                  patient.allergies.map((a) => (
                    <Badge key={a} variant="warning">
                      {a}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("patients.noAllergies")}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("patients.familyContacts")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.contacts.length > 0 ? (
                  patient.contacts.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <Avatar name={c.name} className="h-9 w-9" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === "fr" ? c.relationFr : c.relation} · {c.phone}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("patients.noEmergencyContact")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {t("patients.appointments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.rendezVous.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("patients.noAppointments")}</p>
            ) : (
              <div className="space-y-3">
                {patient.rendezVous.map((rdv) => (
                  <div key={rdv.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{rdv.motif}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(String(rdv.date).replace(" ", "T"), lang)} · {rdv.medecin}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={rdvStatusVariant[rdv.statut] || "default"}>{rdv.statut}</Badge>
                        <Badge variant="outline">{rdv.canal}</Badge>
                      </div>
                    </div>
                    {rdv.urlVisio && (
                      <p className="mt-2 truncate text-xs text-primary">{rdv.urlVisio}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "consultations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t("patients.consultationsTab")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.consultations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("patients.noConsultations")}</p>
            ) : (
              <ol className="relative space-y-6 border-l border-border pl-6">
                {patient.consultations.map((c, i) => (
                  <motion.li
                    key={c.id ?? i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative"
                  >
                    <span className="absolute -left-[1.72rem] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-primary" />
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{c.motif}</p>
                        <span className="text-xs text-muted-foreground">{c.date}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.medecin}</p>
                      {c.diagnostic && c.diagnostic !== "—" && (
                        <p className="mt-2 text-sm text-foreground">
                          <span className="font-medium">{t("patients.diagnostic")}:</span> {c.diagnostic}
                        </p>
                      )}
                      {c.observations && (
                        <p className="mt-1 text-sm text-muted-foreground">{c.observations}</p>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "antecedents" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("patients.antecedentsTab")}</CardTitle>
          </CardHeader>
          <CardContent>
            {patient.antecedents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("patients.noAntecedents")}</p>
            ) : (
              <div className="space-y-3">
                {patient.antecedents.map((a) => (
                  <div key={a.id ?? a.libelle} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{a.libelle}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{a.type}</Badge>
                        {a.critique && <Badge variant="destructive">{t("patients.critical")}</Badge>}
                      </div>
                    </div>
                    {a.description && <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>}
                    {a.date && (
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(String(a.date), lang)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <DischargeAuthorizationModal
        isOpen={dischargeOpen}
        onClose={() => setDischargeOpen(false)}
        patientId={patient._backendId || id}
        patientName={patient.name}
        onSuccess={async (result) => {
          await reload()
          await MySwal.fire({
            icon: "success",
            title: t("discharge.successTitle"),
            text: result?.message || t("discharge.successText"),
            timer: 4000,
            showConfirmButton: false,
          })
        }}
      />
    </div>
  )
}
