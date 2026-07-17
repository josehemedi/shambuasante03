import { useCallback, useEffect, useMemo, useState } from "react"
import { useRolePath } from "@/hooks/useRolePath"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bell,
  Clock,
  Loader2,
  Megaphone,
  Monitor,
  Play,
  RefreshCw,
  Stethoscope,
  Users,
  Zap,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Button } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsyncList } from "@/hooks/useAsync"
import { doctorService } from "@/services/api"
import { getToken } from "@/services/httpClient"
import {
  createMedecinQueueLiveClient,
  disconnectMedecinQueueLiveClient,
} from "@/services/medecinQueueLiveClient"
import { cn } from "@/lib/utils"
import { playAndAnnounceWaitingRoomCall } from "@/lib/waitingRoomAudio"

const MySwal = withReactContent(Swal)

const ease = [0.22, 1, 0.36, 1]

function itemKey(item) {
  return `${item?.idAdmission || "r"}-${item?.idRendezVous || item?.id || "x"}`
}

function ticketLabel(numero) {
  return numero != null ? String(numero).padStart(3, "0") : "—"
}

function initialsOf(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "?"
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("")
}

function priorityTone(priority) {
  if (priority === "high") return "text-rose-700 bg-rose-50/90 ring-rose-200/70"
  if (priority === "low") return "text-blue-700/70 bg-blue-50/80 ring-blue-100"
  return "text-amber-800 bg-amber-50/90 ring-amber-200/60"
}

function statusTone(statut) {
  if (statut === "APPELE") return "text-blue-800 bg-blue-50 ring-blue-200/70"
  if (statut === "ENREGISTRE") return "text-emerald-800 bg-emerald-50/90 ring-emerald-200/70"
  return "text-slate-600 bg-slate-50 ring-slate-200/80"
}

function useClock(locale) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return {
    time: now.toLocaleTimeString(locale === "en" ? "en-GB" : "fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: now.toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  }
}

export default function WaitingRoom() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const { go } = useRolePath()
  const clock = useClock(locale)
  const { data: queue, setData: setQueue, loading, error, reload } = useAsyncList(
    () => doctorService.getLiveQueue(),
    [],
  )
  const [actingId, setActingId] = useState(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const tenantId = user?.idHopital
    const token = getToken()
    if (!tenantId || !token) return undefined

    let debounceTimer = null
    const client = createMedecinQueueLiveClient({
      tenantId,
      medecinId: user?.idMedecin,
      token,
      onConnect: () => setLive(true),
      onDisconnect: () => setLive(false),
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
          debounceTimer = setTimeout(() => reload(), 250)
        }
      },
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      disconnectMedecinQueueLiveClient(client)
    }
  }, [user?.idHopital, user?.idMedecin, reload])

  const stats = useMemo(() => {
    const list = queue || []
    return {
      total: list.length,
      waiting: list.filter((i) => i.statut !== "APPELE").length,
      called: list.filter((i) => i.statut === "APPELE").length,
      urgent: list.filter((i) => i.priority === "high").length,
    }
  }, [queue])

  const nextPatient = useMemo(() => {
    const list = queue || []
    return list.find((i) => i.statut === "APPELE") || list.find((i) => i.statut !== "APPELE") || null
  }, [queue])

  const nextBusy =
    nextPatient &&
    actingId === (nextPatient.idAdmission || nextPatient.idRendezVous || nextPatient.id)

  const handleCall = useCallback(
    async (item) => {
      const key = item.idAdmission || item.idRendezVous || item.id
      setActingId(key)
      try {
        const event = await doctorService.callPatient(item)
        const numero = event?.numeroPassage ?? item.numeroPassage ?? null
        const salle = event?.salle ?? item.room ?? "Consultation"
        setQueue((prev) =>
          (prev || []).map((row) => {
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
        )
        const isRecall = Boolean(event?.rappel) || item.statut === "APPELE"
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
            number: ticketLabel(numero),
            room: salle,
          }),
          timer: 2200,
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
    },
    [locale, reload, setQueue, t],
  )

  const handleStart = useCallback(
    async (item) => {
      if (item.idAdmission) {
        setActingId(item.idAdmission)
        try {
          const result = await doctorService.startConsultation(item.idAdmission)
          const consultationId = result?.consultation?.idConsultation
          if (consultationId) {
            go(`/doctor-workspace?consultation=${consultationId}`)
          } else if (item.idRendezVous) {
            go(`/doctor-workspace?rdv=${item.idRendezVous}`)
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
        return
      }
      if (item.idRendezVous) {
        go(`/doctor-workspace?rdv=${item.idRendezVous}`)
      }
    },
    [go, reload, t],
  )

  const handleOpenPresentiel = useCallback(
    (item) => {
      if (item.canStart && item.idAdmission) {
        handleStart(item)
        return
      }
      if (item.idRendezVous) {
        go(`/doctor-workspace?rdv=${item.idRendezVous}`)
        return
      }
      if (item.idAdmission) {
        handleStart(item)
      }
    },
    [go, handleStart],
  )

  const statItems = [
    { label: t("waitingRoom.statTotal"), value: stats.total, icon: Users, accent: "from-blue-600 to-blue-500" },
    { label: t("waitingRoom.statWaiting"), value: stats.waiting, icon: Clock, accent: "from-sky-500 to-cyan-500" },
    { label: t("waitingRoom.statCalled"), value: stats.called, icon: Megaphone, accent: "from-indigo-500 to-blue-500" },
    { label: t("waitingRoom.statUrgent"), value: stats.urgent, icon: Zap, accent: "from-rose-500 to-orange-400" },
  ]

  return (
    <div className="relative isolate min-h-[calc(100vh-7rem)] space-y-5 pb-8">
      {/* Ambient stage */}
      <div aria-hidden className="pointer-events-none absolute inset-x-[-1.5rem] -top-8 -z-10 h-[560px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_-10%,rgba(37,99,235,0.22),transparent_52%),radial-gradient(ellipse_at_90%_0%,rgba(14,165,233,0.18),transparent_48%),radial-gradient(ellipse_at_50%_40%,rgba(59,130,246,0.08),transparent_60%)]" />
        <motion.div
          className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ x: [0, 24, 0], y: [0, 16, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-24 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 22, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 opacity-[0.4] [background-image:linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:linear-gradient(180deg,black_20%,transparent)]" />
      </div>

      {/* Hero command bar */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative overflow-hidden rounded-[2rem] border border-blue-200/60 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_88%_10%,rgba(125,211,252,0.25),transparent_40%)]" />
        <div className="pointer-events-none absolute -right-8 bottom-0 h-40 w-40 rounded-[2rem] border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute right-16 top-8 h-24 w-24 rotate-12 rounded-2xl border border-white/10 bg-white/5" />

        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-stretch lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-white/20 backdrop-blur-sm">
                <Stethoscope className="h-3.5 w-3.5" />
                Shambua
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 backdrop-blur-sm",
                  live
                    ? "bg-emerald-400/20 text-emerald-50 ring-emerald-300/30"
                    : "bg-white/10 text-white/80 ring-white/15",
                )}
              >
                <span className="relative flex h-2 w-2">
                  {live && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex h-2 w-2 rounded-full",
                      live ? "bg-emerald-300" : "bg-white/50",
                    )}
                  />
                </span>
                {live ? t("waitingRoom.liveOn") : t("waitingRoom.liveOff")}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-sky-100/85">
                {user?.tenantLabel || t("waitingRoom.displayBrand")}
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                {t("waitingRoom.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-sky-50/80 sm:text-[15px]">
                {t("waitingRoom.subtitlePremium", {
                  hospital: user?.tenantLabel || t("waitingRoom.displayBrand"),
                  doctor: user?.name || "—",
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="md"
                className="gap-2 border-white/25 bg-white/10 text-white hover:bg-white/20"
                onClick={reload}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                {t("common.refresh")}
              </Button>
              <Button
                variant="outline"
                size="md"
                className="gap-2 border-white/25 bg-white text-blue-700 hover:bg-sky-50"
                onClick={() => window.open("/waiting-room-display", "_blank", "noopener,noreferrer")}
              >
                <Monitor className="h-4 w-4" />
                {t("waitingRoom.openDisplay")}
              </Button>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col justify-between gap-4 rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:max-w-xs lg:w-72">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100/70">
                {clock.date}
              </p>
              <p className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                {clock.time}
              </p>
            </div>
            <div className="space-y-2 border-t border-white/15 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sky-100/75">{t("waitingRoom.doctor")}</span>
                <span className="truncate font-medium text-white">{user?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-sky-100/75">{t("waitingRoom.inQueue")}</span>
                <span className="font-display text-lg font-bold tabular-nums">
                  {loading && queue.length === 0 ? "—" : stats.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Metric ribbon */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statItems.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06, duration: 0.4, ease }}
            className="group relative overflow-hidden rounded-2xl border border-blue-100/80 bg-white/90 p-4 shadow-[0_1px_0_rgba(37,99,235,0.06)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
          >
            <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90", stat.accent)} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {loading && queue.length === 0 ? "—" : stat.value}
                </p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white", stat.accent)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error.message || t("waitingRoom.loadError")}
        </div>
      )}

      {/* Main stage: focus + queue */}
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <AnimatePresence mode="wait">
          {nextPatient ? (
            <motion.section
              key={itemKey(nextPatient)}
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ duration: 0.45, ease }}
              className="relative overflow-hidden rounded-[2rem] border border-blue-200/70 bg-white shadow-[0_20px_50px_-28px_rgba(37,99,235,0.35)]"
            >
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-50 to-transparent" />
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                    {nextPatient.statut === "APPELE"
                      ? t("waitingRoom.nowServing")
                      : t("waitingRoom.nextUp")}
                  </span>
                  {nextPatient.statut === "APPELE" && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700">
                      <Bell className="h-4 w-4 animate-pulse" />
                      {t("waitingRoom.calledHint")}
                    </span>
                  )}
                </div>

                <div className="mt-8 flex flex-col items-start gap-8 sm:flex-row sm:items-end">
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.45, ease }}
                    className="relative"
                  >
                    <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-blue-500/20 to-sky-400/10 blur-xl" />
                    <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/25 sm:h-40 sm:w-40">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100/80">
                        {t("waitingRoom.ticket")}
                      </span>
                      <span className="mt-1 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
                        {ticketLabel(nextPatient.numeroPassage)}
                      </span>
                    </div>
                  </motion.div>

                  <div className="min-w-0 flex-1 space-y-4 pb-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 font-display text-sm font-bold text-blue-800">
                        {initialsOf(nextPatient.patient)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                          {nextPatient.patient}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-800 ring-1 ring-blue-100">
                            <Clock className="h-3.5 w-3.5" />
                            {t("docDash.waited", { time: nextPatient.waited })}
                          </span>
                          <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200/80">
                            {nextPatient.room || "—"}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ring-1",
                              priorityTone(nextPatient.priority),
                            )}
                          >
                            {t(`priority.${nextPatient.priority}`)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:pt-2">
                      {nextPatient.canCall && (
                        <Button
                          size="lg"
                          className={cn(
                            "h-12 flex-1 gap-2 text-sm font-semibold shadow-md shadow-blue-600/20",
                            nextPatient.statut === "APPELE"
                              ? "bg-amber-500 text-white hover:bg-amber-400"
                              : "bg-blue-700 text-white hover:bg-blue-600",
                          )}
                          disabled={nextBusy}
                          onClick={() => handleCall(nextPatient)}
                        >
                          {nextBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Megaphone className="h-4 w-4" />
                          )}
                          {nextPatient.statut === "APPELE"
                            ? t("waitingRoom.recall")
                            : t("waitingRoom.call")}
                        </Button>
                      )}
                      {(nextPatient.canStart || nextPatient.idRendezVous) && (
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-12 flex-1 gap-2 border-blue-200 bg-white text-sm font-semibold text-blue-800 hover:bg-blue-50"
                          disabled={nextBusy}
                          onClick={() => handleOpenPresentiel(nextPatient)}
                        >
                          {nextBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {nextPatient.canStart
                            ? t("waitingRoom.start")
                            : t("waitingRoom.consult")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="empty-focus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-blue-200 bg-gradient-to-b from-white to-blue-50/40 px-6 py-12 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Users className="h-7 w-7" />
              </div>
              <p className="mt-5 font-display text-xl font-bold text-slate-900">
                {t("waitingRoom.emptyTitle")}
              </p>
              <p className="mt-2 max-w-sm text-sm text-slate-500">{t("waitingRoom.empty")}</p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Queue column */}
        <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[2rem] border border-blue-100/90 bg-white/95 shadow-[0_1px_0_rgba(37,99,235,0.05)] backdrop-blur-sm">
          <div className="flex items-end justify-between gap-3 border-b border-blue-50 bg-gradient-to-r from-blue-50/80 to-transparent px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
                {t("waitingRoom.queueTitle")}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">{t("waitingRoom.queueHint")}</p>
            </div>
            <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              {stats.total}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && queue.length === 0 ? (
              <div className="flex h-full min-h-[240px] items-center justify-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                {t("common.loading")}
              </div>
            ) : queue.length === 0 ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
                <p className="text-sm text-slate-500">{t("waitingRoom.displayQueueEmpty")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-blue-50/80 p-2 sm:p-3">
                {queue.map((item, index) => {
                  const key = item.idAdmission || item.idRendezVous || item.id
                  const busy = actingId === key
                  const isFocus = nextPatient && itemKey(item) === itemKey(nextPatient)
                  return (
                    <motion.li
                      key={itemKey(item)}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.04, 0.32), duration: 0.35, ease }}
                      className={cn(
                        "group relative mb-1.5 overflow-hidden rounded-2xl border px-3.5 py-3.5 transition-all duration-300 last:mb-0 sm:px-4",
                        isFocus
                          ? "border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50/60 shadow-sm shadow-blue-500/10"
                          : "border-transparent bg-transparent hover:border-blue-100 hover:bg-blue-50/40",
                      )}
                    >
                      {isFocus && (
                        <motion.span
                          layoutId="queue-focus"
                          className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-blue-600"
                        />
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-5 shrink-0 text-center font-display text-[11px] font-bold tabular-nums text-blue-300">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white",
                              item.statut === "APPELE"
                                ? "bg-gradient-to-br from-sky-500 to-blue-500"
                                : "bg-gradient-to-br from-blue-700 to-blue-500",
                            )}
                          >
                            <span className="text-[8px] font-semibold uppercase tracking-wider opacity-80">
                              {t("waitingRoom.ticket")}
                            </span>
                            <span className="font-display text-sm font-bold leading-none">
                              {ticketLabel(item.numeroPassage)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="block truncate text-left font-display text-sm font-semibold text-slate-900 transition-colors hover:text-blue-700"
                              onClick={() => handleOpenPresentiel(item)}
                            >
                              {item.patient}
                            </button>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-blue-400" />
                                {item.waited}
                              </span>
                              <span className="text-blue-200">·</span>
                              <span>{item.room || "—"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
                              priorityTone(item.priority),
                            )}
                          >
                            {t(`priority.${item.priority}`)}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
                              statusTone(item.statut),
                            )}
                          >
                            {t(`waitingRoom.status.${item.statut}`) || item.statut}
                          </span>
                          {item.canCall && (
                            <Button
                              size="sm"
                              className={cn(
                                "h-8 gap-1 px-2.5 text-xs shadow-none",
                                item.statut === "APPELE"
                                  ? "bg-amber-500 text-white hover:bg-amber-400"
                                  : "bg-blue-700 text-white hover:bg-blue-600",
                              )}
                              disabled={busy}
                              onClick={() => handleCall(item)}
                            >
                              {busy ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Megaphone className="h-3 w-3" />
                              )}
                              {item.statut === "APPELE"
                                ? t("waitingRoom.recall")
                                : t("waitingRoom.call")}
                            </Button>
                          )}
                          {(item.canStart || item.idRendezVous) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-blue-200 px-2.5 text-xs text-blue-800 hover:bg-blue-50"
                              disabled={busy}
                              onClick={() => handleOpenPresentiel(item)}
                            >
                              {busy ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                              {item.canStart
                                ? t("waitingRoom.start")
                                : t("waitingRoom.consult")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
