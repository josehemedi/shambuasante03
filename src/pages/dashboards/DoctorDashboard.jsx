import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Users,
  Video,
  FileText,
  Clock,
  ArrowRight,
  Stethoscope,
  ClipboardList,
  FileBarChart2,
  Loader2,
  Megaphone,
  Play,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Avatar,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { doctorService } from "@/services/api"
import { getToken } from "@/services/httpClient"
import {
  createMedecinQueueLiveClient,
  disconnectMedecinQueueLiveClient,
} from "@/services/medecinQueueLiveClient"
import { cn } from "@/lib/utils"
import { useRolePath } from "@/hooks/useRolePath"
import { playAndAnnounceWaitingRoomCall } from "@/lib/waitingRoomAudio"

const MySwal = withReactContent(Swal)

const APPT_STATUS = {
  completed: "success",
  "in-progress": "primary",
  upcoming: "default",
  ended: "secondary",
}

const PRIORITY_VARIANT = {
  high: "destructive",
  normal: "secondary",
  low: "default",
}

function DashboardPanel({ title, subtitle, icon: Icon, actionTo, actionLabel, children, className = "" }) {
  return (
    <Card className={`flex h-full flex-col ${className}`}>
      <CardHeader className="border-b border-border/60 pb-4">
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
          {actionTo && (
            <Link to={actionTo}>
              <Button variant="outline" size="sm">
                {actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 py-4">{children}</CardContent>
    </Card>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default function DoctorDashboard() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { path } = useRolePath()
  const [reportLoading, setReportLoading] = useState(false)
  const [actingId, setActingId] = useState(null)
  const { data, setData, loading, error, reload } = useAsync(() => doctorService.getDashboard(), [])

  useEffect(() => {
    const timer = setInterval(reload, 20_000)
    return () => clearInterval(timer)
  }, [reload])

  useEffect(() => {
    const tenantId = user?.idHopital
    const token = getToken()
    if (!tenantId || !token) return undefined

    let debounceTimer = null
    const client = createMedecinQueueLiveClient({
      tenantId,
      medecinId: user?.idMedecin,
      token,
      onEvent: (payload) => {
        const type = typeof payload === "string" ? payload : payload?.type
        if (!type) return
        if (
          type === "NEW_ADMISSION" ||
          type === "NEW_RDV" ||
          type === "PATIENT_EN_FILE" ||
          type === "STATUS_UPDATED" ||
          type === "PATIENT_CALLED" ||
          type === "PATIENT_RECALLED" ||
          type === "REFRESH"
        ) {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => reload(), 300)
        }
      },
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      disconnectMedecinQueueLiveClient(client)
    }
  }, [user?.idHopital, user?.idMedecin, reload])

  const handleViewReport = async () => {
    if (reportLoading) return
    setReportLoading(true)
    try {
      await doctorService.downloadDashboardPdf()
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("docDash.reportErrorTitle"),
        text: err?.message || t("docDash.reportError"),
      })
    } finally {
      setReportLoading(false)
    }
  }

    const handleCall = async (item) => {
    const key = item.idAdmission || item.idRendezVous || item.id
    setActingId(key)
    try {
      const event = await doctorService.callPatient(item)
      const numero = event?.numeroPassage ?? item.numeroPassage ?? null
      const salle = event?.salle ?? item.room ?? "Consultation"
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          queue: (prev.queue || []).map((row) => {
            const rowKey = row.idAdmission || row.idRendezVous || row.id
            if (rowKey !== key && row.idAdmission !== event?.idAdmission) return row
            return {
              ...row,
              idAdmission: event?.idAdmission ?? row.idAdmission,
              numeroPassage: numero,
              room: salle,
              statut: "APPELE",
              canCall: true,
              canStart: true,
            }
          }),
        }
      })
      const isRecall = Boolean(event?.rappel) || item.statut === "APPELE"
      // Son + annonce immédiatement au clic (geste utilisateur = autoplay OK)
      await playAndAnnounceWaitingRoomCall(
        {
          ...(event || {}),
          numeroPassage: numero,
          salle,
          patientNom: event?.patientNom || item.patient || item.patientNom || "",
          rappel: isRecall,
        },
        locale,
      )
      await MySwal.fire({
        icon: "success",
        title: isRecall ? t("waitingRoom.recallSuccessTitle") : t("waitingRoom.callSuccessTitle"),
        text: t("waitingRoom.callSuccessBody", {
          number: numero != null ? String(numero).padStart(3, "0") : "—",
          room: salle,
        }),
        timer: 1800,
        showConfirmButton: false,
      })
      reload()
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("waitingRoom.callErrorTitle"),
        text: err?.message || t("waitingRoom.callErrorBody"),
      })
    } finally {
      setActingId(null)
    }
  }

  const handleStart = async (item) => {
    if (!item.idAdmission) return
    setActingId(item.idAdmission)
    try {
      const result = await doctorService.startConsultation(item.idAdmission)
      const consultationId = result?.consultation?.idConsultation
      if (consultationId) {
        navigate(`${path("/doctor-workspace")}?consultation=${consultationId}`)
      } else {
        reload()
      }
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("waitingRoom.startErrorTitle"),
        text: err?.message || t("waitingRoom.startErrorBody"),
      })
    } finally {
      setActingId(null)
    }
  }

  const kpis = data?.kpis
  const schedule = data?.schedule || []
  const queue = data?.queue || []
  const activeConsults = data?.activeConsults || []
  const pendingNotes = data?.pendingNotes || []
  const errorMessage = error?.message || (error ? t("docDash.loadError") : null)

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
      <PageHeader
        title={`${t("docDash.greeting")}, ${user.name}`}
        subtitle={t("docDash.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={reportLoading || loading}
              onClick={handleViewReport}
              className="gap-2"
            >
              {reportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart2 className="h-4 w-4" />
              )}
              {reportLoading ? t("docDash.reportLoading") : t("docDash.viewReport")}
            </Button>
            <Link to={path("/doctor-workspace")}>
              <Button>
                <Stethoscope className="h-4 w-4" />
                {t("docDash.openWorkspace")}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label={t("docDash.todayAppointments")}
          value={kpis?.todayAppointments?.value ?? 0}
          delta={kpis?.todayAppointments?.delta ?? 0}
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          index={1}
          label={t("docDash.patientQueue")}
          value={kpis?.patientQueue?.value ?? 0}
          delta={kpis?.patientQueue?.delta ?? 0}
          icon={Users}
          tone="accent"
        />
        <StatCard
          index={2}
          label={t("docDash.activeConsults")}
          value={kpis?.activeConsults?.value ?? 0}
          delta={kpis?.activeConsults?.delta ?? 0}
          icon={Video}
          tone="secondary"
        />
        <StatCard
          index={3}
          label={t("docDash.pendingNotes")}
          value={kpis?.pendingNotes?.value ?? 0}
          delta={kpis?.pendingNotes?.delta ?? 0}
          icon={FileText}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardPanel
          title={t("docDash.scheduleTitle")}
          subtitle={t("docDash.scheduleSub")}
          icon={CalendarDays}
          actionTo={path("/appointments")}
          actionLabel={t("docDash.viewAll")}
        >
          {loading ? (
            <EmptyState message={t("common.loading")} />
          ) : schedule.length === 0 ? (
            <EmptyState message={t("docDash.noSchedule")} />
          ) : (
            schedule.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-card">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {a.timeLabel || "—"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.patient}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.motif}</p>
                </div>
                <Badge variant={APPT_STATUS[a.status] || "default"}>{a.status}</Badge>
              </div>
            ))
          )}
        </DashboardPanel>

        <DashboardPanel
          title={t("docDash.queueTitle")}
          subtitle={t("docDash.queueSub")}
          icon={Clock}
          actionTo={path("/waiting-room")}
          actionLabel={t("common.viewAll")}
        >
          {loading ? (
            <EmptyState message={t("common.loading")} />
          ) : queue.length === 0 ? (
            <EmptyState message={t("docDash.noQueue")} />
          ) : (
            queue.map((q) => {
              const busy = actingId === (q.idAdmission || q.idRendezVous || q.id)
              return (
              <div
                key={`${q.idAdmission || "r"}-${q.idRendezVous || q.id}`}
                className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center"
              >
                <Avatar name={q.patient} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{q.patient}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {q.room} · {t("docDash.waited", { time: q.waited })}
                    {q.numeroPassage != null ? ` · #${String(q.numeroPassage).padStart(3, "0")}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={PRIORITY_VARIANT[q.priority] || "default"}>
                    {t(`priority.${q.priority}`)}
                  </Badge>
                  {q.canCall && (
                    <Button
                      size="sm"
                      className={cn(
                        "gap-1",
                        q.statut === "APPELE" && "bg-amber-600 text-white hover:bg-amber-500",
                      )}
                      disabled={busy}
                      onClick={() => handleCall(q)}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
                      {q.statut === "APPELE" ? t("waitingRoom.recall") : t("waitingRoom.call")}
                    </Button>
                  )}
                  {q.canStart && (
                    <Button size="sm" variant="secondary" className="gap-1" disabled={busy} onClick={() => handleStart(q)}>
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      {t("waitingRoom.start")}
                    </Button>
                  )}
                </div>
              </div>
              )
            })
          )}
        </DashboardPanel>

        <DashboardPanel
          title={t("docDash.activeTitle")}
          subtitle={t("docDash.activeSub")}
          icon={Video}
          actionTo={path("/teleconsultation")}
          actionLabel={t("docDash.join")}
        >
          {loading ? (
            <EmptyState message={t("common.loading")} />
          ) : activeConsults.length === 0 ? (
            <EmptyState message={t("docDash.noActiveConsults")} />
          ) : (
            activeConsults.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{c.patient}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.motif}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t("docDash.startedAt", { time: c.startedAt })} ·{" "}
                    {c.canal === "TELECONSULTATION" ? t("docDash.teleconsultation") : t("docDash.inPerson")}
                  </p>
                </div>
                <Badge variant="primary">{t("statuses.in-progress")}</Badge>
              </div>
            ))
          )}
        </DashboardPanel>

        <DashboardPanel
          title={t("docDash.notesTitle")}
          subtitle={t("docDash.notesSub")}
          icon={ClipboardList}
          actionTo={path("/records")}
          actionLabel={t("common.viewAll")}
        >
          {loading ? (
            <EmptyState message={t("common.loading")} />
          ) : pendingNotes.length === 0 ? (
            <EmptyState message={t("docDash.noPendingNotes")} />
          ) : (
            pendingNotes.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/5 p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{n.patient}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.motif}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t("docDash.consultationAt", { time: n.consultationDate })}
                  </p>
                </div>
                <Badge variant="warning">{t("docDash.toComplete")}</Badge>
              </div>
            ))
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}
