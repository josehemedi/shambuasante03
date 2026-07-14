import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Search,
  Plus,
  MapPin,
  Video,
  CalendarDays,
  Clock,
  ChevronRight,
  CalendarCheck,
  CalendarClock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Loader2,
  Stethoscope,
  Filter,
  UserX,
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
import { doctorService, patientPortalService, receptionService } from "@/services/api"
import { cn, formatDate, formatDateTime } from "@/lib/utils"
import AppointmentDrawer from "@/components/AppointmentDrawer"
import NewAppointmentModal from "@/components/NewAppointmentModal"
import PatientAppointmentsView from "@/components/PatientAppointmentsView"

const MySwal = withReactContent(Swal)

const STATUS_FILTERS = ["all", "upcoming", "in-progress", "past", "completed", "cancelled"]
const MODE_FILTERS = ["all", "tele", "physical"]
const CREATOR_FILTERS = ["all", "mine"]

const STATUS_VARIANT = {
  completed: "success",
  "in-progress": "primary",
  upcoming: "default",
  past: "warning",
  cancelled: "destructive",
}

function enrichAppointment(appointment, locale) {
  const isTele = appointment.mode === "Teleconsultation"
  const timePart = appointment.time && appointment.time !== "—" ? appointment.time : "00:00"
  const dateHeureRdv =
    appointment.date && appointment.date !== "—" ? `${appointment.date}T${timePart}` : null
  const dt = dateHeureRdv ? new Date(dateHeureRdv.replace(" ", "T")) : null
  const valid = dt && !Number.isNaN(dt.getTime())
  const monthKey = valid
    ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
    : "unknown"
  const monthLabel = valid
    ? dt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "long", year: "numeric" })
    : "—"

  return {
    ...appointment,
    isTele,
    dateHeureRdv,
    monthKey,
    monthLabel,
  }
}

function SummaryStat({ icon: Icon, label, value, tone = "primary", loading }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    secondary: "bg-secondary/15 text-secondary",
    success: "bg-success/12 text-success",
    destructive: "bg-destructive/10 text-destructive",
  }
  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{loading ? "—" : value}</p>
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

function DateBadge({ appointment, locale }) {
  const dt = appointment.dateHeureRdv ? new Date(String(appointment.dateHeureRdv).replace(" ", "T")) : null
  const valid = dt && !Number.isNaN(dt.getTime())
  const day = valid ? dt.getDate() : "—"
  const month = valid
    ? dt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "short" })
    : "—"

  return (
    <div
      className={cn(
        "flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border py-3 shadow-sm",
        appointment.isTele
          ? "border-primary/25 bg-gradient-to-b from-primary/12 to-primary/5 text-primary"
          : "border-secondary/25 bg-gradient-to-b from-secondary/12 to-secondary/5 text-secondary",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{month}</span>
      <span className="font-display text-2xl font-bold leading-none">{day}</span>
      <span className="mt-1.5 text-xs font-semibold">{appointment.time}</span>
    </div>
  )
}

function NextSessionHero({ appointment, t, locale, onJoin }) {
  if (!appointment) return null

  return (
    <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card shadow-md">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/15 p-3 text-primary">
            {appointment.isTele ? <Video className="h-6 w-6" /> : <CalendarDays className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("appointments.nextSession")}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-foreground">{appointment.patient}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{appointment.reason}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={appointment.isTele ? "primary" : "secondary"} className="gap-1">
                {appointment.isTele ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                {appointment.isTele ? t("appointments.filterModeTele") : t("appointments.filterModePhysical")}
              </Badge>
              <span className="font-medium text-foreground">
                {formatDateTime(appointment.dateHeureRdv, locale)}
              </span>
              <span className="text-muted-foreground">· {appointment.duration}</span>
            </p>
          </div>
        </div>
        {appointment.isTele && ["upcoming", "in-progress"].includes(appointment.status) ? (
          <Button size="md" className="gap-2 shadow-lg shadow-primary/20" onClick={() => onJoin(appointment)}>
            <Video className="h-4 w-4" />
            {t("appointments.actionsJoin")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : !appointment.isTele && ["upcoming", "in-progress", "arrived"].includes(appointment.status) ? (
          <Button size="md" className="gap-2 shadow-lg shadow-secondary/20" onClick={() => onJoin(appointment)}>
            <Stethoscope className="h-4 w-4" />
            Ouvrir consultation
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            <Stethoscope className="mx-auto mb-1 h-5 w-5 text-primary" />
            {t("appointments.presentialHint")}
          </div>
        )}
      </div>
    </Card>
  )
}

function AppointmentCard({ appointment, t, locale, onJoin, onComplete, index }) {
  const canJoinTele =
    appointment.isTele && ["upcoming", "in-progress"].includes(appointment.status)
  const canOpenPresentiel =
    !appointment.isTele && ["upcoming", "in-progress", "arrived", "past"].includes(appointment.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        appointment.isTele ? "border-l-4 border-l-primary" : "border-l-4 border-l-secondary",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
          appointment.isTele
            ? "from-primary/8 via-transparent to-transparent"
            : "from-secondary/8 via-transparent to-transparent",
        )}
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <DateBadge appointment={appointment} locale={locale} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={appointment.isTele ? "primary" : "secondary"}
              className="gap-1 text-[10px] uppercase tracking-wide"
            >
              {appointment.isTele ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              {appointment.isTele ? t("appointments.filterModeTele") : t("appointments.filterModePhysical")}
            </Badge>
            <Badge variant={STATUS_VARIANT[appointment.status] || "default"}>
              {t(`statuses.${appointment.status}`)}
            </Badge>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <Avatar name={appointment.patient} className="h-11 w-11 text-sm" />
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-foreground">{appointment.patient}</p>
              <p className="text-xs text-muted-foreground">{appointment.patientId}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{appointment.reason}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {appointment.duration}
            </span>
            {appointment.room && appointment.room !== "—" && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {appointment.room}
              </span>
            )}
            {appointment.id && <span className="font-mono opacity-70">#{appointment.id}</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {canJoinTele && (
            <Button size="sm" className="gap-2 shadow-sm" onClick={() => onJoin(appointment)}>
              <Video className="h-4 w-4" />
              {t("appointments.actionsJoin")}
            </Button>
          )}
          {canOpenPresentiel && (
            <Button size="sm" className="gap-2 shadow-sm" onClick={() => onJoin(appointment)}>
              <Stethoscope className="h-4 w-4" />
              Ouvrir consultation
            </Button>
          )}
          {["in-progress", "past"].includes(appointment.status) && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => onComplete?.(appointment)}>
              <CheckCircle2 className="h-4 w-4" />
              {t("appointments.actionsComplete")}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function AppointmentsTable({ appointments, t, lang, locale, onJoin, onComplete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3.5 font-semibold">{t("appointments.colPatient")}</th>
            <th className="px-5 py-3.5 font-semibold">{t("appointments.colDateTime")}</th>
            <th className="px-5 py-3.5 font-semibold">{t("appointments.colReason")}</th>
            <th className="px-5 py-3.5 font-semibold">{t("appointments.colMode")}</th>
            <th className="px-5 py-3.5 font-semibold">{t("appointments.colStatus")}</th>
            <th className="px-5 py-3.5 font-semibold">{t("appointments.colDuration")}</th>
            <th className="px-5 py-3.5 font-semibold">{t("appointments.colActions")}</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a, i) => (
            <motion.tr
              key={a.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={a.patient} />
                  <div>
                    <p className="font-medium text-foreground">{a.patient}</p>
                    <p className="text-xs text-muted-foreground">{a.patientId}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <p className="text-sm text-foreground">{formatDate(a.date, lang)}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </td>
              <td className="max-w-[200px] truncate px-5 py-3.5 text-muted-foreground">{a.reason}</td>
              <td className="px-5 py-3.5">
                <Badge variant={a.isTele ? "primary" : "secondary"} className="gap-1">
                  {a.isTele ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                  {a.isTele ? t("appointments.filterModeTele") : t("appointments.filterModePhysical")}
                </Badge>
              </td>
              <td className="px-5 py-3.5">
                <Badge variant={STATUS_VARIANT[a.status] || "default"}>
                  {t(`statuses.${a.status}`)}
                </Badge>
              </td>
              <td className="px-5 py-3.5 text-muted-foreground">{a.duration}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-2">
                  {a.status === "upcoming" && a.isTele && (
                    <Button variant="outline" size="sm" onClick={() => onJoin(a)}>
                      {t("appointments.actionsJoin")}
                    </Button>
                  )}
                  {!a.isTele && ["upcoming", "in-progress", "arrived", "past"].includes(a.status) && (
                    <Button size="sm" onClick={() => onJoin(a)}>
                      Ouvrir consultation
                    </Button>
                  )}
                  {["in-progress", "past"].includes(a.status) && (
                    <Button size="sm" variant="outline" onClick={() => onComplete?.(a)}>
                      {t("appointments.actionsComplete")}
                    </Button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CardSkeleton() {
  return <Card className="h-40 animate-pulse bg-muted/30" />
}

function EmptyState({ t, hasFilters, onClear }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-2xl bg-muted/50 p-5">
        <UserX className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <p className="font-medium text-foreground">{t("appointments.noResults")}</p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          {t("appointments.clearFilters")}
        </Button>
      )}
    </Card>
  )
}

export default function Appointments() {
  const { t, lang, locale } = useI18n()
  const navigate = useNavigate()
  const { user, roleKey } = useAuth()
  const isPatient = roleKey === ROLE_KEYS.PATIENT
  const isDoctor = roleKey === ROLE_KEYS.DOCTOR
  const isReception = roleKey === ROLE_KEYS.RECEPTIONIST
  const appointmentApi = isReception ? receptionService : doctorService
  const [creatorFilter, setCreatorFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [modeFilter, setModeFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { data: appointments, loading, error, reload } = useAsync(
    () =>
      isPatient
        ? patientPortalService.getAppointments()
        : appointmentApi.getAppointments({ mine: isReception && creatorFilter === "mine" }),
    [isPatient, isReception, creatorFilter],
  )

  const enriched = useMemo(
    () => (appointments || []).map((a) => enrichAppointment(a, locale)),
    [appointments, locale],
  )

  const filtered = useMemo(() => {
    if (isPatient) return []
    const q = query.toLowerCase()
    return enriched.filter((a) => {
      const matchesQuery =
        (a.patient || "").toLowerCase().includes(q) ||
        (a.patientId || "").toLowerCase().includes(q) ||
        (a.reason || "").toLowerCase().includes(q) ||
        String(a.id || "").includes(q)
      const matchesStatus = statusFilter === "all" || a.status === statusFilter
      const matchesMode =
        modeFilter === "all" ||
        (modeFilter === "tele" && a.isTele) ||
        (modeFilter === "physical" && !a.isTele)
      return matchesQuery && matchesStatus && matchesMode
    })
  }, [enriched, query, statusFilter, modeFilter, isPatient])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const a of filtered) {
      const key = a.monthKey || "unknown"
      if (!map.has(key)) map.set(key, { label: a.monthLabel, items: [] })
      map.get(key).items.push(a)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const kpis = useMemo(() => {
    if (isPatient) {
      return { total: 0, upcoming: 0, inProgress: 0, past: 0, completed: 0, cancelled: 0, tele: 0, presential: 0 }
    }
    return {
      total: enriched.length,
      upcoming: enriched.filter((a) => a.status === "upcoming").length,
      inProgress: enriched.filter((a) => a.status === "in-progress").length,
      past: enriched.filter((a) => a.status === "past").length,
      completed: enriched.filter((a) => a.status === "completed").length,
      cancelled: enriched.filter((a) => a.status === "cancelled").length,
      tele: enriched.filter((a) => a.isTele).length,
      presential: enriched.filter((a) => !a.isTele).length,
    }
  }, [enriched, isPatient])

  const nextSession = useMemo(() => {
    const now = Date.now()
    return enriched
      .filter((a) => {
        if (a.status === "cancelled" || a.status === "completed" || a.status === "past") return false
        const ts = a.dateHeureRdv ? new Date(String(a.dateHeureRdv).replace(" ", "T")).getTime() : 0
        return ts >= now || a.status === "in-progress"
      })
      .sort((a, b) => {
        const da = a.dateHeureRdv ? new Date(String(a.dateHeureRdv).replace(" ", "T")).getTime() : 0
        const db = b.dateHeureRdv ? new Date(String(b.dateHeureRdv).replace(" ", "T")).getTime() : 0
        return da - db
      })[0]
  }, [enriched])

  const hasActiveFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    modeFilter !== "all" ||
    (isReception && creatorFilter !== "all")

  const handleJoin = (appointment) => {
    if (!appointment?.id) return
    if (appointment.isTele || appointment.mode === "Teleconsultation" || appointment.canal === "TELECONSULTATION") {
      navigate(`/teleconsultation?rdv=${appointment.id}`)
      return
    }
    navigate(`/doctor-workspace?rdv=${appointment.id}`)
  }

  const handleComplete = async (appointment) => {
    if (!appointment?.id) return
    const result = await MySwal.fire({
      icon: "question",
      title: t("appointments.completeConfirmTitle"),
      text: t("appointments.completeConfirmText", { patient: appointment.patient || "—" }),
      showCancelButton: true,
      confirmButtonText: t("appointments.actionsComplete"),
      cancelButtonText: t("common.cancel"),
    })
    if (!result.isConfirmed) return
    try {
      await doctorService.completeAppointment(appointment.id)
      reload()
      await MySwal.fire({
        icon: "success",
        title: t("appointments.completeSuccessTitle"),
        text: t("appointments.completeSuccessText"),
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("appointments.completeErrorTitle"),
        text: err?.message || t("appointments.completeErrorText"),
      })
    }
  }

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("all")
    setModeFilter("all")
    setCreatorFilter("all")
  }

  const handleSaveAppointment = async (formData) => {
    setSaving(true)
    try {
      const created = isReception
        ? await receptionService.createAppointment(formData, user)
        : await appointmentApi.createAppointment({
            idPatient: Number(formData.patientId),
            idMedecin: Number(formData.doctorId),
            dateHeureRdv: `${formData.date}T${formData.time}:00`,
            dureeEstimee: formData.duration || 30,
            motifVisite: formData.notes ? `${formData.motif} — ${formData.notes}` : formData.motif,
            canal: formData.canal,
            statutRdv: formData.statutRdv || "PROGRAMME",
          })

      setIsModalOpen(false)
      reload()

      const isTele = formData.canal === "TELECONSULTATION"
      await MySwal.fire({
        icon: "success",
        title: t("appointments.scheduleConfirm"),
        text: isTele
          ? t("appointments.teleCreateSuccess", { email: formData.patientEmail || "—" })
          : t("appointments.createSuccess"),
        timer: isTele ? 3500 : 2200,
        showConfirmButton: false,
      })

      if (isTele && created?.urlVisio) {
        console.info("Lien téléconsultation:", created.urlVisio)
      }
    } finally {
      setSaving(false)
    }
  }

  if (isPatient) {
    return (
      <PatientAppointmentsView
        appointments={appointments}
        loading={loading}
        error={error}
        onRetry={reload}
      />
    )
  }

  const pageSubtitle = isDoctor
    ? t("appointments.subtitleDoctor")
    : user?.tenantLabel
      ? t("appointments.subtitleTenant", { hospital: user.tenantLabel })
      : t("appointments.subtitle")

  return (
    <div className="min-h-full space-y-6">
      <PageHeader
        title={t("appointments.title")}
        subtitle={pageSubtitle}
        actions={
          <Button size="md" className="gap-2 shadow-sm shadow-primary/20" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("appointments.book")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-7">
        <SummaryStat
          icon={CalendarCheck}
          label={t("appointments.total")}
          value={kpis.total}
          tone="primary"
          loading={loading}
        />
        <SummaryStat
          icon={CalendarClock}
          label={t("appointments.upcoming")}
          value={kpis.upcoming}
          tone="accent"
          loading={loading}
        />
        <SummaryStat
          icon={PlayCircle}
          label={t("appointments.inProgress")}
          value={kpis.inProgress}
          tone="primary"
          loading={loading}
        />
        <SummaryStat
          icon={Clock}
          label={t("appointments.past")}
          value={kpis.past}
          tone="accent"
          loading={loading}
        />
        <SummaryStat
          icon={CheckCircle2}
          label={t("appointments.completed")}
          value={kpis.completed}
          tone="success"
          loading={loading}
        />
        <SummaryStat
          icon={Video}
          label={t("appointments.statTele")}
          value={kpis.tele}
          tone="secondary"
          loading={loading}
        />
        <SummaryStat
          icon={MapPin}
          label={t("appointments.statPresential")}
          value={kpis.presential}
          tone="secondary"
          loading={loading}
        />
      </div>

      {!loading && nextSession && (
        <NextSessionHero appointment={nextSession} t={t} locale={locale} onJoin={handleJoin} />
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {t("appointments.optionsLoadError")}
        </Card>
      )}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{t("appointments.allAppointments")}</CardTitle>
              <CardDescription className="mt-1">
                {loading
                  ? t("appointments.loadingAppointments")
                  : t("appointments.resultsCount", { count: filtered.length })}
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
                {t("appointments.viewGrid")}
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
                {t("appointments.viewTable")}
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
              placeholder={t("appointments.searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                {t("appointments.colStatus")}
              </span>
              {STATUS_FILTERS.map((s) => (
                <FilterChip
                  key={s}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? t("appointments.filterAll") : t(`statuses.${s}`)}
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("appointments.colMode")}
              </span>
              {MODE_FILTERS.map((m) => (
                <FilterChip key={m} active={modeFilter === m} onClick={() => setModeFilter(m)}>
                  {m === "all"
                    ? t("appointments.filterModeAll")
                    : m === "tele"
                      ? t("appointments.filterModeTele")
                      : t("appointments.filterModePhysical")}
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
                    {t(`appointments.filters.creator.${value}`)}
                  </FilterChip>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="w-fit text-muted-foreground" onClick={clearFilters}>
                {t("appointments.clearFilters")}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          viewMode === "grid" ? (
            <div className="space-y-4 p-4 pt-0 sm:p-5">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("appointments.loadingAppointments")}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="p-4 pt-0 sm:p-5">
            <EmptyState t={t} hasFilters={hasActiveFilters} onClear={clearFilters} />
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-8 p-4 pt-0 sm:p-5">
            {grouped.map(([key, group]) => (
              <section key={key}>
                <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {group.label}
                </h3>
                <div className="space-y-4">
                  {group.items.map((a, i) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      t={t}
                      locale={locale}
                      index={i}
                      onJoin={handleJoin}
                      onComplete={handleComplete}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <AppointmentsTable
            appointments={filtered}
            t={t}
            lang={lang}
            locale={locale}
            onJoin={handleJoin}
            onComplete={handleComplete}
          />
        )}
      </Card>

      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        loading={saving}
        variant={isReception ? "reception" : "doctor"}
      />

      <AppointmentDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  )
}
