import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Calendar,
  Clock,
  Send,
  Check,
  CheckCheck,
  Users,
  Signal,
  Plus,
  Loader2,
} from "lucide-react"
import Swal from "sweetalert2"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardHeader, CardContent, CardTitle, Badge, Button, Avatar, Input } from "@/components/ui/primitives"
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
        "flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-105 disabled:opacity-50",
        danger
          ? "bg-destructive text-destructive-foreground hover:opacity-90"
          : active
            ? "bg-white/15 text-white hover:bg-white/25"
            : "bg-destructive/90 text-destructive-foreground hover:bg-destructive",
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
    enabled: Boolean(activeRdvId && tenantId && getToken()),
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
    if (!rdvFromUrl || liveKitCreds || bootstrapping || callEnded) return
    const id = Number(rdvFromUrl)
    if (Number.isNaN(id)) return
    if (autoJoinAttemptedRef.current) return
    autoJoinAttemptedRef.current = true
    joinSession(id)
  }, [rdvFromUrl, joinSession, liveKitCreds, bootstrapping, callEnded])

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
    <div>
      <PageHeader
        title={t("tele.title")}
        subtitle={t("tele.subtitle")}
        actions={
          isDoctor ? (
            <Button onClick={() => setIsScheduleOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("tele.schedule")}
            </Button>
          ) : null
        }
      />

      {isDoctor && (
        <ScheduleTeleconsultationModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          onSave={handleScheduleSession}
          loading={scheduling}
        />
      )}

      {displayError && !mediaPermissionMessage && (
        <Card className="mb-4 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {displayError}
        </Card>
      )}

      <MediaSecureContextBanner className="mb-4" />

      {mediaPermissionMessage && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          <p>{mediaPermissionMessage}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(showCameraWarning || mediaError === "not-found" || mediaError === "in-use") && !localVideoReady && !camOn && (
              <Button type="button" size="sm" variant="outline" onClick={handleStartCamera} disabled={startingCamera}>
                <Video className="h-4 w-4" />
                {t("tele.enableCamera")}
              </Button>
            )}
            {showMicWarning && (
              <Button type="button" size="sm" variant="outline" onClick={enableMicrophone}>
                <Mic className="h-4 w-4" />
                {t("tele.enableMic")}
              </Button>
            )}
          </div>
        </Card>
      )}

      {isConnected && !localVideoReady && !mediaPermissionMessage && (
        <Card className="mb-4 border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="text-foreground">{t("tele.startCameraPrompt")}</p>
          <Button type="button" size="sm" className="mt-3" onClick={handleStartCamera} disabled={startingCamera}>
            {startingCamera ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            {startingCamera ? t("tele.startCameraLoading") : t("tele.startCameraAction")}
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-video w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-white/80" />
                      <p className="text-sm text-white/80">{t("tele.connecting")}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white backdrop-blur">
                        {active ? initials(remoteLabel) : "—"}
                      </div>
                      <p className="font-display text-lg font-semibold text-white">
                        {active ? remoteLabel : t("tele.noActive")}
                      </p>
                      <p className="text-sm text-white/70">
                        {active
                          ? remoteParticipantPresent
                            ? t("tele.remoteNoCamera")
                            : t("tele.waitingRemote")
                          : t("tele.selectSessionHint")}
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                <Signal className={cn("h-3.5 w-3.5", isConnected ? "text-success" : "text-warning")} />
                {isConnected
                  ? remoteConnected
                    ? t("tele.remoteConnected")
                    : remoteParticipantPresent
                      ? t("tele.remoteNoCamera")
                      : t("tele.waitingRemote")
                  : t("tele.hdQuality")}
              </div>

              <div className="absolute left-4 bottom-4 rounded-full bg-black/40 px-3 py-1 text-[10px] font-medium text-white backdrop-blur">
                {t("tele.remoteVideoLabel")}: {remoteLabel}
              </div>

              {active && (
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                  <Clock className="h-3.5 w-3.5" />
                  RDV #{active.idRdv || activeRdvId}
                </div>
              )}

              <div className="absolute bottom-4 right-4 z-20 h-36 w-52 overflow-hidden rounded-xl border-2 border-white/20 bg-black shadow-lg sm:h-40 sm:w-60">
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
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-slate-900/90 px-2 text-center text-white">
                      <Avatar name={localLabel} className="h-12 w-12 text-sm" />
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        disabled={startingCamera}
                        className="mt-1 text-[10px] text-white/90 underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        {startingCamera ? t("tele.startCameraLoading") : t("tele.startCameraAction")}
                      </button>
                    </div>
                  )}

                  {!localVideoReady && !isConnected && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-slate-900/90 text-white/70">
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

                  <div className="pointer-events-none absolute left-2 top-2 z-30 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {t("tele.localVideoLabel")}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/40 px-4 py-2.5 backdrop-blur">
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
          </Card>

          {active && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={remoteLabel} />
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{remoteLabel}</p>
                    <p className="text-xs text-muted-foreground">{active.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{isPatient ? t("tele.doctor") : t("appointments.colPatient")}</p>
                    <p className="font-medium text-foreground">{remoteLabel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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

        <div className="space-y-6">
          <Card className="flex h-[26rem] flex-col">
            <CardHeader className="items-center">
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <CardTitle>{t("tele.chat")}</CardTitle>
                </div>
                {chatStatusLabel && (
                  <Badge variant={chatStatus === "connected" ? "default" : "secondary"}>{chatStatusLabel}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("tele.chatSecure")}</p>
            </CardHeader>
            {chatError && (
              <p className="px-5 text-xs text-destructive">{chatError}</p>
            )}
            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-5 py-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  {activeRdvId ? t("tele.typeMessage") : t("tele.noActive")}
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id || `${m.time}-${m.text}`}
                  className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                      m.mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>{m.time}</span>
                    {m.mine && (
                      <span className="inline-flex items-center gap-0.5" title={m.readByRecipient ? t("tele.chatRead") : t("tele.chatSent")}>
                        {m.readByRecipient ? (
                          <CheckCheck className="h-3 w-3 text-primary" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border p-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("tele.typeMessage")}
                className="flex-1"
                disabled={!activeRdvId || sendingChat}
              />
              <Button type="submit" size="icon" aria-label={t("tele.send")} disabled={!activeRdvId || sendingChat}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader className="items-center">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle>{t("tele.upcoming")}</CardTitle>
              </div>
              <Badge>{upcoming.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((s) => (
                <div
                  key={s.idRdv || s.id}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <Avatar name={isPatient ? s.doctor : s.patient} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {isPatient ? s.doctor : s.patient}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{s.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {s.time}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => joinSession(s.idRdv || s.id, { requestCamera: true })}>
                      {t("tele.joinSession")}
                    </Button>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">{t("tele.noActive")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
