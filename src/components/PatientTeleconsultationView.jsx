import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Shield,
  Signal,
  Stethoscope,
  Video,
  VideoOff,
} from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, Badge, Button, Avatar, Input } from "@/components/ui/primitives"
import { cn, initials, formatDateTime } from "@/lib/utils"
import { MediaSecureContextBanner } from "@/components/MediaSecureContextBanner"

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
          ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30 hover:opacity-90"
          : active
            ? "bg-white/20 text-white hover:bg-white/30"
            : "bg-destructive/90 text-destructive-foreground hover:bg-destructive",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function SessionCard({ session, isActive, onJoin, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center",
        isActive
          ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10"
          : "border-border/60 bg-card hover:border-primary/25 hover:shadow-md",
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-primary/15 bg-gradient-to-b from-primary/12 to-primary/5 py-2 text-primary">
        <CalendarDays className="mb-1 h-3.5 w-3.5 opacity-70" />
        <span className="text-sm font-bold leading-none">{session.time}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Avatar name={session.doctor} className="h-9 w-9 text-xs" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{session.doctor}</p>
            <p className="truncate text-xs text-muted-foreground">{session.reason}</p>
          </div>
        </div>
        {session.date && session.date !== "—" && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {session.date}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant={isActive ? "default" : "outline"}
        className="shrink-0 gap-2"
        onClick={() => onJoin(session.idRdv || session.id, { requestCamera: true })}
      >
        <Video className="h-4 w-4" />
        {isActive ? t("tele.connected") : t("tele.joinSession")}
      </Button>
    </motion.div>
  )
}

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
  messages,
  chatError,
  chatStatusLabel,
  chatStatus,
  draft,
  setDraft,
  sendMessage,
  sendingChat,
  joinSession,
}) {
  const firstName = (user?.name || "").split(" ")[0] || t("roles.patient")

  return (
    <div className="min-h-full">
      <main className="space-y-6 p-6">
        {/* Hero */}
        <Card className="overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
          <div className="relative bg-gradient-to-br from-primary/14 via-card to-card p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary/15 p-3.5 text-primary shadow-inner">
                  <Video className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">{t("tele.patient.greeting", { name: firstName })}</p>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {t("tele.patient.heroTitle")}
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("tele.patient.subtitle")}</p>
                  {user?.tenantLabel && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      {user.tenantLabel}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-background/70 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  {t("tele.patient.secured")}
                </div>
                <Link to="/appointments">
                  <Button variant="outline" size="sm" className="gap-2 bg-background/70">
                    <CalendarDays className="h-4 w-4" />
                    {t("nav.appointments")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {displayError && !mediaPermissionMessage && (
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{displayError}</Card>
        )}

        <MediaSecureContextBanner className="mb-0" />

        {mediaPermissionMessage && (
          <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-transparent p-4 text-sm text-amber-900 dark:text-amber-100">
            <p>{mediaPermissionMessage}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(showCameraWarning ||
                mediaError === "not-found" ||
                mediaError === "in-use" ||
                mediaError === "not-supported") &&
                !localVideoReady &&
                !camOn && (
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

        {isConnected && !localVideoReady && !mediaPermissionMessage && mediaError !== "insecure-context" && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/8 to-transparent p-4 text-sm">
            <p className="text-foreground">{t("tele.startCameraPrompt")}</p>
            <Button type="button" size="sm" className="mt-3 gap-2" onClick={handleStartCamera} disabled={startingCamera}>
              {startingCamera ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              {startingCamera ? t("tele.startCameraLoading") : t("tele.startCameraAction")}
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            {/* Video stage */}
            <Card className="overflow-hidden border-0 shadow-xl ring-1 ring-border/50">
              <div className="relative aspect-video w-full bg-gradient-to-br from-slate-950 via-slate-900 to-primary/20">
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
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-sm font-medium text-white/90">{t("tele.connecting")}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/10 bg-white/10 text-3xl font-semibold text-white shadow-2xl backdrop-blur-md">
                          {active ? initials(remoteLabel) : <Video className="h-10 w-10 opacity-80" />}
                        </div>
                        <div>
                          <p className="font-display text-xl font-bold text-white">
                            {active ? remoteLabel : t("tele.patient.noSessionTitle")}
                          </p>
                          <p className="mt-1 text-sm text-white/70">
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
                            className="gap-2"
                            onClick={() => joinSession(upcoming[0].idRdv || upcoming[0].id, { requestCamera: true })}
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

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  <Signal className={cn("h-3.5 w-3.5", isConnected ? "text-emerald-400" : "text-amber-400")} />
                  {isConnected
                    ? remoteConnected
                      ? t("tele.remoteConnected")
                      : remoteParticipantPresent
                        ? t("tele.remoteNoCamera")
                        : t("tele.waitingRemote")
                    : t("tele.hdQuality")}
                </div>

                {active && (
                  <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      RDV #{active.idRdv || activeRdvId}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 max-w-[45%] truncate rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                  {t("tele.doctor")}: {remoteLabel}
                </div>

                {/* PiP local */}
                <div className="absolute bottom-4 right-4 z-20 h-36 w-52 overflow-hidden rounded-2xl border-2 border-white/25 bg-black shadow-2xl ring-2 ring-primary/20 sm:h-40 sm:w-60">
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
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-slate-900/95 px-2 text-center text-white">
                        <Avatar name={localLabel} className="h-11 w-11 text-xs" />
                        <button
                          type="button"
                          onClick={handleStartCamera}
                          disabled={startingCamera}
                          className="mt-1 text-[10px] text-primary-foreground underline-offset-2 hover:underline disabled:opacity-50"
                        >
                          {startingCamera ? t("tele.startCameraLoading") : t("tele.startCameraAction")}
                        </button>
                      </div>
                    )}
                    {!localVideoReady && !isConnected && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-slate-900/95 text-white/70">
                        {isConnecting ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <>
                            <VideoOff className="h-5 w-5" />
                            <span className="text-xs">{t("tele.cameraOff")}</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className="pointer-events-none absolute left-2 top-2 z-30 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {t("tele.localVideoLabel")}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/50 px-5 py-3 backdrop-blur-md">
                  <ControlButton active={micOn} onClick={toggleMic} icon={micOn ? Mic : MicOff} label={t("tele.toggleMic")} disabled={!isConnected} />
                  <ControlButton active={camOn || localVideoReady} onClick={toggleCam} icon={camOn || localVideoReady ? Video : VideoOff} label={t("tele.toggleCam")} disabled={!isConnected} />
                  <ControlButton danger icon={PhoneOff} label={t("tele.endCall")} onClick={handleEndCall} disabled={!liveKitCreds} />
                </div>
              </div>
            </Card>

            {active && (
              <Card className="overflow-hidden border-primary/15 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <Avatar name={remoteLabel} className="h-12 w-12 text-sm ring-2 ring-primary/20" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("tele.patient.activeSession")}
                      </p>
                      <p className="font-display text-lg font-bold text-foreground">{remoteLabel}</p>
                      <p className="text-sm text-muted-foreground">{active.reason}</p>
                    </div>
                  </div>
                  {active.dateHeureRdv && (
                    <p className="text-sm text-muted-foreground">{formatDateTime(active.dateHeureRdv, locale)}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {/* Chat */}
            <Card className="flex h-[22rem] flex-col overflow-hidden shadow-sm xl:h-[26rem]">
              <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="font-display text-base">{t("tele.chat")}</CardTitle>
                  </div>
                  {chatStatusLabel && (
                    <Badge variant={chatStatus === "connected" ? "primary" : "secondary"}>{chatStatusLabel}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t("tele.chatSecure")}</p>
              </CardHeader>
              {chatError && <p className="px-4 pt-2 text-xs text-destructive">{chatError}</p>}
              <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">
                      {activeRdvId ? t("tele.patient.chatEmpty") : t("tele.patient.chatSelectSession")}
                    </p>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id || `${m.time}-${m.text}`} className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                        m.mine
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border/60 bg-muted/80 text-foreground",
                      )}
                    >
                      {m.text}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>{m.time}</span>
                      {m.mine && (
                        <span className="inline-flex items-center gap-0.5">
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
              <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border/60 bg-muted/10 p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("tele.typeMessage")}
                  className="flex-1 border-border/60 bg-background"
                  disabled={!activeRdvId || sendingChat}
                />
                <Button type="submit" size="icon" aria-label={t("tele.send")} disabled={!activeRdvId || sendingChat || !draft.trim()}>
                  {sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </Card>

            {/* Upcoming sessions */}
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {t("tele.upcoming")}
                  </CardTitle>
                  <Badge variant="outline">{upcoming.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t("tele.patient.sessionsHint")}</p>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <Video className="h-9 w-9 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t("tele.patient.noUpcoming")}</p>
                    <Link to="/appointments">
                      <Button variant="outline" size="sm">{t("nav.appointments")}</Button>
                    </Link>
                  </div>
                ) : (
                  upcoming.map((s) => (
                    <SessionCard
                      key={s.idRdv || s.id}
                      session={s}
                      isActive={(s.idRdv || s.id) === activeRdvId}
                      onJoin={joinSession}
                      t={t}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/15 bg-gradient-to-br from-primary/8 to-transparent p-4">
              <div className="flex gap-3">
                <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("tele.patient.tipsTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("tele.patient.tipsHint")}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
