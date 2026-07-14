import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2 } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { getToken } from "@/services/httpClient"
import {
  createWaitingRoomLiveClient,
  disconnectWaitingRoomLiveClient,
} from "@/services/waitingRoomLiveClient"
import { playAndAnnounceWaitingRoomCall, unlockWaitingRoomAudio } from "@/lib/waitingRoomAudio"

export default function WaitingRoomDisplay() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const [live, setLive] = useState(false)
  const [soundReady, setSoundReady] = useState(false)
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const lastKeyRef = useRef(null)

  useEffect(() => {
    const tenantId = user?.idHopital
    const token = getToken()
    if (!tenantId || !token) return undefined

    const client = createWaitingRoomLiveClient({
      tenantId,
      token,
      onConnect: () => setLive(true),
      onDisconnect: () => setLive(false),
      onEvent: (payload) => {
        if (!payload || payload.type === "REFRESH") return
        const key = `${payload.idAdmission}-${payload.appeleAt || payload.numeroPassage}-${payload.rappel ? "R" : "C"}`
        if (lastKeyRef.current === key) return
        lastKeyRef.current = key
        setCurrent(payload)
        setHistory((prev) => [payload, ...prev].slice(0, 6))
        void playAndAnnounceWaitingRoomCall(payload, locale)
      },
    })

    return () => disconnectWaitingRoomLiveClient(client)
  }, [user?.idHopital, locale])

  const enableSound = async () => {
    await unlockWaitingRoomAudio()
    setSoundReady(true)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071428] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.2),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/70">
              {user?.tenantLabel || t("waitingRoom.displayBrand")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("waitingRoom.displayTitle")}
            </h1>
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

        <main className="mt-10 flex flex-1 flex-col justify-center">
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
                <p className="mt-3 text-sm text-sky-100/60">{t("waitingRoom.displayIdleHint")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

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
