import { useMemo, useState } from "react"
import { useRolePath } from "@/hooks/useRolePath"
import { motion } from "framer-motion"
import {
  Search,
  Plus,
  Download,
  ChevronRight,
  Users,
  UserCheck,
  BedDouble,
  Stethoscope,
  LayoutGrid,
  List,
  Phone,
  Mail,
  Droplets,
  Calendar,
  Loader2,
  UserX,
  Filter,
  FileBarChart2,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { PageHeader } from "@/components/PageHeader"
import {
  Card,
  Button,
  Badge,
  Avatar,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS } from "@/config/roles"
import { useAsync } from "@/hooks/useAsync"
import { patientService } from "@/services/api"
import { cn, formatDate } from "@/lib/utils"
import { exportPatientsToExcel } from "@/lib/exportPatientsExcel"
import NewPatientModal from "@/components/NewPatientModal"

const MySwal = withReactContent(Swal)

const ACTIVE_FILTERS = ["all", "active", "inactive"]
const CLINICAL_STATUS_FILTERS = ["all", "AMBULATOIRE", "ADMIS", "SORTIE_AUTORISEE", "SORTI"]
const CREATOR_FILTERS = ["all", "mine"]

const CLINICAL_STYLE = {
  AMBULATOIRE: {
    border: "border-l-primary",
    glow: "from-primary/10 via-transparent to-transparent",
    badge: "primary",
  },
  ADMIS: {
    border: "border-l-warning",
    glow: "from-warning/12 via-transparent to-transparent",
    badge: "warning",
  },
  SORTIE_AUTORISEE: {
    border: "border-l-accent",
    glow: "from-accent/10 via-transparent to-transparent",
    badge: "accent",
  },
  SORTI: {
    border: "border-l-muted-foreground/40",
    glow: "from-muted/20 via-transparent to-transparent",
    badge: "default",
  },
}

function buildContactUrgence(form) {
  if (!form.emergencyName && !form.emergencyPhone && !form.emergencyRelation) {
    return null
  }
  return JSON.stringify({
    nom: form.emergencyName || null,
    telephone: form.emergencyPhone || null,
    relation: form.emergencyRelation || null,
  })
}

function formatSexe(sexe, t) {
  if (sexe === "M") return t("patients.male")
  if (sexe === "F") return t("patients.female")
  return "—"
}

function formatDateTime(value, lang) {
  if (!value) return "—"
  const datePart = String(value).split("T")[0]
  const timePart = String(value).includes("T") ? String(value).split("T")[1]?.slice(0, 5) : null
  const formatted = formatDate(datePart, lang)
  return timePart ? `${formatted} ${timePart}` : formatted
}

function clinicalLabel(status, t) {
  const key = status || "AMBULATOIRE"
  return t(`patients.filters.clinical.${key}`, key)
}

function clinicalStyle(status) {
  return CLINICAL_STYLE[status] || CLINICAL_STYLE.AMBULATOIRE
}

function patientFullName(p) {
  return `${p.prenom || ""} ${p.nom || ""}`.trim() || p.name || "—"
}

function SummaryStat({ icon: Icon, label, value, tone = "primary", loading }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    secondary: "bg-secondary/12 text-secondary",
  }
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {loading ? "—" : value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all sm:text-sm",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function PatientCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse p-5">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </Card>
  )
}

function PatientCard({ patient, index, lang, t, onOpen, onViewReport, reportLoading }) {
  const style = clinicalStyle(patient.statutClinique)
  const name = patientFullName(patient)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Card
        className={cn(
          "group relative flex h-full flex-col overflow-hidden border-l-4 transition-all duration-200",
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
          style.border,
        )}
        onClick={onOpen}
      >
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70", style.glow)} />

        <div className="relative flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Avatar name={name} className="h-12 w-12 text-base" />
              <div className="min-w-0">
                <h3 className="font-display truncate text-base font-semibold text-foreground">{name}</h3>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {patient.codePatient || `#${patient.idPatient}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={patient.estActif ? "success" : "destructive"} className="text-[10px]">
                    {patient.estActif ? t("patients.active") : t("patients.inactive")}
                  </Badge>
                  <Badge variant={style.badge} className="text-[10px]">
                    {clinicalLabel(patient.statutClinique, t)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("patients.age")}</p>
              <p className="font-medium text-foreground">
                {patient.age != null ? `${patient.age} ${t("patients.years")}` : "—"}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  · {formatSexe(patient.sexe, t)}
                </span>
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("patients.bloodType")}</p>
              <p className="flex items-center gap-1 font-medium text-foreground">
                <Droplets className="h-3.5 w-3.5 text-destructive/80" />
                {patient.groupeSanguin || "—"}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3 text-sm">
            {patient.telephone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{patient.telephone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            {patient.dateEnregistrement && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {t("patients.registeredOn")} {formatDateTime(patient.dateEnregistrement, lang)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="relative border-t border-border/60 bg-muted/25 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="sm"
              variant="default"
              className="flex-1 justify-center gap-2 bg-primary hover:bg-primary/90"
              disabled={reportLoading}
              onClick={(e) => {
                e.stopPropagation()
                onViewReport()
              }}
            >
              {reportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart2 className="h-4 w-4" />
              )}
              {reportLoading ? t("patients.reportLoading") : t("patients.viewReport")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 justify-between group-hover:border-primary/40 group-hover:bg-primary/5"
              onClick={(e) => {
                e.stopPropagation()
                onOpen()
              }}
            >
              {t("patients.openDossier")}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function PatientsTable({ patients, lang, t, onOpen, onViewReport, reportLoadingId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3.5 font-semibold">{t("patients.exportCols.codePatient")}</th>
            <th className="px-4 py-3.5 font-semibold">{t("patients.patient")}</th>
            <th className="px-4 py-3.5 font-semibold">{t("patients.exportCols.sexe")}</th>
            <th className="px-4 py-3.5 font-semibold">{t("patients.exportCols.dateNaissance")}</th>
            <th className="px-4 py-3.5 font-semibold">{t("patients.contact")}</th>
            <th className="px-4 py-3.5 font-semibold">{t("patients.exportCols.groupeSanguin")}</th>
            <th className="px-4 py-3.5 font-semibold">{t("patients.exportCols.estActif")}</th>
            <th className="px-4 py-3.5 font-semibold">{t("patients.exportCols.statutClinique")}</th>
            <th className="px-4 py-3.5 font-semibold">{t("patients.exportCols.dateEnregistrement")}</th>
            <th className="px-4 py-3.5 font-semibold text-right">{t("patients.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p, i) => {
            const style = clinicalStyle(p.statutClinique)
            const name = patientFullName(p)
            const patientId = p._backendId ?? p.idPatient
            const isReportLoading = reportLoadingId === patientId
            return (
              <motion.tr
                key={p.idPatient ?? p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onOpen(p)}
                className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3.5 font-mono text-xs text-foreground">{p.codePatient || "—"}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={name} />
                    <div>
                      <p className="font-medium text-foreground">{name}</p>
                      {p.profession && (
                        <p className="text-xs text-muted-foreground">{p.profession}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{formatSexe(p.sexe, t)}</td>
                <td className="px-4 py-3.5 text-muted-foreground">
                  {p.dateNaissance ? (
                    <>
                      {formatDate(p.dateNaissance, lang)}
                      {p.age != null && (
                        <span className="ml-1 text-xs">({p.age} {t("patients.years")})</span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p>{p.telephone || "—"}</p>
                    <p className="truncate max-w-[180px]">{p.email || ""}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{p.groupeSanguin || "—"}</td>
                <td className="px-4 py-3.5">
                  <Badge variant={p.estActif ? "success" : "destructive"}>
                    {p.estActif ? t("patients.active") : t("patients.inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={style.badge}>{clinicalLabel(p.statutClinique, t)}</Badge>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">
                  {formatDateTime(p.dateEnregistrement, lang)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 gap-1.5 bg-primary px-2.5 text-xs hover:bg-primary/90"
                      disabled={isReportLoading}
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewReport(p)
                      }}
                    >
                      {isReportLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileBarChart2 className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden lg:inline">
                        {isReportLoading ? t("patients.reportLoading") : t("patients.viewReport")}
                      </span>
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ t, hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
        <UserX className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="font-display text-lg font-semibold text-foreground">{t("patients.noResults")}</p>
      {hasFilters && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
          {t("patients.clearFilters")}
        </Button>
      )}
    </div>
  )
}

export default function Patients() {
  const { t, lang } = useI18n()
  const { user, roleKey } = useAuth()
  const isReception = roleKey === ROLE_KEYS.RECEPTIONIST
  const isDoctor = roleKey === ROLE_KEYS.DOCTOR
  const { go } = useRolePath()
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [clinicalFilter, setClinicalFilter] = useState("all")
  const [creatorFilter, setCreatorFilter] = useState(isReception ? "all" : "all")
  const [viewMode, setViewMode] = useState(isDoctor ? "grid" : "table")
  const { data: patients, loading, reload } = useAsync(
    () => {
      if (user?.idHopital == null) return Promise.resolve([])
      return patientService.listAccessible(user.idHopital, {
        roleKey,
        // Médecin : toujours patients attribués. Réception : filtre "mine" optionnel.
        mine: isDoctor ? true : creatorFilter === "mine",
      })
    },
    [user?.idHopital, roleKey, creatorFilter, isDoctor],
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [listReportLoading, setListReportLoading] = useState(false)
  const [reportLoadingId, setReportLoadingId] = useState(null)

  const stats = useMemo(() => {
    const list = patients || []
    return {
      total: list.length,
      active: list.filter((p) => p.estActif).length,
      admitted: list.filter((p) => p.statutClinique === "ADMIS").length,
      outpatient: list.filter((p) => !p.statutClinique || p.statutClinique === "AMBULATOIRE").length,
    }
  }, [patients])

  const filtered = useMemo(() => {
    if (!patients) return []
    const q = query.toLowerCase()
    return patients.filter((p) => {
      const matchesQuery =
        !q ||
        p.nom?.toLowerCase().includes(q) ||
        p.prenom?.toLowerCase().includes(q) ||
        p.codePatient?.toLowerCase().includes(q) ||
        p.telephone?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.numeroMatricule?.toLowerCase().includes(q) ||
        String(p.idPatient).includes(q)

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && p.estActif) ||
        (activeFilter === "inactive" && !p.estActif)

      const matchesClinical =
        clinicalFilter === "all" || p.statutClinique === clinicalFilter

      return matchesQuery && matchesActive && matchesClinical
    })
  }, [patients, query, activeFilter, clinicalFilter])

  const hasActiveFilters =
    query.trim() !== "" ||
    activeFilter !== "all" ||
    clinicalFilter !== "all" ||
    (isReception && creatorFilter !== "all")

  const openPatient = (p) => go(`/patients/${p._backendId ?? p.idPatient}`)

  const handleViewReport = async (p) => {
    const patientId = p._backendId ?? p.idPatient
    if (!patientId || reportLoadingId != null) return
    setReportLoadingId(patientId)
    try {
      await patientService.downloadDossierPdf(patientId)
    } catch {
      await MySwal.fire({
        icon: "error",
        title: t("patients.reportErrorTitle"),
        text: t("patients.reportError"),
      })
    } finally {
      setReportLoadingId(null)
    }
  }

  const handleViewListReport = async () => {
    if (listReportLoading || user?.idHopital == null) return
    setListReportLoading(true)
    try {
      await patientService.downloadListReportPdf({
        mine: isDoctor ? true : creatorFilter === "mine",
      })
    } catch {
      await MySwal.fire({
        icon: "error",
        title: t("patients.listReportErrorTitle"),
        text: t("patients.listReportError"),
      })
    } finally {
      setListReportLoading(false)
    }
  }

  const clearFilters = () => {
    setQuery("")
    setActiveFilter("all")
    setClinicalFilter("all")
    setCreatorFilter("all")
  }

  const handleSavePatient = async (form) => {
    if (user?.idHopital == null) {
      throw new Error(t("patients.noHospital"))
    }

    setSaving(true)
    try {
      const created = await patientService.create({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        sexe: form.sexe,
        dateNaissance: form.dateNaissance,
        groupeSanguin: form.groupeSanguin || null,
        adresse: form.adresse.trim() || null,
        telephone: form.telephone.trim() || null,
        email: form.email.trim() || null,
        profession: form.profession.trim() || null,
        estActif: form.estActif,
        idSociete: form.idSociete ? Number(form.idSociete) : null,
        numeroMatricule: form.numeroMatricule.trim() || null,
        contactUrgence: buildContactUrgence(form),
      })

      setIsModalOpen(false)
      reload()

      const patientName = `${created.prenom || ""} ${created.nom || ""}`.trim()
      await MySwal.fire({
        icon: "success",
        title: t("patients.savePatient"),
        text: t("patients.createSuccess", {
          name: patientName,
          code: created.codePatient || "",
        }),
        timer: 2500,
        showConfirmButton: false,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExportExcel = async () => {
    if (user?.idHopital == null) {
      await MySwal.fire({
        icon: "warning",
        title: t("patients.exportEmptyTitle"),
        text: t("patients.noHospital"),
      })
      return
    }

    if (!filtered.length) {
      await MySwal.fire({
        icon: "warning",
        title: t("patients.exportEmptyTitle"),
        text: t("patients.exportEmpty"),
      })
      return
    }

    setExporting(true)
    try {
      const filterParts = [
        t(`patients.filters.active.${activeFilter}`),
        t(`patients.filters.clinical.${clinicalFilter}`),
      ]
      if (isReception || isDoctor) {
        filterParts.push(
          t(`patients.filters.creator.${isDoctor ? "assigned" : creatorFilter}`),
        )
      }
      if (query.trim()) {
        filterParts.push(`${t("common.search")}: "${query.trim()}"`)
      }

      const columnLabels = Object.fromEntries(
        [
          "codePatient",
          "nom",
          "prenom",
          "sexe",
          "age",
          "dateNaissance",
          "groupeSanguin",
          "telephone",
          "email",
          "profession",
          "adresse",
          "contactUrgence",
          "estActif",
          "statutClinique",
          "dateEnregistrement",
          "numeroMatricule",
          "idPatient",
        ].map((key) => [key, t(`patients.exportCols.${key}`)]),
      )

      const clinicalLabels = {
        AMBULATOIRE: t("patients.filters.clinical.AMBULATOIRE"),
        ADMIS: t("patients.filters.clinical.ADMIS"),
        SORTIE_AUTORISEE: t("patients.filters.clinical.SORTIE_AUTORISEE"),
        SORTI: t("patients.filters.clinical.SORTI"),
      }

      const { filename, count } = exportPatientsToExcel(filtered, {
        hopitalId: user.idHopital,
        hospitalName: user?.tenantLabel || t("patients.exportDefaultHospital"),
        exportedBy: user?.name || "",
        lang,
        sheetSubtitle: t("patients.exportSheetSubtitle"),
        platformName: "ShambuaSante",
        filterSummary: `${t("patients.exportFilterPrefix")} : ${filterParts.join(" · ")}`,
        columnLabels,
        clinicalLabels,
        summaryLabels: {
          title: t("patients.exportSummary.title"),
          active: t("patients.exportSummary.active"),
          inactive: t("patients.exportSummary.inactive"),
          ambulatoire: t("patients.exportSummary.ambulatoire"),
          admis: t("patients.exportSummary.admis"),
          sortieAutorisee: t("patients.exportSummary.sortieAutorisee"),
          sorti: t("patients.exportSummary.sorti"),
        },
      })
      await MySwal.fire({
        icon: "success",
        title: t("patients.exportSuccessTitle"),
        text: t("patients.exportSuccess", { count, filename }),
        timer: 2800,
        showConfirmButton: false,
      })
    } catch (err) {
      if (err?.message === "EMPTY") {
        await MySwal.fire({
          icon: "warning",
          title: t("patients.exportEmptyTitle"),
          text: t("patients.exportEmpty"),
        })
        return
      }
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("patients.exportError"),
      })
    } finally {
      setExporting(false)
    }
  }

  const pageSubtitle = isDoctor
    ? t("patients.subtitleDoctor")
    : user?.tenantLabel
      ? t("patients.subtitleTenant", { hospital: user.tenantLabel })
      : t("patients.subtitle")

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("patients.title")}
        subtitle={pageSubtitle}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={handleViewListReport}
              disabled={listReportLoading || loading}
            >
              {listReportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart2 className="h-4 w-4" />
              )}
              {listReportLoading ? t("patients.listReportLoading") : t("patients.listReport")}
            </Button>
            <Button variant="outline" size="md" onClick={handleExportExcel} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? t("patients.exporting") : t("common.export")}
            </Button>
            {!isDoctor && (
              <Button size="md" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("patients.addPatient")}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          icon={Users}
          label={t("patients.stats.total")}
          value={stats.total}
          tone="primary"
          loading={loading}
        />
        <SummaryStat
          icon={UserCheck}
          label={t("patients.stats.active")}
          value={stats.active}
          tone="success"
          loading={loading}
        />
        <SummaryStat
          icon={BedDouble}
          label={t("patients.stats.admitted")}
          value={stats.admitted}
          tone="warning"
          loading={loading}
        />
        <SummaryStat
          icon={Stethoscope}
          label={t("patients.stats.outpatient")}
          value={stats.outpatient}
          tone="secondary"
          loading={loading}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{isDoctor ? t("patients.myAssignedPatients") : t("patients.allPatients")}</CardTitle>
              <CardDescription className="mt-1">
                {loading
                  ? t("patients.loadingPatients")
                  : isDoctor
                    ? `${t("patients.assignedHint")} — ${t("patients.resultsCount", { count: filtered.length })}`
                    : t("patients.resultsCount", { count: filtered.length })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm",
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                {t("patients.viewGrid")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm",
                  viewMode === "table"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-4 w-4" />
                {t("patients.viewTable")}
              </button>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("patients.searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                {t("patients.exportCols.estActif")}
              </span>
              {ACTIVE_FILTERS.map((value) => (
                <FilterChip
                  key={value}
                  active={activeFilter === value}
                  onClick={() => setActiveFilter(value)}
                >
                  {t(`patients.filters.active.${value}`)}
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("patients.exportCols.statutClinique")}
              </span>
              {CLINICAL_STATUS_FILTERS.map((value) => (
                <FilterChip
                  key={value}
                  active={clinicalFilter === value}
                  onClick={() => setClinicalFilter(value)}
                >
                  {t(`patients.filters.clinical.${value}`)}
                </FilterChip>
              ))}
            </div>

            {isReception && (
              <div className="flex flex-wrap items-center gap-2">
                {CREATOR_FILTERS.map((value) => (
                  <FilterChip
                    key={value}
                    active={creatorFilter === value}
                    onClick={() => setCreatorFilter(value)}
                  >
                    {t(`patients.filters.creator.${value}`)}
                  </FilterChip>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="w-fit text-muted-foreground" onClick={clearFilters}>
                {t("patients.clearFilters")}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PatientCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("patients.loadingPatients")}
            </div>
          )
        ) : filtered.length === 0 ? (
          <EmptyState t={t} hasFilters={hasActiveFilters} onClear={clearFilters} />
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {filtered.map((p, i) => (
              <PatientCard
                key={p.idPatient ?? p.id}
                patient={p}
                index={i}
                lang={lang}
                t={t}
                onOpen={() => openPatient(p)}
                onViewReport={() => handleViewReport(p)}
                reportLoading={reportLoadingId === (p._backendId ?? p.idPatient)}
              />
            ))}
          </div>
        ) : (
          <PatientsTable
            patients={filtered}
            lang={lang}
            t={t}
            onOpen={openPatient}
            onViewReport={handleViewReport}
            reportLoadingId={reportLoadingId}
          />
        )}
      </Card>

      <NewPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatient}
        loading={saving}
      />
    </div>
  )
}
