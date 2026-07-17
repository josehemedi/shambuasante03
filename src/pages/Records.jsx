import { useMemo, useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Search,
  Download,
  FileText,
  Microscope,
  HeartPulse,
  Brain,
  AlertCircle,
  Stethoscope,
  Calendar,
  User,
  Shield,
  ChevronRight,
  FileHeart,
  Activity,
  ClipboardList,
  Loader2,
  FileBarChart2,
  Users,
  FileCheck2,
  LayoutGrid,
  List,
  Pill,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Avatar,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/primitives"
import RecordDetailModal from "@/components/RecordDetailModal"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS } from "@/config/roles"
import { useAsync } from "@/hooks/useAsync"
import { useRolePath } from "@/hooks/useRolePath"
import { useNotifications } from "@/auth/NotificationProvider"
import { patientPortalService, consultationService } from "@/services/api"
import { cn, formatDate, formatDateTime } from "@/lib/utils"
import { exportRecordsToExcel } from "@/lib/exportRecordsExcel"
import { useTenantScope } from "@/hooks/useTenantScope"
import { TenantScopeBar } from "@/components/TenantScopeBar"
import PatientRecordsVault from "@/components/PatientRecordsVault"

const MySwal = withReactContent(Swal)

const mockRecords = [
  {
    id: "REC-001",
    kind: "mock",
    patientName: "Amara Diallo",
    patientId: "PT-10293",
    recordType: "Consultation Note",
    date: "2026-07-05",
    doctor: "Dr. Kwame Mensah",
    department: "Cardiology",
    icon: HeartPulse,
  },
  {
    id: "REC-002",
    kind: "mock",
    patientName: "Tunde Bakare",
    patientId: "PT-10296",
    recordType: "Lab Result",
    date: "2026-07-03",
    doctor: "Dr. Ngozi Achebe",
    department: "Oncology",
    icon: Microscope,
  },
  {
    id: "REC-003",
    kind: "mock",
    patientName: "Naledi Khumalo",
    patientId: "PT-10297",
    recordType: "Prescription",
    date: "2026-06-28",
    doctor: "Dr. Aïcha Bello",
    department: "Neurology",
    icon: FileText,
  },
  {
    id: "REC-004",
    kind: "mock",
    patientName: "Ibrahim Cissé",
    patientId: "PT-10298",
    recordType: "Imaging Report",
    date: "2026-06-25",
    doctor: "Dr. Kwame Mensah",
    department: "Radiology",
    icon: Brain,
  },
]

const recordTypes = ["All", "Consultation Note", "Lab Result", "Prescription", "Imaging Report", "Medical History"]
const departments = ["All", "Cardiology", "Oncology", "Neurology", "Radiology", "General"]

const KIND_STYLE = {
  consultation: {
    iconBg: "bg-primary/15 text-primary",
    border: "border-l-primary",
    badge: "primary",
    glow: "from-primary/8 via-transparent to-transparent",
  },
  antecedent: {
    iconBg: "bg-accent/20 text-accent-foreground",
    border: "border-l-accent",
    badge: "secondary",
    glow: "from-accent/10 via-transparent to-transparent",
  },
  mock: {
    iconBg: "bg-secondary/15 text-secondary",
    border: "border-l-secondary",
    badge: "secondary",
    glow: "from-secondary/8 via-transparent to-transparent",
  },
}

function mapAntecedentIcon(type) {
  const normalized = (type || "").toLowerCase()
  if (normalized.includes("allerg")) return AlertCircle
  if (normalized.includes("chirurg") || normalized.includes("oper")) return HeartPulse
  return ClipboardList
}

function consultationsToDoctorRecords(consultations, t) {
  return (consultations || [])
    .map((c) => {
      const id = c.idConsultation ?? c.id
      const dateValue = c.dateConsultation || c.date || null
      const medecinName = (c.nomMedecin || c.medecin || "").trim() || "—"
      const patientName = (c.nomPatient || "").trim() || "—"
      const idPatient = c.idPatient != null ? Number(c.idPatient) : null
      const patientId = idPatient != null ? `PT-${idPatient}` : "—"
      const isSigned = (c.statut || "").toUpperCase() === "SIGNEE"
      const detail = {
        id,
        date: dateValue,
        dateConsultation: dateValue,
        motif: c.motifVisite || c.motif || "—",
        diagnostic: c.diagnostic || "—",
        observations: c.observations || "",
        medecin: medecinName,
        nomMedecin: medecinName,
        nomHopital: c.nomHopital || null,
        tension: c.tensionArterielle,
        frequence: c.frequenceCardiaque,
        temperature: c.temperature,
        poids: c.poids,
        taille: c.taille,
        statut: c.statut,
        dateSignature: c.dateSignature,
        referenceSignature: c.referenceSignature,
        hashAbrege: c.hashAbrege,
      }
      return {
        id: `CONS-${id}`,
        kind: "consultation",
        patientName,
        patientId,
        idPatient,
        recordType: t("records.types.consultation"),
        date: dateValue,
        doctor: medecinName,
        department: t("records.types.consultation"),
        summary: detail.diagnostic !== "—" ? detail.diagnostic : detail.motif || detail.observations || "",
        motif: detail.motif,
        isSigned,
        icon: Stethoscope,
        detail,
      }
    })
    .sort((a, b) => {
      const da = a.date ? new Date(String(a.date).replace(" ", "T")).getTime() : 0
      const db = b.date ? new Date(String(b.date).replace(" ", "T")).getTime() : 0
      return db - da
    })
}

function dossierToRecords(dossier, t) {
  if (!dossier) return []

  const patientName = [dossier.prenom, dossier.nom].filter(Boolean).join(" ") || "—"
  const patientId = dossier.codePatient || (dossier.id != null ? `PT-${dossier.id}` : "—")
  const records = []

  for (const c of dossier.consultations || []) {
    records.push({
      id: `CONS-${c.id}`,
      kind: "consultation",
      patientName,
      patientId,
      recordType: t("records.types.consultation"),
      date: c.date,
      doctor: c.medecin || "—",
      department: t("records.types.consultation"),
      summary: c.diagnostic || c.motif || c.observations || "",
      icon: Stethoscope,
      detail: { ...c },
    })
  }

  for (const a of dossier.antecedents || []) {
    records.push({
      id: `ANT-${a.id}`,
      kind: "antecedent",
      patientName,
      patientId,
      recordType: t("records.types.history"),
      date: a.date,
      doctor: "—",
      department: a.type || "—",
      summary: a.libelle || a.description || "",
      icon: mapAntecedentIcon(a.type),
      detail: { ...a },
      isCritical: Boolean(a.critique),
    })
  }

  for (const o of dossier.ordonnances || []) {
    const numero = o.numeroOrdonnance || `ORD-${o.id}`
    records.push({
      id: `ORD-${o.id}`,
      kind: "ordonnance",
      patientName,
      patientId,
      recordType: t("records.types.ordonnance"),
      date: o.date,
      doctor: "—",
      department: t("records.types.ordonnance"),
      summary: o.diagnostic || o.contenu || numero,
      icon: Pill,
      detail: { ...o },
      idOrdonnance: o.id,
      numeroOrdonnance: numero,
      statut: o.statut,
    })
  }

  return records.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0
    const db = b.date ? new Date(b.date).getTime() : 0
    return db - da
  })
}

function parseRecordDate(value) {
  if (!value) return null
  const normalized = String(value).includes(" ") && !String(value).includes("T")
    ? String(value).replace(" ", "T")
    : value
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function SummaryStat({ icon: Icon, label, value, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    secondary: "bg-secondary/15 text-secondary",
  }
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
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
        "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function RecordCard({ rec, isPatient, onSelect, onCloture, t, locale, index = 0 }) {
  const style = KIND_STYLE[rec.kind] || KIND_STYLE.mock
  const Icon = rec.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card
        className={cn(
          "group relative flex flex-col overflow-hidden border-l-4 transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
          style.border,
        )}
      >
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60", style.glow)} />

        <div className="relative flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn("rounded-xl p-2.5", style.iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <Badge variant={style.badge} className="mb-2 text-[10px] uppercase tracking-wide">
                  {rec.recordType}
                </Badge>
                <h3 className="font-display text-base font-semibold leading-snug text-foreground">
                  {rec.summary
                    ? rec.summary.length > 52
                      ? `${rec.summary.slice(0, 52)}…`
                      : rec.summary
                    : rec.recordType}
                </h3>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{rec.id}</p>
              </div>
            </div>
            <div className="shrink-0 rounded-lg bg-muted/60 px-2 py-1 text-center">
              <Calendar className="mx-auto mb-0.5 h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium leading-tight text-muted-foreground">
                {formatDate(rec.date, locale, { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-border/50 pt-4 text-sm">
            {!isPatient && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {rec.patientName}{" "}
                  <span className="text-xs opacity-70">({rec.patientId})</span>
                </span>
              </div>
            )}
            {rec.doctor !== "—" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate font-medium text-foreground">{rec.doctor}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDateTime(rec.date, locale)}</span>
            </div>
            {rec.isCritical && (
              <Badge variant="destructive" className="mt-1">
                {t("records.detail.critical")}
              </Badge>
            )}
          </div>
        </div>

        <div className="relative border-t border-border/60 bg-muted/30 p-3">
          <Button
            size="sm"
            variant={onCloture ? "default" : "outline"}
            className="w-full justify-between group-hover:border-primary/40 group-hover:bg-primary/5"
            onClick={() => (onCloture ? onCloture(rec) : onSelect(rec))}
          >
            {onCloture ? t("records.cloture.openAction") : t("records.viewDetails")}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          {onCloture && (
            <Button size="sm" variant="ghost" className="mt-1.5 w-full" onClick={() => onSelect(rec)}>
              {t("records.viewDetails")}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function DoctorRecordRow({ rec, onSelect, onCloture, t, locale, index }) {
  const parsed = parseRecordDate(rec.date)
  const day = parsed ? formatDate(parsed, locale, { day: "2-digit" }) : "—"
  const month = parsed ? formatDate(parsed, locale, { month: "short" }) : ""
  const year = parsed ? formatDate(parsed, locale, { year: "numeric" }) : ""

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.03 }}
      className="group"
    >
      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 transition-all duration-200",
          "hover:border-primary/30 hover:bg-muted/20 hover:shadow-md hover:shadow-primary/5",
          "lg:flex-row lg:items-center",
        )}
      >
        <div className="flex w-full shrink-0 items-center gap-4 lg:w-28 lg:flex-col lg:items-center lg:justify-center lg:rounded-xl lg:bg-primary/8 lg:py-3">
          <div className="text-center">
            <p className="font-display text-2xl font-bold leading-none text-primary">{day}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{month}</p>
            <p className="text-[10px] text-muted-foreground/80">{year}</p>
          </div>
          <div className="hidden h-px w-full bg-border/60 lg:block" />
          <p className="hidden text-[10px] font-medium text-muted-foreground lg:block">
            {formatDateTime(rec.date, locale)}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-4">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-4 text-left"
            onClick={() => (onCloture ? onCloture(rec) : onSelect(rec))}
          >
          <Avatar name={rec.patientName} className="h-12 w-12 shrink-0 ring-2 ring-primary/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold text-foreground">{rec.patientName}</h3>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {rec.patientId}
              </span>
              {rec.isSigned && (
                <Badge variant="success" className="gap-1">
                  <FileCheck2 className="h-3 w-3" />
                  {t("records.signedBadge")}
                </Badge>
              )}
              <Badge variant="primary">{rec.recordType}</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("records.motifLabel")}
                </p>
                <p className="mt-0.5 truncate text-sm text-foreground">{rec.motif || rec.detail?.motif || "—"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("records.diagnosticLabel")}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {rec.summary || rec.detail?.diagnostic || "—"}
                </p>
              </div>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">{rec.id}</p>
          </div>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-stretch">
          <Button
            size="sm"
            className="w-full gap-1.5 shadow-sm"
            onClick={() => (onCloture ? onCloture(rec) : onSelect(rec))}
          >
            {onCloture ? t("records.cloture.openAction") : t("records.viewDetails")}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          {onCloture && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => onSelect(rec)}>
              {t("records.viewDetails")}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function RecordsSkeleton({ count = 4, list = false }) {
  if (list) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted/40" />
      ))}
    </div>
  )
}

export default function Records() {
  const { t, locale, lang } = useI18n()
  const { roleKey, user } = useAuth()
  const { go, path } = useRolePath()
  const { scopedSubtitle, hasTenant, hospitalName } = useTenantScope()
  const isPatient = roleKey === ROLE_KEYS.PATIENT
  const isDoctor = roleKey === ROLE_KEYS.DOCTOR

  const { data: dossier, loading: patientLoading, error: patientError, reload: reloadDossier } = useAsync(
    () => (isPatient ? patientPortalService.getDossier() : Promise.resolve(null)),
    [isPatient],
    isPatient ? { pollInterval: 12_000 } : { pollInterval: false },
  )

  const { notifications } = useNotifications()
  const lastOrdonnanceNotifId = useRef(null)

  useEffect(() => {
    if (!isPatient) return
    const latest = (notifications || []).find((n) => n.type === "ORDONNANCE_ENVOYEE")
    if (!latest || latest.id === lastOrdonnanceNotifId.current) return
    lastOrdonnanceNotifId.current = latest.id
    reloadDossier()
  }, [isPatient, notifications, reloadDossier])

  const { data: medecinConsultations, loading: doctorLoading, error: doctorError } = useAsync(
    () => (isDoctor ? consultationService.getMedecinHistorique() : Promise.resolve([])),
    [isDoctor],
  )

  const loading = isPatient ? patientLoading : isDoctor ? doctorLoading : false
  const error = isPatient ? patientError : isDoctor ? doctorError : null

  const [query, setQuery] = useState("")
  const [recordType, setRecordType] = useState("All")
  const [department, setDepartment] = useState("All")
  const [kindFilter, setKindFilter] = useState("all")
  const [doctorSignedFilter, setDoctorSignedFilter] = useState(false)
  const [doctorViewMode, setDoctorViewMode] = useState("list")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [exporting, setExporting] = useState(false)

  const openCloture = (rec) => {
    const id = rec?.idPatient
    if (id == null) {
      MySwal.fire({
        icon: "warning",
        title: t("records.cloture.invalidPatient"),
        timer: 2200,
        showConfirmButton: false,
      })
      return
    }
    go(`/records/${id}/cloture`)
  }

  const handleOpenDossierPdf = async () => {
    if (!isPatient || pdfLoading) return
    setPdfError(null)
    setPdfLoading(true)
    try {
      await patientPortalService.downloadDossierPdf()
    } catch {
      setPdfError(t("records.pdfError"))
    } finally {
      setPdfLoading(false)
    }
  }

  const sourceRecords = useMemo(() => {
    if (isPatient) return dossierToRecords(dossier, t)
    if (isDoctor) return consultationsToDoctorRecords(medecinConsultations, t)
    return mockRecords
  }, [isPatient, isDoctor, dossier, medecinConsultations, t])

  const stats = useMemo(() => {
    const consultations = sourceRecords.filter((r) => r.kind === "consultation").length
    const history = sourceRecords.filter((r) => r.kind === "antecedent").length
    const signed = sourceRecords.filter((r) => r.isSigned).length
    const uniquePatients = new Set(
      sourceRecords.map((r) => r.patientId).filter((id) => id && id !== "—"),
    ).size
    return { total: sourceRecords.length, consultations, history, signed, uniquePatients }
  }, [sourceRecords])

  const filteredRecords = useMemo(() => {
    return sourceRecords.filter((rec) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        rec.patientName.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q) ||
        (rec.summary || "").toLowerCase().includes(q) ||
        (rec.motif || "").toLowerCase().includes(q) ||
        (rec.doctor || "").toLowerCase().includes(q)
      const matchesRecordType = recordType === "All" || rec.recordType === recordType
      const matchesDepartment = department === "All" || rec.department === department
      const matchesKind =
        kindFilter === "all" ||
        (kindFilter === "consultation" && rec.kind === "consultation") ||
        (kindFilter === "history" && rec.kind === "antecedent")
      const matchesSigned = !isDoctor || !doctorSignedFilter || rec.isSigned
      return matchesQuery && matchesRecordType && matchesDepartment && matchesKind && matchesSigned
    })
  }, [sourceRecords, query, recordType, department, kindFilter, isDoctor, doctorSignedFilter])

  const patientDisplayName = isPatient
    ? [dossier?.prenom, dossier?.nom].filter(Boolean).join(" ") || user?.name
    : null

  const handleExportExcel = async () => {
    if (!filteredRecords.length) {
      await MySwal.fire({
        icon: "warning",
        title: t("records.exportEmptyTitle"),
        text: t("records.exportEmpty"),
      })
      return
    }

    setExporting(true)
    try {
      const filterParts = []
      if (query.trim()) {
        filterParts.push(`${t("common.search")}: "${query.trim()}"`)
      }
      if (isPatient) {
        if (kindFilter !== "all") {
          filterParts.push(
            kindFilter === "consultation"
              ? t("records.filterConsultation")
              : t("records.filterHistory"),
          )
        }
      } else if (isDoctor) {
        if (doctorSignedFilter) filterParts.push(t("records.filterSigned"))
      } else {
        if (recordType !== "All") filterParts.push(recordType)
        if (department !== "All") filterParts.push(department)
      }

      const columnLabels = Object.fromEntries(
        [
          "id",
          "recordType",
          "kind",
          "patientName",
          "patientId",
          "date",
          "doctor",
          "department",
          "summary",
          "motif",
          "diagnostic",
          "observations",
          "critical",
        ].map((key) => [key, t(`records.exportCols.${key}`)]),
      )

      const kindLabels = {
        consultation: t("records.exportKind.consultation"),
        antecedent: t("records.exportKind.antecedent"),
        mock: t("records.exportKind.mock"),
      }

      const { filename, count } = exportRecordsToExcel(filteredRecords, {
        hospitalName: user?.tenantLabel || t("records.exportDefaultHospital"),
        exportedBy: user?.name || "",
        lang,
        hopitalId: user?.idHopital ?? null,
        sheetSubtitle: t("records.exportSheetSubtitle"),
        platformName: "ShambuaSante",
        filterSummary: filterParts.length
          ? `${t("records.exportFilterPrefix")} : ${filterParts.join(" · ")}`
          : "",
        columnLabels,
        kindLabels,
        summaryLabels: {
          title: t("records.exportSummary.title"),
          consultations: t("records.exportSummary.consultations"),
          history: t("records.exportSummary.history"),
          critical: t("records.exportSummary.critical"),
        },
      })

      await MySwal.fire({
        icon: "success",
        title: t("records.exportSuccessTitle"),
        text: t("records.exportSuccess", { count, filename }),
        timer: 2800,
        showConfirmButton: false,
      })
    } catch (err) {
      if (err?.message === "EMPTY") {
        await MySwal.fire({
          icon: "warning",
          title: t("records.exportEmptyTitle"),
          text: t("records.exportEmpty"),
        })
        return
      }
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("records.exportError"),
      })
    } finally {
      setExporting(false)
    }
  }

  const emptyMessage = () => {
    if (query || kindFilter !== "all" || doctorSignedFilter) return t("records.emptySearch")
    if (isDoctor) return t("records.emptyDoctor")
    return t("records.emptyPatient")
  }

  if (isPatient) {
    return (
      <PatientRecordsVault
        t={t}
        locale={locale}
        user={user}
        dossier={dossier}
        loading={loading}
        error={error}
        records={sourceRecords}
        patientDisplayName={patientDisplayName}
        onDownloadPdf={handleOpenDossierPdf}
        pdfLoading={pdfLoading}
        pdfError={pdfError}
      />
    )
  }

  return (
    <div className="space-y-6">
      {isDoctor ? (
        <>
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary via-primary to-secondary p-6 text-primary-foreground shadow-lg shadow-primary/20 lg:p-8"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-3">
                <Badge className="border-white/20 bg-white/15 text-primary-foreground backdrop-blur-sm">
                  <FileHeart className="h-3 w-3" />
                  {t("records.doctorBadge")}
                </Badge>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
                    {t("nav.records")}
                  </h1>
                  <p className="mt-1.5 max-w-2xl text-sm text-primary-foreground/85">
                    {hasTenant
                      ? scopedSubtitle("records.subtitleDoctorTenant")
                      : t("records.subtitleStaff")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                    <Shield className="h-3.5 w-3.5" />
                    {user?.tenantLabel || t("records.exportDefaultHospital")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {user?.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link to={path("/doctor-workspace")}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20"
                  >
                    {t("docDash.openWorkspace")}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="bg-white text-primary shadow-md hover:bg-white/95"
                  disabled={exporting || loading}
                  onClick={handleExportExcel}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exporting ? t("records.exporting") : t("common.export")}
                </Button>
              </div>
            </div>
          </motion.section>

          <TenantScopeBar />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard index={0} hideDelta label={t("records.statTotal")} value={loading ? 0 : stats.total} icon={FileHeart} tone="primary" />
            <StatCard index={1} hideDelta label={t("records.statPatients")} value={loading ? 0 : stats.uniquePatients} icon={Users} tone="accent" />
            <StatCard index={2} hideDelta label={t("records.statConsultations")} value={loading ? 0 : stats.consultations} icon={Stethoscope} tone="secondary" />
            <StatCard index={3} hideDelta label={t("records.statSigned")} value={loading ? 0 : stats.signed} icon={FileCheck2} tone="warning" />
          </div>
        </>
      ) : (
        <PageHeader
          title={t("nav.records")}
          subtitle={isPatient ? t("records.subtitlePatient") : t("records.subtitleStaff")}
          actions={
            isPatient ? (
              <Button variant="outline" className="gap-2" onClick={handleOpenDossierPdf} disabled={pdfLoading || loading}>
                {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t("records.openDossierPdf")}
              </Button>
            ) : (
              <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={exporting || loading}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? t("records.exporting") : t("common.export")}
              </Button>
            )
          }
        />
      )}

      {isPatient && dossier && !loading && (
        <Card
          className="cursor-pointer overflow-hidden border-primary/20 bg-gradient-to-r from-primary/8 via-card to-card transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-primary/10"
          onClick={handleOpenDossierPdf}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleOpenDossierPdf()
            }
          }}
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={patientDisplayName} className="h-14 w-14 text-base" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  {t("records.myDossier")}
                </p>
                <h2 className="font-display text-xl font-bold text-foreground">{patientDisplayName}</h2>
                <p className="text-sm text-muted-foreground">
                  {dossier.codePatient || (dossier.id != null ? `PT-${dossier.id}` : "—")}
                  {user?.tenantLabel ? ` · ${user.tenantLabel}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                {t("records.secured")}
              </div>
              <Button
                size="sm"
                className="gap-2"
                disabled={pdfLoading}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenDossierPdf()
                }}
              >
                {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBarChart2 className="h-4 w-4" />}
                {t("records.openDossierPdf")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {pdfError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{pdfError}</Card>
      )}

      {isPatient && !loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryStat icon={FileHeart} label={t("records.statTotal")} value={stats.total} tone="primary" />
          <SummaryStat icon={Stethoscope} label={t("records.statConsultations")} value={stats.consultations} tone="accent" />
          <SummaryStat icon={ClipboardList} label={t("records.statHistory")} value={stats.history} tone="secondary" />
        </div>
      )}

      {((isPatient || isDoctor) && error) && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error?.message || t("records.loadError")}
        </Card>
      )}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">
                {isDoctor ? t("records.registryTitle") : t("common.filter")}
              </CardTitle>
              <CardDescription className="mt-1">
                {filteredRecords.length} / {sourceRecords.length}
              </CardDescription>
            </div>
            {isDoctor && (
              <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-background p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={doctorViewMode === "list" ? "primary" : "ghost"}
                  className="h-8 px-3"
                  onClick={() => setDoctorViewMode("list")}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={doctorViewMode === "grid" ? "primary" : "ghost"}
                  className="h-8 px-3"
                  onClick={() => setDoctorViewMode("grid")}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <Input
            icon={Search}
            type="text"
            placeholder={isPatient ? t("records.searchPlaceholder") : t("records.searchPlaceholderStaff")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {isPatient ? (
            <div className="flex flex-wrap gap-2">
              <FilterChip active={kindFilter === "all"} onClick={() => setKindFilter("all")}>
                {t("records.filterAll")}
              </FilterChip>
              <FilterChip active={kindFilter === "consultation"} onClick={() => setKindFilter("consultation")}>
                {t("records.filterConsultation")}
              </FilterChip>
              <FilterChip active={kindFilter === "history"} onClick={() => setKindFilter("history")}>
                {t("records.filterHistory")}
              </FilterChip>
            </div>
          ) : isDoctor ? (
            <div className="flex flex-wrap gap-2">
              <FilterChip active={!doctorSignedFilter} onClick={() => setDoctorSignedFilter(false)}>
                {t("records.filterAll")}
              </FilterChip>
              <FilterChip active={doctorSignedFilter} onClick={() => setDoctorSignedFilter(true)}>
                {t("records.filterSigned")}
              </FilterChip>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                items={recordTypes.map((r) => ({ value: r, label: r }))}
              />
              <Select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                items={departments.map((d) => ({ value: d, label: d }))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {(isPatient || isDoctor) && loading ? (
        <RecordsSkeleton list={isDoctor && doctorViewMode === "list"} />
      ) : filteredRecords.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 border-dashed py-16 text-center">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-5">
            <FileHeart className="h-10 w-10 text-primary/70" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-foreground">{emptyMessage()}</p>
            {isDoctor && !query && !doctorSignedFilter && (
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("records.subtitleStaff")}</p>
            )}
          </div>
          {isDoctor && (
            <Link to={path("/doctor-workspace")}>
              <Button variant="outline" className="gap-2">
                <Stethoscope className="h-4 w-4" />
                {t("docDash.openWorkspace")}
              </Button>
            </Link>
          )}
        </Card>
      ) : isDoctor && doctorViewMode === "list" ? (
        <div className="space-y-3">
          {filteredRecords.map((rec, index) => (
            <DoctorRecordRow
              key={rec.id}
              rec={rec}
              onSelect={setSelectedRecord}
              onCloture={isDoctor ? openCloture : undefined}
              t={t}
              locale={locale}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRecords.map((rec, index) => (
            <RecordCard
              key={rec.id}
              rec={rec}
              isPatient={isPatient}
              onSelect={setSelectedRecord}
              onCloture={isDoctor ? openCloture : undefined}
              t={t}
              locale={locale}
              index={index}
            />
          ))}
        </div>
      )}

      <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  )
}
