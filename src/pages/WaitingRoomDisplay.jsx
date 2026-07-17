import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, Users } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { ROLE_KEYS } from "@/config/roles"
import { doctorService, receptionService } from "@/services/api"
import { getToken } from "@/services/httpClient"
import {
  createWaitingRoomLiveClient,
  disconnectWaitingRoomLiveClient,
} from "@/services/waitingRoomLiveClient"
import {
  createMedecinQueueLiveClient,
  disconnectMedecinQueueLiveClient,
} from "@/services/medecinQueueLiveClient"
import { playAndAnnounceWaitingRoomCall, unlockWaitingRoomAudio } from "@/lib/waitingRoomAudio"

const QUEUE_REFRESH_TYPES = new Set([
  "NEW_ADMISSION",
  "NEW_RDV",
  "PATIENT_EN_FILE",
  "STATUS_UPDATED",
  "PATIENT_CALLED",
  "PATIENT_RECALLED",
  "REFRESH",
])

function isCallEvent(payload) {
  return (
    payload &&
    typeof payload === "object" &&
    (payload.type === "PATIENT_CALLED" || payload.type === "PATIENT_RECALLED") &&
    (payload.idAdmission != null || payload.numeroPassage != null || payload.patientNom)
  )
}

export default function WaitingRoomDisplay() {
  const { t, locale } = useI18n()
  const { user, roleKey } = useAuth()
  const isDoctor = roleKey === ROLE_KEYS.DOCTOR
  const [live, setLive] = useState(false)
  const [soundReady, setSoundReady] = useState(false)
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [queue, setQueue] = useState([])
  const [latestArrival, setLatestArrival] = useState(null)
  const lastKeyRef = useRef(null)
  const debounceRef = useRef(null)

  const loadQueue = useCallback(async () => {
    try {
      if (isDoctor) {
        const list = await doctorService.getLiveQueue()
        setQueue(Array.isArray(list) ? list : [])
        return
      }
      const list = await receptionService.getQueue()
      const waiting = (Array.isArray(list) ? list : []).filter((row) => {
        const status = String(row.status || "").toLowerCase()
        return status === "waiting" || status === "checked-in"
      })
      setQueue(
        waiting.map((row) => ({
          id: row.id || row.idAdmission,
          idAdmission: row.idAdmission || row.id,
          patient: row.patient || row.patientName || "—",
          numeroPassage: row.numeroPassage ?? null,
          waited: row.waited || "—",
          statut: row.status === "checked-in" ? "ENREGISTRE" : "EN_ATTENTE",
          room: row.room || row.salle || "—",
        })),
      )
    } catch {
      // Keep last known queue on transient errors
    }
  }, [isDoctor])

  const scheduleQueueReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void loadQueue()
    }, 250)
  }, [loadQueue])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  useEffect(() => {
    const tenantId = user?.idHopital
    const token = getToken()
    if (!tenantId || !token) return undefined

    const handleCall = (payload) => {
      if (!isCallEvent(payload)) return
      if (isDoctor && payload.idMedecin != null && user?.idMedecin != null) {
        if (Number(payload.idMedecin) !== Number(user.idMedecin)) return
      }
      const key = `${payload.idAdmission}-${payload.appeleAt || payload.numeroPassage}-${payload.rappel ? "R" : "C"}`
      if (lastKeyRef.current === key) return
      lastKeyRef.current = key
      setCurrent(payload)
      setHistory((prev) => [payload, ...prev].slice(0, 6))
      void playAndAnnounceWaitingRoomCall(payload, locale)
      scheduleQueueReload()
    }

    const handleQueueEvent = (payload) => {
      const type = typeof payload === "string" ? payload : payload?.type
      if (!type || !QUEUE_REFRESH_TYPES.has(type)) return

      if (type === "PATIENT_EN_FILE" && typeof payload === "object") {
        if (isDoctor && payload.idMedecin != null && user?.idMedecin != null) {
          if (Number(payload.idMedecin) !== Number(user.idMedecin)) return
        }
        setLatestArrival({
          patientNom: payload.patientNom || "—",
          numeroPassage: payload.numeroPassage ?? null,
          at: Date.now(),
        })
      }

      if (isCallEvent(payload)) {
        handleCall(payload)
        return
      }
      scheduleQueueReload()
    }

    const callClient = createWaitingRoomLiveClient({
      tenantId,
      token,
      onConnect: () => setLive(true),
      onDisconnect: () => setLive(false),
      onEvent: handleCall,
    })

    const queueClient = createMedecinQueueLiveClient({
      tenantId,
      medecinId: isDoctor ? user?.idMedecin : null,
      token,
      onEvent: handleQueueEvent,
      onConnect: () => setLive(true),
      onDisconnect: () => setLive(false),
    })

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      disconnectWaitingRoomLiveClient(callClient)
      disconnectMedecinQueueLiveClient(queueClient)
    }
  }, [user?.idHopital, user?.idMedecin, isDoctor, locale, scheduleQueueReload])

  useEffect(() => {
    if (!latestArrival) return undefined
    const timer = setTimeout(() => setLatestArrival(null), 8000)
    return () => clearTimeout(timer)
  }, [latestArrival])

  const enableSound = async () => {
    await unlockWaitingRoomAudio()
    setSoundReady(true)
  }

  const waitingPatients = queue.filter((row) => row.statut !== "APPELE")

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071428] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.2),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/70">
              {user?.tenantLabel || t("waitingRoom.displayBrand")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("waitingRoom.displayTitle")}
            </h1>
            {isDoctor && (
              <p className="mt-2 max-w-xl text-sm text-sky-100/70">{t("waitingRoom.displayDoctorHint")}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-sky-100">
              <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-400" : "bg-slate-400"}`} />
              {live ? t("waitingRoom.liveOn") : t("waitingRoom.liveOff")}
            </div>
            {!soundReady && (
              <button
                type="button"
                onClick={enableSound}
                className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-400/25"
              >
                <Volume2 className="h-3.5 w-3.5" />
                {t("waitingRoom.enableSound")}
              </button>
            )}
          </div>
        </header>

        <AnimatePresence>
          {latestArrival && (
            <motion.div
              key={latestArrival.at}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-5 py-3 text-sm text-emerald-50"
            >
              <span className="font-semibold">{t("waitingRoom.newArrival")}</span>
              {" · "}
              {latestArrival.numeroPassage != null
                ? `${t("waitingRoom.ticket")} ${String(latestArrival.numeroPassage).padStart(3, "0")} — `
                : ""}
              {latestArrival.patientNom}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 grid flex-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <main className="flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div
                  key={`${current.idAdmission}-${current.numeroPassage}`}
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-md sm:p-12"
                >
                  <div className="flex items-center gap-2 text-sky-200">
                    <Volume2 className="h-5 w-5" />
                    <span className="text-sm font-medium uppercase tracking-widest">{t("waitingRoom.nowCalling")}</span>
                  </div>
                  <p className="mt-6 font-display text-7xl font-bold tracking-tight text-white sm:text-8xl">
                    {current.numeroPassage != null
                      ? String(current.numeroPassage).padStart(3, "0")
                      : "—"}
                  </p>
                  <p className="mt-4 text-2xl font-semibold text-sky-50 sm:text-3xl">{current.patientNom}</p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                      <p className="text-xs uppercase tracking-wide text-sky-200/70">{t("waitingRoom.room")}</p>
                      <p className="mt-1 text-xl font-semibold">{current.salle || "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                      <p className="text-xs uppercase tracking-wide text-sky-200/70">{t("waitingRoom.doctor")}</p>
                      <p className="mt-1 text-xl font-semibold">{current.medecinNom || "—"}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-8 py-20 text-center"
                >
                  <p className="font-display text-2xl text-sky-50/90">{t("waitingRoom.displayIdle")}</p>
                  <p className="mt-3 text-sm text-sky-100/60">
                    {isDoctor ? t("waitingRoom.displayIdleHintDoctor") : t("waitingRoom.displayIdleHint")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <aside className="flex flex-col rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sky-100">
                <Users className="h-4 w-4" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">
                  {isDoctor ? t("waitingRoom.myWaitingQueue") : t("waitingRoom.hospitalWaitingQueue")}
                </h2>
              </div>
              <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-0.5 text-xs text-sky-100">
                {waitingPatients.length}
              </span>
            </div>

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "min(58vh, 520px)" }}>
              {waitingPatients.length === 0 ? (
                <p className="py-10 text-center text-sm text-sky-100/55">{t("waitingRoom.displayQueueEmpty")}</p>
              ) : (
                waitingPatients.map((row, index) => (
                  <motion.div
                    key={row.idAdmission || row.id || `${row.patient}-${index}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.3) }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white">{row.patient}</p>
                      <p className="mt-0.5 text-xs text-sky-200/65">
                        {t(`waitingRoom.status.${row.statut}`) || row.statut}
                        {row.waited && row.waited !== "—" ? ` · ${row.waited}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-2xl font-bold tracking-tight text-sky-100">
                      {row.numeroPassage != null ? String(row.numeroPassage).padStart(3, "0") : "—"}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </aside>
        </div>

        {history.length > 1 && (
          <footer className="mt-10">
            <p className="mb-3 text-xs uppercase tracking-widest text-sky-200/60">{t("waitingRoom.recentCalls")}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {history.slice(1, 4).map((item) => (
                <div
                  key={`${item.idAdmission}-${item.numeroPassage}-${item.appeleAt}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-white">
                    {item.numeroPassage != null ? String(item.numeroPassage).padStart(3, "0") : "—"}
                  </span>
                  <span className="text-sky-100/70"> · {item.salle}</span>
                </div>
              ))}
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
