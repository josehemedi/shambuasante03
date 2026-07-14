import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  FileHeart,
  FileText,
  FlaskConical,
  Loader2,
  MapPin,
  MessageSquare,
  Pill,
  Shield,
  Stethoscope,
  Video,
} from "lucide-react"
import { StatCard } from "@/components/StatCard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Avatar } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { patientPortalService } from "@/services/api"
import { cn, formatDateTime } from "@/lib/utils"

const timelineIcon = { visit: Stethoscope, lab: FlaskConical, rx: Pill }

const QUICK_ACTIONS = [
  { key: "appointments", path: "/appointments", icon: CalendarDays, tone: "primary" },
  { key: "records", path: "/records", icon: FileHeart, tone: "accent" },
  { key: "teleconsultation", path: "/teleconsultation", icon: Video, tone: "secondary" },
  { key: "messages", path: "/messages", icon: MessageSquare, tone: "primary" },
]

const TONE_CLASSES = {
  primary: "bg-primary/12 text-primary group-hover:bg-primary/18",
  accent: "bg-accent/15 text-accent-foreground group-hover:bg-accent/22",
  secondary: "bg-secondary/15 text-secondary group-hover:bg-secondary/22",
}

function AppointmentRow({ appointment, t, locale, onJoin }) {
  const isTele = appointment.isTele || appointment.mode === "Teleconsultation"
  const canJoin = isTele && ["upcoming", "in-progress"].includes(appointment.status)

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-all sm:flex-row sm:items-center",
        "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
        isTele ? "border-l-4 border-l-primary" : "border-l-4 border-l-secondary/80",
      )}
    >
      <div className="flex w-[4.25rem] shrink-0 flex-col items-center rounded-xl border border-primary/15 bg-gradient-to-b from-primary/12 to-primary/5 py-2.5 text-primary">
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
          {appointment.dateLabel?.split(" ").slice(1).join(" ") || appointment.date || "—"}
        </span>
        <span className="text-lg font-bold leading-none">{appointment.time}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isTele ? "primary" : "secondary"} className="gap-1 text-[10px]">
            {isTele ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {isTele ? t("patDash.modeTele") : t("patDash.modePhysical")}
          </Badge>
          {appointment.status && (
            <Badge variant={appointment.status === "upcoming" ? "default" : "outline"} className="text-[10px]">
              {t(`statuses.${appointment.status}`)}
            </Badge>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <Avatar name={appointment.doctor} className="h-9 w-9 text-xs" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{appointment.doctor}</p>
            <p className="truncate text-xs text-muted-foreground">{appointment.reason || appointment.specialty}</p>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTime(appointment.dateHeureRdv, locale) || `${appointment.date} · ${appointment.time}`}
        </p>
      </div>

      {canJoin ? (
        <Button size="sm" className="shrink-0 gap-2" onClick={() => onJoin(appointment)}>
          <Video className="h-4 w-4" />
          {t("tele.joinSession")}
        </Button>
      ) : (
        <Link to="/appointments" className="shrink-0">
          <Button size="sm" variant="outline" className="gap-1">
            {t("patDash.viewSchedule")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </motion.div>
  )
}

export default function PatientDashboard() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: kpis } = useAsync(() => patientPortalService.getKpis(), [])
  const { data: appointments, loading: apptLoading } = useAsync(() => patientPortalService.getAppointments(), [])
  const { data: prescriptions, loading: rxLoading } = useAsync(() => patientPortalService.getPrescriptions(), [])
  const { data: timeline, loading: timelineLoading } = useAsync(() => patientPortalService.getTimeline(), [])

  const firstName = (user?.name || "").split(" ")[0] || t("roles.patient")
  const patientName = user?.name || firstName

  const teleCount = useMemo(
    () =>
      (appointments || []).filter(
        (a) => (a.isTele || a.mode === "Teleconsultation") && a.status !== "cancelled" && a.status !== "completed",
      ).length,
    [appointments],
  )

  const upcomingAppointments = useMemo(() => {
    const now = Date.now()
    return (appointments || [])
      .filter((a) => {
        if (a.status === "cancelled" || a.status === "completed") return false
        const ts = a.dateHeureRdv ? new Date(String(a.dateHeureRdv).replace(" ", "T")).getTime() : 0
        return ts >= now || a.status === "in-progress" || !a.dateHeureRdv
      })
      .slice(0, 4)
  }, [appointments])

  const nextAppointment = upcomingAppointments[0] ?? null

  const activePrescriptions = useMemo(
    () => (prescriptions || []).filter((rx) => rx.status === "active").slice(0, 4),
    [prescriptions],
  )

  function handleJoin(appointment) {
    const id = appointment.idRdv ?? appointment.id
    if (id) navigate(`/teleconsultation?rdv=${id}`)
  }

  return (
    <div className="min-h-full">
      <main className="space-y-6 p-6">
        <Card className="overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
          <div className="relative bg-gradient-to-br from-primary/14 via-card to-card p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Avatar name={patientName} className="h-16 w-16 border-2 border-primary/20 text-lg shadow-md" />
                <div>
                  <p className="text-sm font-medium text-primary">
                    {t("patDash.greeting")}, {firstName}
                  </p>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {t("patDash.heroTitle")}
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("patDash.subtitle")}</p>
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
                  {t("patDash.secured")}
                </div>
                <Link to="/records">
                  <Button variant="outline" size="sm" className="gap-2 bg-background/70 backdrop-blur-sm">
                    <FileHeart className="h-4 w-4" />
                    {t("nav.records")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ key, path, icon: Icon, tone }) => (
            <Link key={key} to={path}>
              <Card className="group h-full p-4 transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5">
                <div className={cn("mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-colors", TONE_CLASSES[tone])}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t(`patDash.actions.${key}`)}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t(`patDash.actions.${key}Hint`)}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} label={t("patDash.upcoming")} value={kpis?.upcoming?.value ?? 0} delta={kpis?.upcoming?.delta ?? 0} icon={CalendarDays} tone="primary" />
          <StatCard index={1} label={t("patDash.prescriptions")} value={kpis?.prescriptions?.value ?? 0} delta={kpis?.prescriptions?.delta ?? 0} icon={Pill} tone="accent" />
          <StatCard index={2} label={t("patDash.reports")} value={kpis?.reports?.value ?? 0} delta={kpis?.reports?.delta ?? 0} icon={FileText} tone="secondary" />
          <StatCard index={3} label={t("patDash.teleSessions")} value={teleCount} delta={0} icon={Video} tone="warning" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {nextAppointment && (
              <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-primary/15 p-3 text-primary">
                      {nextAppointment.isTele || nextAppointment.mode === "Teleconsultation" ? (
                        <Video className="h-6 w-6" />
                      ) : (
                        <CalendarDays className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("patDash.nextAppointment")}
                      </p>
                      <h2 className="mt-1 font-display text-lg font-bold text-foreground">{nextAppointment.doctor}</h2>
                      <p className="text-sm text-muted-foreground">{nextAppointment.reason || nextAppointment.specialty}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDateTime(nextAppointment.dateHeureRdv, locale) ||
                          `${nextAppointment.date} · ${nextAppointment.time}`}
                      </p>
                    </div>
                  </div>
                  {(nextAppointment.isTele || nextAppointment.mode === "Teleconsultation") && (
                    <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => handleJoin(nextAppointment)}>
                      <Video className="h-4 w-4" />
                      {t("tele.joinSession")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-display">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      {t("patDash.upcomingTitle")}
                    </CardTitle>
                    <CardDescription>{t("patDash.upcomingSub")}</CardDescription>
                  </div>
                  <Link to="/appointments">
                    <Button variant="outline" size="sm" className="gap-2">
                      {t("common.viewAll")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-5">
                {apptLoading ? (
                  <div className="flex justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="rounded-2xl bg-muted/60 p-4 text-muted-foreground">
                      <CalendarDays className="h-8 w-8" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t("patDash.noAppointments")}</p>
                    <Link to="/appointments">
                      <Button variant="outline" size="sm">{t("patDash.viewSchedule")}</Button>
                    </Link>
                  </div>
                ) : (
                  upcomingAppointments.map((a) => (
                    <AppointmentRow key={a.idRdv ?? a.id} appointment={a} t={t} locale={locale} onJoin={handleJoin} />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <CardTitle className="flex items-center gap-2 font-display">
                  <Pill className="h-5 w-5 text-accent-foreground" />
                  {t("patDash.medsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-5">
                {rxLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : activePrescriptions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("patDash.noPrescriptions")}</p>
                ) : (
                  activePrescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-accent/5 to-transparent p-3.5 transition-colors hover:border-accent/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{rx.drug}</p>
                        <p className="truncate text-xs text-muted-foreground">{rx.dosage}</p>
                      </div>
                      <Badge variant="success">{`${rx.refills} ${t("patDash.refills")}`}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <CardTitle className="flex items-center gap-2 font-display">
                  <Activity className="h-5 w-5 text-primary" />
                  {t("patDash.historyTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {timelineLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (timeline || []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("patDash.noActivity")}</p>
                ) : (
                  <ol className="relative space-y-5 border-l-2 border-primary/20 pl-6">
                    {(timeline || []).slice(0, 8).map((e) => {
                      const Icon = timelineIcon[e.type] || FileText
                      return (
                        <li key={e.id} className="relative">
                          <span className="absolute -left-[1.85rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary/12 text-primary shadow-sm">
                            <Icon className="h-3 w-3" />
                          </span>
                          <p className="text-sm font-medium leading-snug text-foreground">{e.text}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{e.date}</p>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/15 bg-gradient-to-br from-primary/8 to-transparent p-5">
              <div className="flex gap-3">
                <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("patDash.careTeamTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("patDash.careTeamHint")}</p>
                  <Link to="/messages" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="gap-2">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {t("nav.messages")}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
