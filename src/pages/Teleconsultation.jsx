import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Calendar,
  Clock,
  Users,
  Signal,
  Plus,
  Loader2,
  Shield,
  Stethoscope,
  Sparkles,
} from "lucide-react"
import Swal from "sweetalert2"
import { Badge, Button, Avatar } from "@/components/ui/primitives"
import ScheduleTeleconsultationModal from "@/components/ScheduleTeleconsultationModal"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS } from "@/config/roles"
import { useAsync } from "@/hooks/useAsync"
import { useLiveKitRoom, primeTeleconsultationMedia } from "@/hooks/useLiveKitRoom"
import { useTeleconsultationChat } from "@/hooks/useTeleconsultationChat"
import { teleService } from "@/services/api"
import { getToken } from "@/services/httpClient"
import TeleconsultationClinicalPanel from "@/components/TeleconsultationClinicalPanel"
import PatientTeleconsultationView from "@/components/PatientTeleconsultationView"
import { MediaSecureContextBanner } from "@/components/MediaSecureContextBanner"
import { cn, initials } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1]

function normalizeTeleError(message, t) {
  if (!message) return null
  const lower = String(message).toLowerCase()
  if (
    lower.includes("invalid token") ||
    lower.includes("token expired") ||
    lower.includes("could not establish signal connection")
  ) {
    return t("tele.livekitTokenError")
  }
  if (
    lower.includes("permission denied") ||
    lower.includes("notallowederror") ||
    lower.includes("not allowed") ||
    lower.includes("permission dismissed")
  ) {
    return t("tele.permissionError")
  }
  if (lower.includes("forbidden") || lower.includes("access denied") || lower.includes("access is denied")) {
    return t("tele.accessDenied")
  }
  return message
}

function ControlButton({ active, danger, onClick, icon: Icon, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-45 disabled:hover:translate-y-0",
        danger
          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-400"
          : active
            ? "bg-white text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-sky-50"
            : "bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

export default function Teleconsultation() {
  const { t, locale } = useI18n()
  const { user, roleKey } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const rdvFromUrl = searchParams.get("rdv")

  const isDoctor = roleKey === ROLE_KEYS.DOCTOR
  const isPatient = roleKey === ROLE_KEYS.PATIENT
  const [sessionHopitalId, setSessionHopitalId] = useState(null)
  const tenantId =
    sessionHopitalId ?? user?.idHopital ?? (user?.tenant ? Number(user.tenant) : null)

  const { data: sessions, reload: reloadSessions } = useAsync(
    () => teleService.getSessions({ role: isPatient ? "patient" : "doctor" }),
    [isPatient],
  )

  const [activeRdvId, setActiveRdvId] = useState(rdvFromUrl ? Number(rdvFromUrl) : null)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [liveKitCreds, setLiveKitCreds] = useState(null)
  const [bootstrapError, setBootstrapError] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [draft, setDraft] = useState("")
  const [sendingChat, setSendingChat] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [pendingCameraStream, setPendingCameraStream] = useState(null)
  const [callEnded, setCallEnded] = useState(false)
  const autoJoinAttemptedRef = useRef(false)

  const {
    messages,
    status: chatStatus,
    error: chatError,
    sendMessage: sendChatMessage,
  } = useTeleconsultationChat({
    idRdv: activeRdvId,
    tenantId,
    token: getToken(),
    // Chat retiré de l'écran médecin — conservé uniquement pour le parcours patient
    enabled: Boolean(isPatient && activeRdvId && tenantId && getToken()),
    isDoctor,
  })

  const list = sessions || []
  const upcoming = list.filter((s) => s.status !== "live")
  const active = list.find((s) => s.idRdv === activeRdvId) || sessionInfo

  const remoteLabel = useMemo(() => {
    if (!active) return "—"
    return isPatient ? active.doctor : active.patient
  }, [active, isPatient])

  const localLabel = user?.name || t("tele.localVideoLabel")

  const {
    status: roomStatus,
    error: roomError,
    cameraDenied,
    micDenied,
    mediaError,
    showCameraWarning,
    showMicWarning,
    localVideoRef,
    remoteVideoRef,
    micOn,
    camOn,
    localVideoReady,
    toggleMic,
    toggleCam,
    enableCamera,
    enableMicrophone,
    startLocalMedia,
    disconnect,
    remoteConnected,
    remoteParticipantPresent,
  } = useLiveKitRoom({
    serverUrl: liveKitCreds?.serverUrl,
    token: liveKitCreds?.token,
    enabled: Boolean(liveKitCreds?.token && liveKitCreds?.serverUrl),
    initialCameraStream: pendingCameraStream,
  })

  const handleStartCamera = useCallback(async () => {
    setStartingCamera(true)
    try {
      const stream = pendingCameraStream || (await primeTeleconsultationMedia())
      if (stream && !pendingCameraStream) {
        setPendingCameraStream(stream)
      }
      await startLocalMedia()
    } finally {
      setStartingCamera(false)
    }
  }, [startLocalMedia, pendingCameraStream])

  const joinSession = useCallback(
    async (idRdv, { requestCamera = false } = {}) => {
      if (!idRdv) return
      setCallEnded(false)
      setBootstrapping(true)
      setBootstrapError(null)
      setLiveKitCreds(null)
      setPendingCameraStream(null)
      disconnect()

      let preflight = null
      if (requestCamera) {
        preflight = await primeTeleconsultationMedia()
      }

      try {
        const rdv = await teleService.getRendezVous(idRdv)
        if ((rdv.canal || "").toUpperCase() !== "TELECONSULTATION") {
          throw new Error(t("tele.connectionError"))
        }

        const tokenPayload = await teleService.getToken(idRdv)
        if (!tokenPayload?.token || !tokenPayload?.serverUrl) {
          throw new Error(t("tele.connectionError"))
        }

        const mapped = mapTeleFromRdv(rdv)
        setSessionInfo(mapped)
        setSessionHopitalId(rdv.idHopital ?? null)
        setActiveRdvId(idRdv)
        setPendingCameraStream(preflight)
        setLiveKitCreds(tokenPayload)
        setSearchParams({ rdv: String(idRdv) }, { replace: true })
      } catch (err) {
        preflight?.getTracks().forEach((track) => track.stop())
        setPendingCameraStream(null)
        const apiMessage = err?.payload?.message || err?.message
        setBootstrapError(normalizeTeleError(apiMessage, t) || t("tele.connectionError"))
        setLiveKitCreds(null)
      } finally {
        setBootstrapping(false)
      }
    },
    [disconnect, setSearchParams, t],
  )

  useEffect(() => {
    autoJoinAttemptedRef.current = false
    setCallEnded(false)
  }, [rdvFromUrl])

  useEffect(() => {
    if (!rdvFromUrl || bootstrapping || callEnded) return
    const id = Number(rdvFromUrl)
    if (Number.isNaN(id)) return
    // Déjà connecté à cette séance
    if (liveKitCreds && activeRdvId === id) return
    if (autoJoinAttemptedRef.current) return
    autoJoinAttemptedRef.current = true
    joinSession(id, { requestCamera: true })
  }, [rdvFromUrl, joinSession, liveKitCreds, bootstrapping, callEnded, activeRdvId])

  function mapTeleFromRdv(rdv) {
    const item = {
      idRdv: rdv.idRdv,
      idHopital: rdv.idHopital,
      patient: rdv.nomPatient || "—",
      doctor: rdv.nomMedecin || "—",
      reason: rdv.motifVisite || "—",
      specialty: "—",
      status: "live",
    }
    return item
  }

  async function handleEndCall() {
    const result = await Swal.fire({
      icon: "question",
      title: t("tele.endCall"),
      text: t("tele.endCallConfirm"),
      showCancelButton: true,
      confirmButtonText: t("tele.endCall"),
      cancelButtonText: t("common.cancel"),
    })
    if (!result.isConfirmed) return
    disconnect()
    setLiveKitCreds(null)
    setPendingCameraStream(null)
    setBootstrapError(null)
    setActiveRdvId(null)
    setSessionInfo(null)
    setSessionHopitalId(null)
    setCallEnded(true)
    setSearchParams({}, { replace: true })
  }

  async function handleScheduleSession(formData) {
    if (!user?.idMedecin) {
      throw new Error(t("tele.scheduleNoDoctor"))
    }

    setScheduling(true)
    try {
      const motif = formData.notes ? `${formData.motif} — ${formData.notes}` : formData.motif

      const created = await teleService.scheduleSession({
        idPatient: Number(formData.patientId),
        idMedecin: user.idMedecin,
        dateHeureRdv: `${formData.date}T${formData.time}:00`,
        dureeEstimee: formData.duration,
        motifVisite: motif,
        canal: "TELECONSULTATION",
        statutRdv: "PROGRAMME",
      })

      setIsScheduleOpen(false)
      reloadSessions()
      await Swal.fire({
        icon: "success",
        title: t("tele.scheduleConfirm"),
        text: t("tele.scheduleSuccess"),
        timer: 2200,
        showConfirmButton: false,
      })

      if (created?.idRdv) {
        await joinSession(created.idRdv, { requestCamera: true })
      }
    } finally {
      setScheduling(false)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!draft.trim() || !activeRdvId || sendingChat) return
    setSendingChat(true)
    const content = draft.trim()
    setDraft("")
    const ok = await sendChatMessage(content)
    if (!ok) {
      setDraft(content)
    }
    setSendingChat(false)
  }

  const chatStatusLabel = useMemo(() => {
    if (!activeRdvId) return null
    if (chatStatus === "connected") return t("tele.chatLive")
    if (chatStatus === "connecting") return t("tele.chatConnecting")
    if (chatStatus === "offline") return t("tele.chatOffline")
    return null
  }, [activeRdvId, chatStatus, t])

  const displayError = normalizeTeleError(bootstrapError || roomError, t)
  const mediaPermissionMessage = useMemo(() => {
    if (localVideoReady || camOn) {
      if (showMicWarning) return t("tele.permissionMic")
      return null
    }

    if (showCameraWarning || mediaError === "permission" || cameraDenied) {
      return t("tele.permissionCamera")
    }
    if (showMicWarning || mediaError === "mic-permission") return t("tele.permissionMic")
    if (mediaError === "not-found") return t("tele.cameraNotFound")
    if (mediaError === "in-use") return t("tele.cameraInUse")
    if (mediaError === "insecure-context") return t("tele.insecureContext")
    if (mediaError === "not-supported") return t("tele.mediaNotSupported")
    if (mediaError === "not-connected") return t("tele.connectionError")
    if (/permission denied|not allowed/i.test(bootstrapError || roomError || "")) {
      return t("tele.permissionError")
    }
    return null
  }, [
    localVideoReady,
    camOn,
    showCameraWarning,
    showMicWarning,
    mediaError,
    cameraDenied,
    bootstrapError,
    roomError,
    t,
  ])
  const isConnected = roomStatus === "connected"
  const isConnecting = bootstrapping || roomStatus === "connecting"

  if (isPatient) {
    return (
      <PatientTeleconsultationView
        t={t}
        locale={locale}
        user={user}
        upcoming={upcoming}
        active={active}
        activeRdvId={activeRdvId}
        remoteLabel={remoteLabel}
        localLabel={localLabel}
        displayError={displayError}
        mediaPermissionMessage={mediaPermissionMessage}
        handleStartCamera={handleStartCamera}
        startingCamera={startingCamera}
        enableMicrophone={enableMicrophone}
        showCameraWarning={showCameraWarning}
        showMicWarning={showMicWarning}
        mediaError={mediaError}
        localVideoReady={localVideoReady}
        camOn={camOn}
        isConnected={isConnected}
        isConnecting={isConnecting}
        remoteConnected={remoteConnected}
        remoteParticipantPresent={remoteParticipantPresent}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        micOn={micOn}
        toggleMic={toggleMic}
        toggleCam={toggleCam}
        handleEndCall={handleEndCall}
        liveKitCreds={liveKitCreds}
        messages={messages}
        chatError={chatError}
        chatStatusLabel={chatStatusLabel}
        chatStatus={chatStatus}
        draft={draft}
        setDraft={setDraft}
        sendMessage={sendMessage}
        sendingChat={sendingChat}
        joinSession={joinSession}
      />
    )
  }

  return (
    <div className="relative isolate min-h-[calc(100vh-7rem)] space-y-5 pb-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-[-1.5rem] -top-8 -z-10 h-[520px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_-10%,rgba(37,99,235,0.2),transparent_50%),radial-gradient(ellipse_at_90%_5%,rgba(14,165,233,0.16),transparent_45%),radial-gradient(ellipse_at_50%_35%,rgba(59,130,246,0.07),transparent_55%)]" />
        <motion.div
          className="absolute -left-8 top-8 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ x: [0, 18, 0], y: [0, 14, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-4 top-20 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl"
          animate={{ x: [0, -16, 0], y: [0, 20, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:linear-gradient(180deg,black_25%,transparent)]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative overflow-hidden rounded-[2rem] border border-blue-200/60 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(125,211,252,0.22),transparent_40%)]" />
        <div className="pointer-events-none absolute -right-6 bottom-0 h-36 w-36 rounded-[1.75rem] border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute right-20 top-6 h-20 w-20 rotate-12 rounded-2xl border border-white/10 bg-white/5" />

        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-white/20 backdrop-blur-sm">
                <Stethoscope className="h-3.5 w-3.5" />
                Shambua
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-sky-50 ring-1 ring-white/15 backdrop-blur-sm">
                <Shield className="h-3.5 w-3.5" />
                {t("tele.secureBadge")}
              </span>
              {isConnected && (
                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-400/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-50 ring-1 ring-emerald-300/30">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  </span>
                  {t("tele.inSession")}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-sky-100/85">
                {user?.tenantLabel || t("waitingRoom.displayBrand")}
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                {t("tele.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-sky-50/80 sm:text-[15px]">
                {t("tele.subtitlePremium", {
                  doctor: user?.name || "—",
                  hospital: user?.tenantLabel || t("waitingRoom.displayBrand"),
                })}
              </p>
            </div>
          </div>

          {isDoctor && (
            <Button
              size="lg"
              className="h-12 gap-2 bg-white px-6 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-950/20 hover:bg-sky-50"
              onClick={() => setIsScheduleOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("tele.schedule")}
            </Button>
          )}
        </div>
      </motion.section>

      {isDoctor && (
        <ScheduleTeleconsultationModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          onSave={handleScheduleSession}
          loading={scheduling}
        />
      )}

      <AnimatePresence>
        {displayError && !mediaPermissionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {displayError}
          </motion.div>
        )}
      </AnimatePresence>

      <MediaSecureContextBanner className="mb-0" />

      {mediaPermissionMessage && (
        <div className="rounded-2xl border border-amber-300/50 bg-gradient-to-r from-amber-50 to-orange-50/40 px-4 py-4 text-sm text-amber-950">
          <p>{mediaPermissionMessage}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(showCameraWarning || mediaError === "not-found" || mediaError === "in-use") && !localVideoReady && !camOn && (
              <Button type="button" size="sm" className="gap-2 bg-blue-700 text-white hover:bg-blue-600" onClick={handleStartCamera} disabled={startingCamera}>
                <Video className="h-4 w-4" />
                {t("tele.enableCamera")}
              </Button>
            )}
            {showMicWarning && (
              <Button type="button" size="sm" variant="outline" className="gap-2 border-amber-300" onClick={enableMicrophone}>
                <Mic className="h-4 w-4" />
                {t("tele.enableMic")}
              </Button>
            )}
          </div>
        </div>
      )}

      {isConnected && !localVideoReady && !mediaPermissionMessage && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50/50 px-4 py-4 text-sm text-blue-950">
          <p>{t("tele.startCameraPrompt")}</p>
          <Button type="button" size="sm" className="mt-3 gap-2 bg-blue-700 text-white hover:bg-blue-600" onClick={handleStartCamera} disabled={startingCamera}>
            {startingCamera ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            {startingCamera ? t("tele.startCameraLoading") : t("tele.startCameraAction")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease }}
            className="overflow-hidden rounded-[2rem] border border-blue-200/70 bg-white shadow-[0_24px_60px_-32px_rgba(37,99,235,0.45)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-blue-50 bg-gradient-to-r from-blue-50/90 to-transparent px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                  <Sparkles className="h-3 w-3" />
                  {t("tele.studioLabel")}
                </span>
                <span className="hidden text-xs text-slate-500 sm:inline">
                  {active ? remoteLabel : t("tele.noActive")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Signal className={cn("h-3.5 w-3.5", isConnected ? "text-emerald-500" : "text-amber-500")} />
                {isConnected ? t("tele.connected") : t("tele.hdQuality")}
              </div>
            </div>

            <div className="relative aspect-video w-full bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.25),transparent_45%)]" />

              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={cn(
                  "absolute inset-0 z-0 h-full w-full object-cover object-center",
                  remoteConnected ? "opacity-100" : "opacity-0",
                )}
              />

              {!remoteConnected && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
                  {isConnecting ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-100" />
                      </div>
                      <p className="text-sm font-medium text-sky-100/90">{t("tele.connecting")}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-white/20 to-white/5 font-display text-3xl font-bold text-white ring-1 ring-white/20 backdrop-blur-md">
                        {active ? initials(remoteLabel) : "—"}
                      </div>
                      <div className="text-center">
                        <p className="font-display text-xl font-semibold text-white sm:text-2xl">
                          {active ? remoteLabel : t("tele.noActive")}
                        </p>
                        <p className="mt-1.5 max-w-sm px-4 text-sm text-sky-100/70">
                          {active
                            ? remoteParticipantPresent
                              ? t("tele.remoteNoCamera")
                              : t("tele.waitingRemote")
                            : t("tele.selectSessionHint")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl bg-blue-950/45 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur-md">
                <Signal className={cn("h-3.5 w-3.5", isConnected ? "text-emerald-400" : "text-amber-300")} />
                {isConnected
                  ? remoteConnected
                    ? t("tele.remoteConnected")
                    : remoteParticipantPresent
                      ? t("tele.remoteNoCamera")
                      : t("tele.waitingRemote")
                  : t("tele.hdQuality")}
              </div>

              {active && (
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl bg-blue-950/45 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5 text-sky-200" />
                  RDV #{active.idRdv || activeRdvId}
                </div>
              )}

              <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-blue-950/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-100/90 ring-1 ring-white/10 backdrop-blur-md">
                {t("tele.remoteVideoLabel")}: {remoteLabel}
              </div>

              <div className="absolute bottom-4 right-4 z-20 h-36 w-52 overflow-hidden rounded-2xl border-2 border-white/25 bg-blue-950 shadow-xl shadow-blue-950/40 sm:h-40 sm:w-60">
                <div className="relative h-full w-full">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover object-center",
                      "[transform:scaleX(-1)]",
                      localVideoReady ? "z-10 opacity-100" : "z-0 opacity-0",
                    )}
                  />

                  {!localVideoReady && isConnected && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-blue-950/90 px-2 text-center text-white">
                      <Avatar name={localLabel} className="h-12 w-12 text-sm" />
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        disabled={startingCamera}
                        className="mt-1 text-[10px] text-sky-100 underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        {startingCamera ? t("tele.startCameraLoading") : t("tele.startCameraAction")}
                      </button>
                    </div>
                  )}

                  {!localVideoReady && !isConnected && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-blue-950/90 text-sky-100/70">
                      {isConnecting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <VideoOff className="h-5 w-5" />
                          <span className="text-xs">{t("tele.cameraOff")}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="pointer-events-none absolute left-2 top-2 z-30 rounded-md bg-blue-950/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {t("tele.localVideoLabel")}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/15 bg-blue-950/50 px-4 py-3 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
                <ControlButton
                  active={micOn}
                  onClick={toggleMic}
                  icon={micOn ? Mic : MicOff}
                  label={t("tele.toggleMic")}
                  disabled={!isConnected}
                />
                <ControlButton
                  active={camOn || localVideoReady}
                  onClick={toggleCam}
                  icon={camOn || localVideoReady ? Video : VideoOff}
                  label={t("tele.toggleCam")}
                  disabled={!isConnected}
                />
                <ControlButton
                  danger
                  icon={PhoneOff}
                  label={t("tele.endCall")}
                  onClick={handleEndCall}
                  disabled={!liveKitCreds}
                />
              </div>
            </div>
          </motion.div>

          {active && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white/95 p-4 shadow-[0_1px_0_rgba(37,99,235,0.06)] backdrop-blur-sm sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 font-display text-sm font-bold text-white">
                    {initials(remoteLabel)}
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-slate-900">{remoteLabel}</p>
                    <p className="text-xs text-slate-500">{active.reason}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-100">
                    {t("appointments.colPatient")}
                  </span>
                  {isConnected && (
                    <Badge className="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70">{t("tele.connected")}</Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {isDoctor && activeRdvId && (
            <TeleconsultationClinicalPanel
              idRdv={activeRdvId}
              patientName={active?.patient}
              motif={active?.reason}
              enabled={Boolean(activeRdvId)}
              sessionReady={Boolean(liveKitCreds?.token)}
            />
          )}
        </div>

        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease }}
          className="flex min-h-[420px] flex-col overflow-hidden rounded-[2rem] border border-blue-100/90 bg-white/95 shadow-[0_1px_0_rgba(37,99,235,0.05)] backdrop-blur-sm"
        >
          <div className="flex items-end justify-between gap-3 border-b border-blue-50 bg-gradient-to-r from-blue-50/90 to-transparent px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
                  {t("tele.upcoming")}
                </h2>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{t("tele.sessionsHint")}</p>
            </div>
            <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white">
              {upcoming.length}
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
            {upcoming.map((s, index) => {
              const sid = s.idRdv || s.id
              const isActiveSession = Number(sid) === Number(activeRdvId)
              return (
                <motion.div
                  key={sid}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.28), duration: 0.35, ease }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-3.5 transition-all duration-300",
                    isActiveSession
                      ? "border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50/70 shadow-sm shadow-blue-500/10"
                      : "border-blue-50 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                  )}
                >
                  {isActiveSession && (
                    <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-blue-600" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-gradient-to-b from-blue-600 to-sky-500 py-2 text-white shadow-sm shadow-blue-600/20">
                      <Calendar className="mb-1 h-3 w-3 opacity-80" />
                      <span className="font-display text-sm font-bold leading-none">{s.time || "—"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-slate-900">
                        {isPatient ? s.doctor : s.patient}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{s.reason}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className={cn(
                            "h-8 gap-1.5 text-xs shadow-none",
                            isActiveSession
                              ? "bg-emerald-600 text-white hover:bg-emerald-500"
                              : "bg-blue-700 text-white hover:bg-blue-600",
                          )}
                          onClick={() => joinSession(sid, { requestCamera: true })}
                        >
                          <Video className="h-3.5 w-3.5" />
                          {isActiveSession ? t("tele.connected") : t("tele.joinSession")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {upcoming.length === 0 && (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Video className="h-6 w-6" />
                </div>
                <p className="mt-4 font-display text-sm font-semibold text-slate-900">{t("tele.noActive")}</p>
                <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-slate-500">
                  {t("tele.noUpcomingHint")}
                </p>
                {isDoctor && (
                  <Button
                    size="sm"
                    className="mt-4 gap-1.5 bg-blue-700 text-white hover:bg-blue-600"
                    onClick={() => setIsScheduleOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("tele.schedule")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.aside>
      </div>
    </div>
  )
}
