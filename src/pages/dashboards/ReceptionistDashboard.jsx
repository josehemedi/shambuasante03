import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  UserCheck,
  LogOut,
  FileDown,
  ArrowRight,
  Users,
  UserPlus,
  Stethoscope,
  Video,
  TrendingUp,
  Activity,
  Loader2,
  ClipboardList,
  RefreshCw,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import { ChartTooltip } from "@/components/ChartTooltip"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Avatar,
  Progress,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync, useAsyncList } from "@/hooks/useAsync"
import { receptionService, dischargeService } from "@/services/api"
import { getToken } from "@/services/httpClient"
import {
  createReceptionLiveClient,
  disconnectReceptionLiveClient,
} from "@/services/receptionLiveClient"
import NewAppointmentModal from "@/components/NewAppointmentModal"
import WalkInRegistrationModal from "@/components/WalkInRegistrationModal"
import DischargeNotePreviewModal from "@/components/DischargeNotePreviewModal"
import { cn } from "@/lib/utils"

const MySwal = withReactContent(Swal)

const CHART_COLORS = ["#1E56A0", "#2563EB", "#3B82F6", "#60A5FA", "#6366F1", "#93C5FD"]

const QUEUE_STATUS_VARIANT = {
  waiting: "warning",
  "checked-in": "success",
  scheduled: "secondary",
  "in-progress": "primary",
}

const APPT_STATUS_VARIANT = {
  upcoming: "secondary",
  "in-progress": "primary",
  completed: "success",
  cancelled: "destructive",
  missed: "warning",
}

const APPT_STATUS_LABEL = {
  upcoming: "appointments.upcoming",
  "in-progress": "appointments.inProgress",
  completed: "appointments.completed",
  cancelled: "appointments.cancelled",
}

function apptStatusLabel(status, t) {
  const key = APPT_STATUS_LABEL[status]
  return key ? t(key) : status || "—"
}

function DashboardPanel({ title, subtitle, icon: Icon, actionLabel, onAction, children, className = "" }) {
  return (
    <Card className={cn("flex h-full flex-col overflow-hidden", className)}>
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              {title}
            </CardTitle>
            {subtitle && <CardDescription className="mt-1.5">{subtitle}</CardDescription>}
          </div>
          {onAction && (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 py-4">{children}</CardContent>
    </Card>
  )
}

function EmptyState({ message, icon: Icon = ClipboardList }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function parseWaitMinutes(waited) {
  if (!waited || waited === "—") return 0
  const match = String(waited).match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

function buildQueueChart(queue, t) {
  const list = queue ?? []
  if (!list.length) return []
  const grouped = list.reduce((acc, item) => {
    const key = item.status || "waiting"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  return Object.entries(grouped).map(([status, count]) => ({
    name: t(`recDash.queueStatus.${status}`),
    count,
    status,
  }))
}

export default function ReceptionistDashboard() {
  const { t } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: kpis, reload: reloadKpis, loading: kpisLoading, error: kpisError } = useAsync(
    () => receptionService.getKpis(),
    [],
  )
  const {
    data: queueList,
    reload: reloadQueue,
    loading: queueLoading,
    error: queueError,
  } = useAsyncList(() => receptionService.getQueue(), [])
  const {
    data: registrationsList,
    reload: reloadRegistrations,
    loading: regLoading,
    error: regError,
  } = useAsyncList(() => receptionService.getRegistrationSeries(), [])
  const {
    data: scheduleList,
    reload: reloadSchedule,
    loading: scheduleLoading,
    error: scheduleError,
  } = useAsyncList(() => receptionService.getRendezVousJour(), [])
  const {
    data: pretesList,
    reload: reloadPretes,
    error: pretesError,
  } = useAsyncList(() => dischargeService.listPretes(), [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWalkInOpen, setIsWalkInOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingWalkIn, setSavingWalkIn] = useState(false)
  const [deliveringId, setDeliveringId] = useState(null)
  const [checkingInId, setCheckingInId] = useState(null)
  const [previewNote, setPreviewNote] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(() => new Date())
  const [liveConnected, setLiveConnected] = useState(false)

  const reloadAll = useCallback(() => {
    reloadKpis()
    reloadQueue()
    reloadRegistrations()
    reloadSchedule()
    reloadPretes()
    setLastRefresh(new Date())
  }, [reloadKpis, reloadQueue, reloadRegistrations, reloadSchedule, reloadPretes])

  // Rechargement immédiat via WebSocket (le poll HTTP est géré par useAsync)
  useEffect(() => {
    const tenantId = user?.idHopital
    const token = getToken()
    if (!tenantId || !token) return undefined

    let debounceTimer = null
    const client = createReceptionLiveClient({
      tenantId,
      token,
      onConnect: () => setLiveConnected(true),
      onDisconnect: () => setLiveConnected(false),
      onEvent: () => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => reloadAll(), 350)
      },
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      disconnectReceptionLiveClient(client)
      setLiveConnected(false)
    }
  }, [user?.idHopital, reloadAll])

  const loading = kpisLoading || queueLoading || regLoading || scheduleLoading
  const errorMessage =
    kpisError?.message ||
    queueError?.message ||
    regError?.message ||
    scheduleError?.message ||
    pretesError?.message ||
    (kpisError || queueError || regError || scheduleError || pretesError ? t("recDash.loadError") : null)

  const topQueue = queueList.slice(0, 5)
  const topSchedule = scheduleList.slice(0, 5)
  const queueChartData = useMemo(() => buildQueueChart(queueList, t), [queueList, t])

  const maxWait = useMemo(
    () => Math.max(1, ...queueList.map((row) => parseWaitMinutes(row.waited))),
    [queueList],
  )

  const handleCheckIn = async (row) => {
    if (!row?.id || row.status !== "waiting") return
    setCheckingInId(row.id)
    try {
      await receptionService.checkInPatient(row.id)
      reloadAll()
      await MySwal.fire({
        icon: "success",
        title: t("recDash.checkIn"),
        text: t("recDash.checkInSuccess"),
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("recDash.checkInError"),
      })
    } finally {
      setCheckingInId(null)
    }
  }

  const handleDeliver = async (item) => {
    setDeliveringId(item.idBonSortie)
    try {
      const delivered = await dischargeService.delivrer(item.idBonSortie, true)
      reloadPretes()
      reloadKpis()
      setPreviewNote({
        ...item,
        ...delivered,
        recommandations: delivered.recommandations ?? item.recommandations,
        statutWorkflow: "DELIVRE",
        statutPaiementFinal: true,
      })
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || "—",
      })
    } finally {
      setDeliveringId(null)
    }
  }

  const handleDownloadPdfFromPreview = async () => {
    if (!previewNote?.idBonSortie) return
    setPdfLoading(true)
    try {
      const blob = await dischargeService.downloadBulletin(previewNote.idBonSortie)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (err) {
      await MySwal.fire({ icon: "error", title: t("common.error"), text: err?.message })
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDownloadBulletin = async (idBonSortie) => {
    try {
      const blob = await dischargeService.downloadBulletin(idBonSortie)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (err) {
      await MySwal.fire({ icon: "error", title: t("common.error"), text: err?.message })
    }
  }

  const handleSaveAppointment = async (formData) => {
    setSaving(true)
    try {
      const created = await receptionService.createAppointment(formData, user)

      setIsModalOpen(false)
      reloadAll()

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
        navigate("/appointments")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleWalkInSave = async (payload) => {
    setSavingWalkIn(true)
    try {
      const result = await receptionService.registerWalkIn(payload)
      setIsWalkInOpen(false)
      reloadAll()
      await MySwal.fire({
        icon: "success",
        title: t("recDash.walkInSuccessTitle"),
        text: t("recDash.walkInSuccessBody", {
          patient: result?.nomPatient || `${payload.prenom} ${payload.nom}`,
          doctor: result?.nomMedecin || "—",
        }),
        timer: 3200,
        showConfirmButton: false,
      })
    } finally {
      setSavingWalkIn(false)
    }
  }

  const openAppointments = () => navigate("/appointments")
  const openPatients = () => navigate("/patients")

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {errorMessage && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <PageHeader
        title={`${t("recDash.greeting")}${user?.name ? `, ${user.name}` : ""}`}
        subtitle={
          user?.tenantLabel
            ? t("recDash.subtitleTenant", { hospital: user.tenantLabel })
            : t("recDash.subtitle")
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={reloadAll}
              disabled={loading}
              className="gap-2"
              title={t("recDash.refreshHint")}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" onClick={openPatients} className="gap-2">
              <Users className="h-4 w-4" />
              {t("recDash.openPatients")}
            </Button>
            <Button variant="outline" onClick={openAppointments} className="gap-2">
              <CalendarDays className="h-4 w-4" />
              {t("recDash.viewAppointments")}
            </Button>
            <Button size="md" onClick={() => setIsWalkInOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {t("recDash.registerWalkIn")}
            </Button>
            <Button size="md" variant="secondary" onClick={() => setIsModalOpen(true)} className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              {t("recDash.scheduleAppointment")}
            </Button>
          </div>
        }
      />

      {/* Bannière héro */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[#1E56A0] via-blue-700 to-indigo-900 p-6 text-white shadow-lg shadow-blue-900/20">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">
              {user?.tenantLabel || t("recDash.title")}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">
              {t("recDash.heroTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-blue-50/85">{t("recDash.heroSubtitle")}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-blue-100/60">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    liveConnected ? "bg-emerald-300 animate-pulse" : "bg-blue-200/50",
                  )}
                />
                {liveConnected ? t("recDash.liveActive") : t("recDash.refreshHint")}
              </span>
              <span>·</span>
              <span>
                {t("recDash.lastRefresh")}{" "}
                {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-100">
                <CalendarDays className="h-4 w-4" />
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {t("recDash.todayAppointments")}
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-bold">{kpis?.todayAppointments?.value ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-100">
                <Clock className="h-4 w-4" />
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {t("recDash.waiting")}
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-bold">{kpis?.waiting?.value ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-100">
                <LogOut className="h-4 w-4" />
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {t("recDash.heroDischargePending")}
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-bold">{pretesList.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label={t("recDash.todayAppointments")}
          value={kpis?.todayAppointments?.value ?? 0}
          delta={kpis?.todayAppointments?.delta ?? 0}
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          index={1}
          label={t("recDash.waiting")}
          value={kpis?.waiting?.value ?? 0}
          delta={kpis?.waiting?.delta ?? 0}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          index={2}
          label={t("recDash.checkedIn")}
          value={kpis?.checkedIn?.value ?? 0}
          delta={kpis?.checkedIn?.delta ?? 0}
          icon={UserCheck}
          tone="secondary"
        />
        <StatCard
          index={3}
          label={t("recDash.registrations")}
          value={kpis?.registrations?.value ?? 0}
          delta={kpis?.registrations?.delta ?? 0}
          icon={UserPlus}
          tone="accent"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-base">{t("recDash.chartRegistrations")}</CardTitle>
            <CardDescription>{t("recDash.chartRegistrationsSub")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <EmptyState message={t("common.loading")} icon={Loader2} />
            ) : registrationsList.length === 0 ? (
              <EmptyState message={t("recDash.emptyRegistrations")} icon={UserPlus} />
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrationsList} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="count"
                      name={t("recDash.registrations")}
                      fill="#1E56A0"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-base">{t("recDash.chartQueue")}</CardTitle>
            <CardDescription>{t("recDash.chartQueueSub")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <EmptyState message={t("common.loading")} icon={Loader2} />
            ) : queueChartData.length === 0 ? (
              <EmptyState message={t("recDash.emptyQueue")} icon={Users} />
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={queueChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {queueChartData.map((entry, index) => (
                        <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Salle d'attente + Planning */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardPanel
          title={t("recDash.queueTitle")}
          subtitle={t("recDash.queueSub")}
          icon={Users}
          actionLabel={t("recDash.openPatients")}
          onAction={openPatients}
        >
          {loading ? (
            <EmptyState message={t("common.loading")} icon={Loader2} />
          ) : topQueue.length === 0 ? (
            <EmptyState message={t("recDash.emptyQueue")} icon={Users} />
          ) : (
            topQueue.map((row) => {
              const waitMin = parseWaitMinutes(row.waited)
              const waitRatio = Math.min(100, Math.round((waitMin / maxWait) * 100))
              return (
                <div
                  key={row.id}
                  className="group rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={row.patient} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{row.patient}</p>
                        <Badge variant={QUEUE_STATUS_VARIANT[row.status] || "default"} className="text-[10px]">
                          {t(`recDash.queueStatus.${row.status}`)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <Stethoscope className="mr-1 inline h-3 w-3" />
                        {row.doctor} · {row.appt}
                      </p>
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{t("recDash.waitTime")}</span>
                          <span className="font-mono font-semibold text-foreground">{row.waited}</span>
                        </div>
                        <Progress
                          value={waitRatio}
                          className="h-1.5"
                          indicatorClassName={cn(
                            waitRatio >= 75 ? "bg-amber-500" : "bg-primary",
                          )}
                        />
                      </div>
                    </div>
                    {row.status === "waiting" && (
                      <Button
                        size="sm"
                        disabled={checkingInId === row.id}
                        onClick={() => handleCheckIn(row)}
                        className="shrink-0 gap-1.5 opacity-90 group-hover:opacity-100"
                      >
                        {checkingInId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        {t("recDash.checkIn")}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </DashboardPanel>

        <DashboardPanel
          title={t("recDash.schedulePreview")}
          subtitle={t("recDash.schedulePreviewSub")}
          icon={CalendarDays}
          actionLabel={t("recDash.viewAll")}
          onAction={openAppointments}
        >
          {loading ? (
            <EmptyState message={t("common.loading")} icon={Loader2} />
          ) : topSchedule.length === 0 ? (
            <EmptyState message={t("recDash.emptySchedule")} icon={CalendarDays} />
          ) : (
            topSchedule.map((appt) => {
              const isTele = appt.mode === "Teleconsultation" || appt.canal === "TELECONSULTATION"
              const ModeIcon = isTele ? Video : Stethoscope
              return (
                <div
                  key={appt.id || appt.idRdv}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="text-[10px] font-bold leading-none">{appt.time?.split(":")[0] || "—"}</span>
                    <span className="text-[9px] opacity-80">{appt.time?.split(":")[1] || ""}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {appt.patient || appt.nomPatient}
                      </p>
                      {appt.status && (
                        <Badge variant={APPT_STATUS_VARIANT[appt.status] || "default"} className="text-[10px]">
                          {apptStatusLabel(appt.status, t)}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {appt.nomMedecin || appt.doctor || "—"} · {appt.reason || appt.motifVisite || "—"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ModeIcon className="h-3 w-3" />
                      {isTele ? t("appointments.filterModeTele") : t("appointments.filterModePhysical")}
                      {appt.duration ? ` · ${appt.duration}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                    {appt.time}
                  </Badge>
                </div>
              )
            })
          )}
        </DashboardPanel>
      </div>

      {/* Sorties patients */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/30 to-transparent pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                  <LogOut className="h-4 w-4" />
                </span>
                {t("recDash.dischargeTitle")}
                {(pretesList.length > 0) && (
                  <Badge variant="warning" className="ml-1 text-[10px]">
                    {pretesList.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1.5">{t("recDash.dischargeSub")}</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>{t("recDash.heroDischargePending")}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 py-4">
          {pretesList.length === 0 ? (
            <EmptyState message={t("recDash.emptyDischarge")} icon={LogOut} />
          ) : (
            pretesList.map((item) => (
              <div
                key={item.idBonSortie}
                className="group flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/25 hover:shadow-md"
              >
                <Avatar name={item.nomPatient} className="h-11 w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{item.nomPatient}</p>
                    <Badge variant="warning" className="text-[10px]">
                      {item.statutWorkflow || "AUTORISE_MEDICALEMENT"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.numeroBon || `BS #${item.idBonSortie}`} · {item.autorisePar}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.diagnosticFinal}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadBulletin(item.idBonSortie)}
                    className="gap-1.5"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    disabled={deliveringId === item.idBonSortie}
                    onClick={() => handleDeliver(item)}
                    className="gap-1.5"
                  >
                    {deliveringId === item.idBonSortie ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {t("recDash.deliverDischarge")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        loading={saving}
        variant="reception"
      />

      <WalkInRegistrationModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        onSaved={handleWalkInSave}
        saving={savingWalkIn}
      />

      <DischargeNotePreviewModal
        isOpen={Boolean(previewNote)}
        onClose={() => setPreviewNote(null)}
        note={previewNote}
        onDownloadPdf={handleDownloadPdfFromPreview}
        pdfLoading={pdfLoading}
      />
    </motion.div>
  )
}
