import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useRolePath } from "@/hooks/useRolePath"
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Mic,
  MicOff,
  PhoneOff,
  Shield,
  Signal,
  Stethoscope,
  Video,
  VideoOff,
} from "lucide-react"
import { Button, Avatar } from "@/components/ui/primitives"
import { cn, initials, formatDateTime } from "@/lib/utils"
import {
  formatTeleconsultationLabel,
  formatTeleconsultationNumero,
} from "@/lib/teleconsultation"
import { MediaSecureContextBanner } from "@/components/MediaSecureContextBanner"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80"

function ControlButton({ active, danger, onClick, icon: Icon, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-45",
        danger
          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/35 hover:bg-rose-400"
          : active
            ? "bg-white text-blue-800 shadow-lg shadow-blue-950/25 hover:bg-sky-50"
            : "bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function SessionRow({ session, isActive, onJoin, t, index, locale = "fr", tenantId }) {
  const idRdv = session.idRdv || session.id
  const numero =
    session.numero || formatTeleconsultationNumero(idRdv, session.idHopital || tenantId)
  const label =
    session.label ||
    formatTeleconsultationLabel(
      idRdv,
      session.idHopital || tenantId,
      session.reason,
      locale === "en" ? "en" : "fr",
    )
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25) }}
      onClick={() => onJoin(idRdv, { requestCamera: true })}
      className={cn(
        "group flex w-full items-center gap-3 border-b border-blue-900/6 py-3 text-left transition-colors",
        "hover:border-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30",
        isActive && "bg-blue-50/60",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl shadow-md",
          isActive
            ? "bg-blue-800 text-sky-100 shadow-blue-900/30"
            : "bg-sky-200 text-blue-900 shadow-sky-400/30",
        )}
      >
        <span className="text-[9px] font-semibold uppercase leading-none opacity-80">
          {t("tele.patient.slot")}
        </span>
        <span
          className="text-xs font-semibold tabular-nums leading-none"
          style={{ fontFamily: '"Fraunces", "Sora", serif' }}
        >
          {session.time}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-800/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-blue-900">
            {numero}
          </span>
          <span className="text-[10px] font-medium text-blue-800/45">
            {t("tele.rdvNumber", { id: idRdv })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Avatar name={session.doctor} className="h-8 w-8 text-[10px]" />
          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold text-[#0b1f4a]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {session.doctor}
            </p>
            <p className="truncate text-xs text-blue-800/55">{label}</p>
          </div>
        </div>
        {session.date && session.date !== "—" && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-800/45">
            <Clock className="h-3 w-3" />
            {session.date}
          </p>
        )}
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition",
          isActive
            ? "bg-blue-800 text-white"
            : "bg-blue-800/8 text-blue-900 group-hover:bg-blue-800 group-hover:text-white",
        )}
      >
        <Video className="h-3 w-3" />
        {isActive ? t("tele.connected") : t("tele.joinSession")}
      </span>
    </motion.button>
  )
}

/**
 * Espace téléconsultation patient — expérience premium Shambua Santé.
 */
export default function PatientTeleconsultationView({
  t,
  locale,
  user,
  upcoming,
  active,
  activeRdvId,
  remoteLabel,
  localLabel,
  displayError,
  mediaPermissionMessage,
  handleStartCamera,
  startingCamera,
  enableMicrophone,
  showCameraWarning,
  showMicWarning,
  mediaError,
  localVideoReady,
  camOn,
  isConnected,
  isConnecting,
  remoteConnected,
  remoteParticipantPresent,
  localVideoRef,
  remoteVideoRef,
  micOn,
  toggleMic,
  toggleCam,
  handleEndCall,
  liveKitCreds,
  joinSession,
}) {
  const { path } = useRolePath()
  const firstName = (user?.name || "").split(" ")[0] || t("roles.patient")
  const nextSession = upcoming[0] || null
  const tenantId = user?.idHopital ?? (user?.tenant ? Number(user.tenant) : null)
  const activeNumero =
    active?.numero ||
    (activeRdvId
      ? formatTeleconsultationNumero(active?.idRdv || activeRdvId, active?.idHopital || tenantId)
      : null)
  const activeLabel =
    active?.label ||
    (activeRdvId
      ? formatTeleconsultationLabel(
          active?.idRdv || activeRdvId,
          active?.idHopital || tenantId,
          active?.reason,
          locale === "en" ? "en" : "fr",
        )
      : null)

  return (
    <div className="relative -mx-3 min-h-[calc(100vh-6.5rem)] overflow-hidden pb-12 sm:-mx-4 lg:-mx-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 0% -5%, rgba(37, 99, 235, 0.12), transparent 50%), radial-gradient(ellipse 80% 55% at 100% 5%, rgba(56, 189, 248, 0.1), transparent 45%), linear-gradient(180deg, #f0f5fb 0%, #eef3f9 45%, #f4f7fb 100%)",
        }}
      />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]"
        style={{ minHeight: "min(52vh, 22rem)" }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center 35%" }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(15, 40, 80, 0.95) 0%, rgba(23, 58, 120, 0.9) 42%, rgba(37, 99, 235, 0.5) 72%, rgba(56, 140, 220, 0.28) 100%)",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/4 h-52 w-52 rounded-full bg-sky-300/25 blur-3xl"
          animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative flex h-full min-h-[inherit] flex-col justify-end px-6 py-9 sm:px-10 sm:py-11 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="max-w-2xl"
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-200"
              style={{ fontFamily: '"Sora", sans-serif' }}
            >
              {t("tele.patient.secured")}
            </p>
            <h1
              className="mt-3 text-[2.2rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-[3rem]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              Shambua Santé
            </h1>
            <p
              className="mt-2 text-lg font-medium text-sky-100 sm:text-xl"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {t("tele.patient.studioTitle")}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-50/75">
              {t("tele.patient.greeting", { name: firstName })} — {t("tele.patient.studioSubtitle")}
            </p>

            {nextSession && (
              <div className="mt-4 inline-flex max-w-full flex-col gap-1.5 rounded-xl border border-white/15 bg-blue-950/35 px-4 py-3 backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-sky-300/20 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-sky-100">
                    {nextSession.numero ||
                      formatTeleconsultationNumero(
                        nextSession.idRdv || nextSession.id,
                        nextSession.idHopital || tenantId,
                      )}
                  </span>
                  <span className="text-[11px] font-medium text-sky-100/70">
                    {t("tele.rdvNumber", { id: nextSession.idRdv || nextSession.id })}
                  </span>
                </div>
                <p
                  className="truncate text-sm font-semibold text-white"
                  style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                >
                  {nextSession.label ||
                    formatTeleconsultationLabel(
                      nextSession.idRdv || nextSession.id,
                      nextSession.idHopital || tenantId,
                      nextSession.reason,
                      locale === "en" ? "en" : "fr",
                    )}
                </p>
                <p className="truncate text-xs text-sky-100/70">
                  {nextSession.doctor}
                  {nextSession.time ? ` · ${nextSession.time}` : ""}
                  {nextSession.date && nextSession.date !== "—" ? ` · ${nextSession.date}` : ""}
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {nextSession ? (
                <Button
                  size="lg"
                  className="h-12 gap-2.5 rounded-xl border-0 bg-sky-300 px-6 text-[15px] font-semibold text-[#0b1f4a] shadow-xl shadow-blue-950/30 transition-transform hover:scale-[1.02] hover:bg-sky-200"
                  onClick={() =>
                    joinSession(nextSession.idRdv || nextSession.id, { requestCamera: true })
                  }
                >
                  <Video className="h-4 w-4" />
                  {t("tele.joinSession")}
                </Button>
              ) : (
                <Link to={path("/appointments")}>
                  <Button
                    size="lg"
                    className="h-12 gap-2.5 rounded-xl border-0 bg-sky-300 px-6 text-[15px] font-semibold text-[#0b1f4a] shadow-xl shadow-blue-950/30 hover:bg-sky-200"
                  >
                    <CalendarDays className="h-4 w-4" />
                    {t("nav.appointments")}
                  </Button>
                </Link>
              )}
              <span className="inline-flex items-center gap-2 text-xs text-white/70">
                <Lock className="h-3.5 w-3.5 text-sky-200" />
                {user?.tenantLabel || "Shambua Santé"}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Alerts */}
      <div className="mt-5 space-y-3 px-1 sm:px-2">
        {displayError && !mediaPermissionMessage && (
          <p className="rounded-xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
            {displayError}
          </p>
        )}
        <MediaSecureContextBanner className="mb-0" />
        {mediaPermissionMessage && (
          <div className="rounded-xl border border-amber-300/50 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <p>{mediaPermissionMessage}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(showCameraWarning ||
                mediaError === "not-found" ||
                mediaError === "in-use" ||
                mediaError === "not-supported") &&
                !localVideoReady &&
                !camOn && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-amber-400/40 bg-white"
                    onClick={handleStartCamera}
                    disabled={startingCamera}
                  >
                    <Video className="h-4 w-4" />
                    {t("tele.enableCamera")}
                  </Button>
                )}
              {showMicWarning && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-amber-400/40 bg-white"
                  onClick={enableMicrophone}
                >
                  <Mic className="h-4 w-4" />
                  {t("tele.enableMic")}
                </Button>
              )}
            </div>
          </div>
        )}
        {isConnected && !localVideoReady && !mediaPermissionMessage && mediaError !== "insecure-context" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-3 text-sm text-blue-950">
            <p>{t("tele.startCameraPrompt")}</p>
            <Button
              type="button"
              size="sm"
              className="mt-3 gap-2 bg-blue-800 text-white hover:bg-blue-900"
              onClick={handleStartCamera}
              disabled={startingCamera}
            >
              {startingCamera ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              {startingCamera ? t("tele.startCameraLoading") : t("tele.startCameraAction")}
            </Button>
          </div>
        )}
      </div>

      {/* Stage + side panels */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 grid grid-cols-1 gap-6 px-1 sm:px-2 xl:grid-cols-3"
      >
        <div className="space-y-5 xl:col-span-2">
          {/* Video stage */}
          <div className="overflow-hidden rounded-[1.35rem] border border-blue-900/10 shadow-2xl shadow-blue-950/15 ring-1 ring-white/40">
            <div className="relative aspect-video w-full bg-gradient-to-br from-[#071428] via-[#0b1f4a] to-[#1e40af]">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-sky-300" />
                      <p className="text-sm font-medium text-white/90">{t("tele.connecting")}</p>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl font-semibold text-white shadow-2xl backdrop-blur-md"
                        style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                      >
                        {active ? initials(remoteLabel) : <Video className="h-10 w-10 text-sky-200" />}
                      </motion.div>
                      <div>
                        <p
                          className="text-xl font-semibold text-white sm:text-2xl"
                          style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                        >
                          {active ? remoteLabel : t("tele.patient.noSessionTitle")}
                        </p>
                        <p className="mt-1.5 max-w-sm text-sm text-white/65">
                          {active
                            ? remoteParticipantPresent
                              ? t("tele.remoteNoCamera")
                              : t("tele.waitingRemote")
                            : t("tele.patient.selectSessionHint")}
                        </p>
                      </div>
                      {!active && upcoming.length > 0 && (
                        <Button
                          size="sm"
                          className="gap-2 rounded-xl bg-sky-300 font-semibold text-[#0b1f4a] hover:bg-sky-200"
                          onClick={() =>
                            joinSession(upcoming[0].idRdv || upcoming[0].id, { requestCamera: true })
                          }
                        >
                          <Video className="h-4 w-4" />
                          {t("tele.joinSession")}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                <Signal
                  className={cn("h-3.5 w-3.5", isConnected ? "text-emerald-400" : "text-amber-300")}
                />
                {isConnected
                  ? remoteConnected
                    ? t("tele.remoteConnected")
                    : remoteParticipantPresent
                      ? t("tele.remoteNoCamera")
                      : t("tele.waitingRemote")
                  : t("tele.hdQuality")}
              </div>

              {active && (
                <div className="absolute right-4 top-4 flex max-w-[min(100%,18rem)] flex-col items-end gap-1.5">
                  <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 font-mono text-xs font-semibold tracking-wide text-white backdrop-blur-md">
                    {activeNumero}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-200" />
                      {t("tele.rdvNumber", { id: active.idRdv || activeRdvId })}
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 max-w-[42%] truncate rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                {t("tele.doctor")}: {remoteLabel}
              </div>

              {/* PiP */}
              <div className="absolute bottom-4 right-4 z-20 h-32 w-44 overflow-hidden rounded-2xl border-2 border-white/30 bg-black shadow-2xl ring-2 ring-sky-400/25 sm:h-40 sm:w-56">
                <div className="relative h-full w-full">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover object-center [transform:scaleX(-1)]",
                      localVideoReady ? "z-10 opacity-100" : "z-0 opacity-0",
                    )}
                  />
                  {!localVideoReady && isConnected && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-[#0b1f4a]/95 px-2 text-center text-white">
                      <Avatar name={localLabel} className="h-11 w-11 text-xs" />
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        disabled={startingCamera}
                        className="mt-1 text-[10px] text-sky-200 underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        {startingCamera ? t("tele.startCameraLoading") : t("tele.startCameraAction")}
                      </button>
                    </div>
                  )}
                  {!localVideoReady && !isConnected && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-[#0b1f4a]/95 text-white/70">
                      {isConnecting ? (
                        <Loader2 className="h-5 w-5 animate-spin text-sky-300" />
                      ) : (
                        <>
                          <VideoOff className="h-5 w-5" />
                          <span className="text-xs">{t("tele.cameraOff")}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="pointer-events-none absolute left-2 top-2 z-30 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {t("tele.localVideoLabel")}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/50 px-5 py-3 backdrop-blur-md">
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
          </div>

          {/* Active session banner */}
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="relative overflow-hidden rounded-2xl border border-blue-900/10 bg-white/75 shadow-sm backdrop-blur-sm"
              >
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-700 to-sky-400"
                />
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 pl-6">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={remoteLabel}
                      className="h-12 w-12 text-sm ring-[3px] ring-white shadow-lg shadow-blue-900/15"
                    />
                    <div>
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-800/55"
                        style={{ fontFamily: '"Sora", sans-serif' }}
                      >
                        {t("tele.patient.activeSession")}
                      </p>
                      {activeNumero && (
                        <p className="mt-1 font-mono text-xs font-bold tracking-wide text-blue-800">
                          {activeNumero}
                          <span className="ml-2 font-sans text-[11px] font-medium text-blue-800/50">
                            {t("tele.rdvNumber", { id: active.idRdv || activeRdvId })}
                          </span>
                        </p>
                      )}
                      <p
                        className="mt-0.5 text-lg font-semibold text-[#0b1f4a]"
                        style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                      >
                        {remoteLabel}
                      </p>
                      <p className="text-sm text-blue-800/55">{activeLabel || active.reason}</p>
                    </div>
                  </div>
                  {active.dateHeureRdv && (
                    <p className="text-sm font-medium text-blue-950/70">
                      {formatDateTime(active.dateHeureRdv, locale)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Upcoming */}
          <div className="overflow-hidden rounded-2xl border border-blue-900/10 bg-white/80 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-blue-900/8 px-4 py-3">
              <div>
                <p
                  className="text-sm font-semibold text-[#0b1f4a]"
                  style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                >
                  {t("tele.upcoming")}
                </p>
                <p className="text-[11px] text-blue-800/50">{t("tele.patient.sessionsHint")}</p>
              </div>
              <span className="rounded-md bg-blue-800/8 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-blue-900">
                {upcoming.length}
              </span>
            </div>
            <div className="px-4">
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Video className="h-8 w-8 text-blue-800/25" />
                  <p className="max-w-[14rem] text-sm text-blue-800/55">{t("tele.patient.noUpcoming")}</p>
                  <Link to={path("/appointments")}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-900/15 text-blue-900"
                    >
                      {t("nav.appointments")}
                    </Button>
                  </Link>
                </div>
              ) : (
                upcoming.map((s, i) => (
                  <SessionRow
                    key={s.idRdv || s.id}
                    session={s}
                    isActive={(s.idRdv || s.id) === activeRdvId}
                    onJoin={joinSession}
                    t={t}
                    index={i}
                    locale={locale}
                    tenantId={tenantId}
                  />
                ))
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="flex gap-3 rounded-2xl border border-blue-900/10 bg-gradient-to-br from-blue-50/90 to-sky-50/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-800 text-sky-100 shadow-md shadow-blue-900/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p
                className="text-sm font-semibold text-[#0b1f4a]"
                style={{ fontFamily: '"Fraunces", "Sora", serif' }}
              >
                {t("tele.patient.tipsTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-800/60">
                {t("tele.patient.tipsHint")}
              </p>
              {user?.tenantLabel && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-900/70">
                  <Stethoscope className="h-3 w-3" />
                  {user.tenantLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
