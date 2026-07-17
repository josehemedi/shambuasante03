import { useMemo } from "react"
import { Link } from "react-router-dom"
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
  Lock,
  MapPin,
  Pill,
  Shield,
  Stethoscope,
  Video,
} from "lucide-react"
import { Badge, Button, Avatar } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useRolePath } from "@/hooks/useRolePath"
import { useAsync } from "@/hooks/useAsync"
import { patientPortalService } from "@/services/api"
import { cn, formatDateTime } from "@/lib/utils"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1600&q=80"

const timelineIcon = { visit: Stethoscope, lab: FlaskConical, rx: Pill }

const QUICK_ACTIONS = [
  { key: "appointments", path: "/appointments", icon: CalendarDays },
  { key: "records", path: "/records", icon: FileHeart },
  { key: "teleconsultation", path: "/teleconsultation", icon: Video },
]

function StudioMetric({ icon: Icon, value, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="min-w-[5rem]"
    >
      <div className="flex items-center gap-1.5 text-blue-800/45">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ fontFamily: '"Sora", sans-serif' }}
        >
          {label}
        </span>
      </div>
      <p
        className="mt-1.5 text-[2rem] font-semibold tabular-nums leading-none tracking-tight text-[#0b1f4a]"
        style={{ fontFamily: '"Fraunces", "Sora", serif' }}
      >
        {value}
      </p>
    </motion.div>
  )
}

function AppointmentRow({ appointment, t, locale, onJoin, appointmentsPath, index }) {
  const isTele = appointment.isTele || appointment.mode === "Teleconsultation"
  const canJoin = isTele && ["upcoming", "in-progress"].includes(appointment.status)

  return (
    <motion.article
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="relative flex gap-4 border-b border-blue-900/6 py-4 last:border-0"
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl shadow-md",
          isTele
            ? "bg-blue-800 text-sky-100 shadow-blue-900/25"
            : "bg-sky-200 text-blue-900 shadow-sky-400/30",
        )}
      >
        <span className="text-[8px] font-semibold uppercase leading-none opacity-80">
          {appointment.dateLabel?.split(" ").slice(0, 1).join(" ") || "—"}
        </span>
        <span
          className="text-sm font-semibold tabular-nums leading-none"
          style={{ fontFamily: '"Fraunces", "Sora", serif' }}
        >
          {appointment.time}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "gap-1 border-0 text-[10px] font-semibold uppercase tracking-wide",
              isTele ? "bg-blue-800/10 text-blue-900" : "bg-sky-200/60 text-blue-900",
            )}
          >
            {isTele ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {isTele ? t("patDash.modeTele") : t("patDash.modePhysical")}
          </Badge>
          {appointment.status && (
            <Badge className="border-0 bg-blue-50 text-[10px] text-blue-900">
              {t(`statuses.${appointment.status}`)}
            </Badge>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <Avatar name={appointment.doctor} className="h-9 w-9 text-xs" />
          <div className="min-w-0">
            <p
              className="truncate text-[1.02rem] font-semibold text-[#0b1f4a]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {appointment.doctor}
            </p>
            <p className="truncate text-xs text-blue-800/55">
              {appointment.reason || appointment.specialty}
            </p>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-800/50">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTime(appointment.dateHeureRdv, locale) ||
            `${appointment.date} · ${appointment.time}`}
        </p>
      </div>

      {canJoin ? (
        <Button
          size="sm"
          className="h-9 shrink-0 gap-2 self-center rounded-lg bg-blue-800 text-white shadow-md shadow-blue-900/20 hover:bg-blue-900"
          onClick={() => onJoin(appointment)}
        >
          <Video className="h-3.5 w-3.5" />
          {t("tele.joinSession")}
        </Button>
      ) : (
        <Link to={appointmentsPath} className="shrink-0 self-center">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1 border-blue-900/15 text-blue-900"
          >
            {t("patDash.viewSchedule")}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      )}
    </motion.article>
  )
}

/**
 * Tableau de bord patient premium — Shambua Santé.
 */
export default function PatientDashboard() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const { path, go } = useRolePath()

  const { data: kpis } = useAsync(() => patientPortalService.getKpis(), [])
  const { data: appointments, loading: apptLoading } = useAsync(
    () => patientPortalService.getAppointments(),
    [],
  )
  const { data: prescriptions, loading: rxLoading } = useAsync(
    () => patientPortalService.getPrescriptions(),
    [],
  )
  const { data: timeline, loading: timelineLoading } = useAsync(
    () => patientPortalService.getTimeline(),
    [],
  )

  const firstName = (user?.name || "").split(" ")[0] || t("roles.patient")
  const patientName = user?.name || firstName

  const teleCount = useMemo(
    () =>
      (appointments || []).filter(
        (a) =>
          (a.isTele || a.mode === "Teleconsultation") &&
          a.status !== "cancelled" &&
          a.status !== "completed",
      ).length,
    [appointments],
  )

  const upcomingAppointments = useMemo(() => {
    const now = Date.now()
    return (appointments || [])
      .filter((a) => {
        if (a.status === "cancelled" || a.status === "completed") return false
        const ts = a.dateHeureRdv
          ? new Date(String(a.dateHeureRdv).replace(" ", "T")).getTime()
          : 0
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
    if (id) go(`/teleconsultation?rdv=${id}`)
  }

  const canJoinNext =
    nextAppointment &&
    (nextAppointment.isTele || nextAppointment.mode === "Teleconsultation") &&
    ["upcoming", "in-progress"].includes(nextAppointment.status)

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
        style={{ minHeight: "min(62vh, 26rem)" }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(15, 40, 80, 0.95) 0%, rgba(23, 58, 120, 0.9) 40%, rgba(37, 99, 235, 0.52) 70%, rgba(56, 140, 220, 0.3) 100%)",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/4 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl"
          animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
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
              {t("patDash.secured")}
            </p>
            <h1
              className="mt-3 text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              Shambua Santé
            </h1>
            <p
              className="mt-2 text-lg font-medium text-sky-100 sm:text-xl"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {t("patDash.studioTitle")}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-50/75">
              {t("patDash.greeting")}, {firstName} — {t("patDash.studioSubtitle")}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {canJoinNext ? (
                <Button
                  size="lg"
                  className="h-12 gap-2.5 rounded-xl border-0 bg-sky-300 px-6 text-[15px] font-semibold text-[#0b1f4a] shadow-xl shadow-blue-950/30 transition-transform hover:scale-[1.02] hover:bg-sky-200"
                  onClick={() => handleJoin(nextAppointment)}
                >
                  <Video className="h-4 w-4" />
                  {t("tele.joinSession")}
                </Button>
              ) : (
                <Link to={path("/records")}>
                  <Button
                    size="lg"
                    className="h-12 gap-2.5 rounded-xl border-0 bg-sky-300 px-6 text-[15px] font-semibold text-[#0b1f4a] shadow-xl shadow-blue-950/30 hover:bg-sky-200"
                  >
                    <FileHeart className="h-4 w-4" />
                    {t("nav.records")}
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

      {/* Identity + metrics */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 flex flex-col gap-6 px-1 sm:flex-row sm:items-end sm:justify-between sm:px-2"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              name={patientName}
              className="h-[4.25rem] w-[4.25rem] text-lg ring-[3px] ring-white shadow-xl shadow-blue-900/15"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg">
              <Shield className="h-3.5 w-3.5" />
            </span>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800/55"
              style={{ fontFamily: '"Sora", sans-serif' }}
            >
              {t("patDash.greeting")}
            </p>
            <h2
              className="mt-0.5 text-2xl font-semibold tracking-tight text-[#0b1f4a]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {patientName}
            </h2>
            {user?.tenantLabel && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-blue-800/50">
                <Stethoscope className="h-3 w-3" />
                {user.tenantLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-7 sm:gap-9">
          <StudioMetric
            icon={CalendarDays}
            value={kpis?.upcoming?.value ?? 0}
            label={t("patDash.upcoming")}
            delay={0.28}
          />
          <StudioMetric
            icon={Pill}
            value={kpis?.prescriptions?.value ?? 0}
            label={t("patDash.prescriptions")}
            delay={0.34}
          />
          <StudioMetric
            icon={FileText}
            value={kpis?.reports?.value ?? 0}
            label={t("patDash.reports")}
            delay={0.4}
          />
          <StudioMetric
            icon={Video}
            value={teleCount}
            label={t("patDash.teleSessions")}
            delay={0.46}
          />
        </div>
      </motion.div>

      {/* Quick actions — editorial links, not heavy cards */}
      <motion.nav
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.28 }}
        className="mt-8 grid grid-cols-2 gap-3 px-1 sm:grid-cols-4 sm:px-2"
      >
        {QUICK_ACTIONS.map(({ key, path: actionPath, icon: Icon }, i) => (
          <Link
            key={key}
            to={path(actionPath)}
            className="group flex flex-col gap-3 rounded-2xl border border-blue-900/8 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-blue-700/20 hover:bg-white hover:shadow-lg hover:shadow-blue-900/8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.32 + i * 0.04 }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-sky-100 shadow-md shadow-blue-900/20 transition group-hover:bg-blue-900"
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            <div>
              <p
                className="text-sm font-semibold text-[#0b1f4a]"
                style={{ fontFamily: '"Fraunces", "Sora", serif' }}
              >
                {t(`patDash.actions.${key}`)}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-blue-800/50">
                {t(`patDash.actions.${key}Hint`)}
              </p>
            </div>
          </Link>
        ))}
      </motion.nav>

      {/* Next appointment spotlight */}
      {nextAppointment && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
          className="mt-8 px-1 sm:px-2"
        >
          <div className="relative overflow-hidden rounded-2xl border border-blue-900/10 bg-white/75 shadow-sm backdrop-blur-sm">
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-700 to-sky-400"
            />
            <div className="flex flex-col gap-4 p-5 pl-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg",
                    nextAppointment.isTele || nextAppointment.mode === "Teleconsultation"
                      ? "bg-blue-800 text-sky-200 shadow-blue-900/25"
                      : "bg-sky-200 text-blue-900 shadow-sky-400/30",
                  )}
                >
                  {nextAppointment.isTele || nextAppointment.mode === "Teleconsultation" ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <CalendarDays className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800/55"
                    style={{ fontFamily: '"Sora", sans-serif' }}
                  >
                    {t("patDash.nextAppointment")}
                  </p>
                  <h3
                    className="mt-1 text-xl font-semibold text-[#0b1f4a]"
                    style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                  >
                    {nextAppointment.doctor}
                  </h3>
                  <p className="mt-0.5 text-sm text-blue-800/55">
                    {nextAppointment.reason || nextAppointment.specialty}
                  </p>
                  <p className="mt-2 text-sm font-medium text-blue-950/80">
                    {formatDateTime(nextAppointment.dateHeureRdv, locale) ||
                      `${nextAppointment.date} · ${nextAppointment.time}`}
                  </p>
                </div>
              </div>
              {canJoinNext && (
                <Button
                  size="lg"
                  className="h-11 shrink-0 gap-2 rounded-xl bg-blue-800 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-900"
                  onClick={() => handleJoin(nextAppointment)}
                >
                  <Video className="h-4 w-4" />
                  {t("tele.joinSession")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Main grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.36 }}
        className="mt-10 grid grid-cols-1 gap-8 px-1 sm:px-2 lg:grid-cols-3"
      >
        <div className="space-y-8 lg:col-span-2">
          {/* Upcoming */}
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3
                  className="text-2xl font-semibold text-[#0b1f4a]"
                  style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                >
                  {t("patDash.upcomingTitle")}
                </h3>
                <p className="mt-1 text-sm text-blue-800/50">{t("patDash.upcomingSub")}</p>
              </div>
              <Link to={path("/appointments")}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-blue-900/15 text-blue-900"
                >
                  {t("common.viewAll")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-blue-900/8 bg-white/70 px-4 shadow-sm backdrop-blur-sm sm:px-5">
              {apptLoading ? (
                <div className="flex justify-center py-14 text-blue-800/40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <CalendarDays className="h-8 w-8 text-blue-800/25" />
                  <p className="text-sm text-blue-800/55">{t("patDash.noAppointments")}</p>
                  <Link to={path("/appointments")}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-900/15 text-blue-900"
                    >
                      {t("patDash.viewSchedule")}
                    </Button>
                  </Link>
                </div>
              ) : (
                upcomingAppointments.map((a, i) => (
                  <AppointmentRow
                    key={a.idRdv ?? a.id}
                    appointment={a}
                    t={t}
                    locale={locale}
                    onJoin={handleJoin}
                    appointmentsPath={path("/appointments")}
                    index={i}
                  />
                ))
              )}
            </div>
          </section>

          {/* Medications */}
          <section>
            <h3
              className="mb-4 text-2xl font-semibold text-[#0b1f4a]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {t("patDash.medsTitle")}
            </h3>
            <div className="rounded-2xl border border-blue-900/8 bg-white/70 px-4 shadow-sm backdrop-blur-sm sm:px-5">
              {rxLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-800/40" />
                </div>
              ) : activePrescriptions.length === 0 ? (
                <p className="py-10 text-center text-sm text-blue-800/55">
                  {t("patDash.noPrescriptions")}
                </p>
              ) : (
                activePrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="flex items-center gap-3 border-b border-blue-900/6 py-3.5 last:border-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-700 text-sky-100 shadow-md shadow-indigo-900/20">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-semibold text-[#0b1f4a]"
                        style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                      >
                        {rx.drug}
                      </p>
                      <p className="truncate text-xs text-blue-800/55">{rx.dosage}</p>
                    </div>
                    <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-800">
                      {`${rx.refills} ${t("patDash.refills")}`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section>
            <h3
              className="mb-4 text-xl font-semibold text-[#0b1f4a]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {t("patDash.historyTitle")}
            </h3>
            <div className="rounded-2xl border border-blue-900/8 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
              {timelineLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-800/40" />
                </div>
              ) : (timeline || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-blue-800/55">{t("patDash.noActivity")}</p>
              ) : (
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute bottom-2 left-[0.85rem] top-2 w-px bg-gradient-to-b from-blue-700/35 via-sky-400/40 to-transparent"
                  />
                  <ol className="space-y-5">
                    {(timeline || []).slice(0, 8).map((e, i) => {
                      const Icon = timelineIcon[e.type] || FileText
                      return (
                        <motion.li
                          key={e.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.28) }}
                          className="relative flex gap-3 pl-1"
                        >
                          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-800 text-sky-100 shadow-md shadow-blue-900/20">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p className="text-sm font-medium leading-snug text-[#0b1f4a]">
                              {e.text}
                            </p>
                            <p className="mt-1 text-xs text-blue-800/45">{e.date}</p>
                          </div>
                        </motion.li>
                      )
                    })}
                  </ol>
                </div>
              )}
            </div>
          </section>

          <div className="flex gap-3 rounded-2xl border border-blue-900/10 bg-gradient-to-br from-blue-50/90 to-sky-50/50 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-800 text-sky-100 shadow-md shadow-blue-900/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p
                className="text-sm font-semibold text-[#0b1f4a]"
                style={{ fontFamily: '"Fraunces", "Sora", serif' }}
              >
                {t("patDash.careTeamTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-800/60">
                {t("patDash.careTeamHint")}
              </p>
              <Link to={path("/appointments")} className="mt-3 inline-block">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 border-blue-900/15 text-blue-900"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t("patDash.viewSchedule")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
