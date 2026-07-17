import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Stethoscope,
  Video,
  Sparkles,
  Lock,
} from "lucide-react"
import { Button, Badge, Avatar, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useRolePath } from "@/hooks/useRolePath"
import { cn, formatDateTime } from "@/lib/utils"
import {
  formatTeleconsultationLabel,
  formatTeleconsultationNumero,
} from "@/lib/teleconsultation"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1600&q=80"

const FILTER_KEYS = ["all", "upcoming", "tele", "physical", "past"]

const STATUS_STYLE = {
  upcoming: "bg-blue-800/10 text-blue-900",
  "in-progress": "bg-sky-200/70 text-blue-950",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
}

function parseApptDate(value) {
  if (!value) return null
  const normalized =
    String(value).includes(" ") && !String(value).includes("T")
      ? String(value).replace(" ", "T")
      : value
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Agenda patient premium — Shambua Santé (palette bleue).
 */
export default function PatientAppointmentsView({ appointments, loading, error, onRetry }) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const { go } = useRolePath()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")

  const stats = useMemo(() => {
    const list = appointments || []
    return {
      total: list.length,
      upcoming: list.filter((a) => a.status === "upcoming" || a.status === "in-progress").length,
      tele: list.filter((a) => a.isTele && a.status !== "completed" && a.status !== "cancelled").length,
      physical: list.filter((a) => !a.isTele && a.status !== "completed" && a.status !== "cancelled").length,
    }
  }, [appointments])

  const filtered = useMemo(() => {
    const list = appointments || []
    const q = query.trim().toLowerCase()
    return list.filter((a) => {
      const matchesQuery =
        !q ||
        (a.doctor || "").toLowerCase().includes(q) ||
        (a.reason || "").toLowerCase().includes(q) ||
        (a.label || "").toLowerCase().includes(q) ||
        (a.numero || "").toLowerCase().includes(q) ||
        String(a.idRdv || "").includes(q)
      const matchesFilter =
        filter === "all" ||
        (filter === "upcoming" && (a.status === "upcoming" || a.status === "in-progress")) ||
        (filter === "tele" && a.isTele) ||
        (filter === "physical" && !a.isTele) ||
        (filter === "past" && (a.status === "completed" || a.status === "cancelled"))
      return matchesQuery && matchesFilter
    })
  }, [appointments, query, filter])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const a of filtered) {
      const key = a.monthKey || "unknown"
      if (!map.has(key)) {
        map.set(key, { label: a.monthLabel, items: [] })
      }
      map.get(key).items.push(a)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const nextAppointment = useMemo(() => {
    const now = Date.now()
    return (appointments || [])
      .filter((a) => {
        if (a.status === "cancelled" || a.status === "completed") return false
        const ts = a.dateHeureRdv ? parseApptDate(a.dateHeureRdv)?.getTime() || 0 : 0
        return ts >= now || a.status === "in-progress"
      })
      .sort((a, b) => {
        const da = a.dateHeureRdv ? parseApptDate(a.dateHeureRdv)?.getTime() || 0 : 0
        const db = b.dateHeureRdv ? parseApptDate(b.dateHeureRdv)?.getTime() || 0 : 0
        return da - db
      })[0]
  }, [appointments])

  function handleJoin(appointment) {
    if (appointment?.idRdv) {
      go(`/teleconsultation?rdv=${appointment.idRdv}`)
    }
  }

  const patientName = user?.name || t("roles.patient")
  const canJoinNext =
    nextAppointment?.isTele &&
    ["upcoming", "in-progress"].includes(nextAppointment.status)

  return (
    <div className="relative -mx-3 min-h-[calc(100vh-6.5rem)] overflow-hidden pb-12 sm:-mx-4 lg:-mx-6">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 0% -5%, rgba(37, 99, 235, 0.12), transparent 50%), radial-gradient(ellipse 80% 55% at 100% 5%, rgba(56, 189, 248, 0.1), transparent 45%), linear-gradient(180deg, #f0f5fb 0%, #eef3f9 45%, #f4f7fb 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]"
        style={{ minHeight: "min(68vh, 30rem)" }}
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
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-72 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ x: [0, 24, 0], opacity: [0.2, 0.38, 0.2] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-200"
              style={{ fontFamily: '"Sora", sans-serif' }}
            >
              {t("appointments.patientPortal.secured")}
            </p>
            <h1
              className="mt-4 text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.35rem]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              Shambua Santé
            </h1>
            <p
              className="mt-3 text-lg font-medium text-sky-100 sm:text-xl"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {t("appointments.patientPortal.studioTitle")}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-50/75 sm:text-[15px]">
              {t("appointments.patientPortal.studioSubtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
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
                <Button
                  size="lg"
                  className="h-12 gap-2.5 rounded-xl border-0 bg-sky-300 px-6 text-[15px] font-semibold text-[#0b1f4a] shadow-xl shadow-blue-950/30 transition-transform hover:scale-[1.02] hover:bg-sky-200"
                  onClick={onRetry}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {t("common.refresh")}
                </Button>
              )}
              <span className="inline-flex items-center gap-2 text-xs text-white/70">
                <Lock className="h-3.5 w-3.5 text-sky-200" />
                {t("appointments.patientPortal.mySchedule")}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Identité + métriques */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22 }}
        className="mt-8 flex flex-col gap-6 px-1 sm:flex-row sm:items-end sm:justify-between sm:px-2"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              name={patientName}
              className="h-[4.25rem] w-[4.25rem] text-lg ring-[3px] ring-white shadow-xl shadow-blue-900/15"
            />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.4, stiffness: 260 }}
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg"
            >
              <Shield className="h-3.5 w-3.5" />
            </motion.span>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800/55"
              style={{ fontFamily: '"Sora", sans-serif' }}
            >
              {t("appointments.patientPortal.mySchedule")}
            </p>
            <h2
              className="mt-0.5 text-2xl font-semibold tracking-tight text-[#0b1f4a] sm:text-[1.75rem]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {patientName}
            </h2>
            <p className="mt-1 text-[11px] tracking-wide text-blue-800/50">
              {user?.tenantLabel || "Shambua Santé"}
            </p>
          </div>
        </div>

        {!loading && !error && (
          <div className="flex flex-wrap gap-7 sm:gap-9">
            <StudioMetric
              icon={CalendarDays}
              value={stats.total}
              label={t("appointments.patientPortal.statTotal")}
              delay={0.28}
            />
            <StudioMetric
              icon={Clock}
              value={stats.upcoming}
              label={t("appointments.patientPortal.statUpcoming")}
              delay={0.34}
            />
            <StudioMetric
              icon={Video}
              value={stats.tele}
              label={t("appointments.patientPortal.statTele")}
              delay={0.4}
            />
            <StudioMetric
              icon={MapPin}
              value={stats.physical}
              label={t("appointments.patientPortal.statPhysical")}
              delay={0.46}
            />
          </div>
        )}
      </motion.div>

      {/* Prochain RDV — hors hero */}
      {!loading && !error && nextAppointment && filter !== "past" && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="mt-8 px-1 sm:px-2"
        >
          <NextSpotlight
            appointment={nextAppointment}
            t={t}
            locale={locale}
            onJoin={handleJoin}
          />
        </motion.section>
      )}

      {error && (
        <div className="mt-5 px-1 sm:px-2">
          <p className="rounded-xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
            {t("appointments.patientPortal.loadError")}
          </p>
          <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t("common.refresh")}
          </Button>
        </div>
      )}

      {/* Agenda */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.32 }}
        className="mt-10 px-1 sm:px-2"
      >
        <div className="mb-5">
          <h3
            className="text-2xl font-semibold text-[#0b1f4a]"
            style={{ fontFamily: '"Fraunces", "Sora", serif' }}
          >
            {t("appointments.patientPortal.agendaTitle")}
          </h3>
          <p className="mt-1 text-sm text-blue-800/50">
            {filtered.length} / {(appointments || []).length} · {t("appointments.patientPortal.agendaHint")}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-b border-blue-900/8 pb-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-800/40" />
            <Input
              type="text"
              placeholder={t("appointments.patientPortal.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-blue-900/10 bg-white/80 pl-9 shadow-sm backdrop-blur-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTER_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  filter === key
                    ? "bg-blue-800 text-white shadow-md shadow-blue-900/25"
                    : "text-blue-900/65 hover:bg-blue-900/[0.06] hover:text-blue-950",
                )}
              >
                {t(`appointments.patientPortal.filter.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <AgendaSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-800/10 text-blue-800"
              >
                <Sparkles className="h-7 w-7" />
              </motion.div>
              <p
                className="text-lg font-semibold text-[#0b1f4a]"
                style={{ fontFamily: '"Fraunces", "Sora", serif' }}
              >
                {t("appointments.patientPortal.emptyTitle")}
              </p>
              <p className="mt-2 max-w-sm text-sm text-blue-800/55">
                {t("appointments.patientPortal.empty")}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {grouped.map(([key, group], gIdx) => (
                <section key={key}>
                  <motion.h4
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(gIdx * 0.05, 0.2) }}
                    className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-800/50"
                    style={{ fontFamily: '"Sora", sans-serif' }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {group.label}
                    <span className="rounded-md bg-blue-800/8 px-2 py-0.5 text-[10px] tabular-nums normal-case tracking-normal text-blue-900/70">
                      {group.items.length}
                    </span>
                  </motion.h4>

                  <div className="relative">
                    <div
                      aria-hidden
                      className="absolute bottom-4 left-[1.35rem] top-3 w-px bg-gradient-to-b from-blue-700/35 via-sky-400/40 to-transparent sm:left-[1.6rem]"
                    />
                    <AnimatePresence mode="popLayout">
                      {group.items.map((a, index) => (
                        <AppointmentRow
                          key={a.idRdv || a.id}
                          appointment={a}
                          index={index}
                          t={t}
                          locale={locale}
                          onJoin={handleJoin}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  )
}

function StudioMetric({ icon: Icon, value, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="min-w-[4.75rem]"
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

function NextSpotlight({ appointment, t, locale, onJoin }) {
  const isTele = appointment.isTele
  const canJoin = isTele && ["upcoming", "in-progress"].includes(appointment.status)
  const dt = parseApptDate(appointment.dateHeureRdv)
  const numero =
    appointment.numero ||
    (isTele
      ? formatTeleconsultationNumero(appointment.idRdv, appointment.idHopital)
      : appointment.idRdv
        ? `RDV-${String(appointment.idRdv).padStart(4, "0")}`
        : null)
  const label =
    appointment.label ||
    (isTele
      ? formatTeleconsultationLabel(
          appointment.idRdv,
          appointment.idHopital,
          appointment.reason,
          locale === "en" ? "en" : "fr",
        )
      : appointment.reason)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-900/10 bg-white/75 shadow-sm backdrop-blur-sm">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-700 to-sky-400"
      />
      <div className="flex flex-col gap-5 p-5 pl-6 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pl-7">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg",
              isTele
                ? "bg-blue-800 text-sky-200 shadow-blue-900/25"
                : "bg-sky-200 text-blue-900 shadow-sky-400/30",
            )}
          >
            {isTele ? <Video className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800/55"
              style={{ fontFamily: '"Sora", sans-serif' }}
            >
              {t("appointments.patientPortal.nextAppointment")}
            </p>
            {numero && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-800/10 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-blue-900">
                  {numero}
                </span>
                {appointment.idRdv && (
                  <span className="text-[11px] font-medium text-blue-800/50">
                    {t("tele.rdvNumber", { id: appointment.idRdv })}
                  </span>
                )}
              </div>
            )}
            <h3
              className="mt-1 text-xl font-semibold text-[#0b1f4a]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {isTele ? label : appointment.doctor}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-blue-800/60">
              {isTele ? (
                <>
                  <span className="font-medium text-blue-900/80">{appointment.doctor}</span>
                  {appointment.reason && appointment.reason !== "—" ? ` · ${appointment.reason}` : ""}
                </>
              ) : (
                appointment.reason
              )}
            </p>
            <p className="mt-2 text-sm font-medium text-blue-950/80">
              {formatDateTime(appointment.dateHeureRdv, locale)}
              <span className="mx-2 text-blue-800/35">·</span>
              {appointment.duration}
              {dt && (
                <>
                  <span className="mx-2 text-blue-800/35">·</span>
                  <span className="tabular-nums">{appointment.time}</span>
                </>
              )}
            </p>
          </div>
        </div>
        {canJoin && (
          <Button
            size="lg"
            className="h-11 shrink-0 gap-2 rounded-xl bg-blue-800 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-900"
            onClick={() => onJoin(appointment)}
          >
            <Video className="h-4 w-4" />
            {t("tele.joinSession")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function AppointmentRow({ appointment, index, t, locale, onJoin }) {
  const isTele = appointment.isTele
  const canJoin = isTele && ["upcoming", "in-progress"].includes(appointment.status)
  const dt = parseApptDate(appointment.dateHeureRdv)
  const day = dt ? dt.getDate() : "—"
  const month = dt
    ? dt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "short" })
    : "—"
  const numero =
    appointment.numero ||
    (isTele
      ? formatTeleconsultationNumero(appointment.idRdv, appointment.idHopital)
      : appointment.idRdv
        ? `RDV-${String(appointment.idRdv).padStart(4, "0")}`
        : null)
  const label =
    appointment.label ||
    (isTele
      ? formatTeleconsultationLabel(
          appointment.idRdv,
          appointment.idHopital,
          appointment.reason,
          locale === "en" ? "en" : "fr",
        )
      : appointment.reason)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      className="relative flex gap-4 pb-5 sm:gap-5"
    >
      <div className="relative z-10 flex w-11 shrink-0 flex-col items-center sm:w-12">
        <div
          className={cn(
            "flex h-10 w-10 flex-col items-center justify-center rounded-xl shadow-lg sm:h-11 sm:w-11",
            isTele
              ? "bg-blue-800 text-sky-100 shadow-blue-900/30"
              : "bg-sky-200 text-blue-900 shadow-sky-400/35",
          )}
        >
          <span className="text-[8px] font-semibold uppercase leading-none opacity-80">{month}</span>
          <span
            className="text-sm font-semibold leading-none tabular-nums"
            style={{ fontFamily: '"Fraunces", "Sora", serif' }}
          >
            {day}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "group min-w-0 flex-1 border-b border-blue-900/6 py-2 pr-1 transition-colors duration-300",
          "hover:border-blue-600/20",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "gap-1 border-0 text-[10px] font-semibold uppercase tracking-wide",
                  isTele ? "bg-blue-800/10 text-blue-900" : "bg-sky-200/60 text-blue-900",
                )}
              >
                {isTele ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                {isTele
                  ? t("appointments.patientPortal.modeTele")
                  : t("appointments.patientPortal.modePhysical")}
              </Badge>
              <Badge
                className={cn(
                  "border-0 text-[10px] font-semibold",
                  STATUS_STYLE[appointment.status] || "bg-blue-800/10 text-blue-900",
                )}
              >
                {t(`statuses.${appointment.status}`)}
              </Badge>
            </div>

            <div className="mt-2.5 flex items-start gap-3">
              <Avatar name={appointment.doctor} className="mt-0.5 h-9 w-9 text-xs" />
              <div className="min-w-0">
                {numero && (
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-blue-800/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-blue-900">
                      {numero}
                    </span>
                    {appointment.idRdv && (
                      <span className="text-[10px] font-medium text-blue-800/45">
                        {t("tele.rdvNumber", { id: appointment.idRdv })}
                      </span>
                    )}
                  </div>
                )}
                <h4
                  className="text-[1.05rem] font-semibold leading-snug text-[#0b1f4a]"
                  style={{ fontFamily: '"Fraunces", "Sora", serif' }}
                >
                  {isTele ? label : appointment.doctor}
                </h4>
                <p className="mt-0.5 line-clamp-2 text-sm text-blue-800/55">
                  {isTele ? (
                    <>
                      <span className="font-medium text-blue-900/75">{appointment.doctor}</span>
                      {appointment.reason && appointment.reason !== "—"
                        ? ` · ${appointment.reason}`
                        : ""}
                    </>
                  ) : (
                    appointment.reason
                  )}
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-800/50">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {appointment.time}
                {appointment.duration ? ` · ${appointment.duration}` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateTime(appointment.dateHeureRdv, locale)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end sm:pt-1">
            {canJoin ? (
              <Button
                size="sm"
                className="h-9 gap-2 rounded-lg bg-blue-800 text-white shadow-md shadow-blue-900/20 hover:bg-blue-900"
                onClick={() => onJoin(appointment)}
              >
                <Video className="h-3.5 w-3.5" />
                {t("appointments.actionsJoin")}
                <ChevronRight className="h-3.5 w-3.5 opacity-70" />
              </Button>
            ) : appointment.status === "upcoming" && !isTele ? (
              <div className="inline-flex max-w-[11rem] items-start gap-2 text-xs leading-snug text-blue-800/55">
                <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-700" />
                {t("appointments.patientPortal.presentialHint")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function AgendaSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 sm:gap-5">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-blue-900/10" />
          <div className="h-24 flex-1 animate-pulse rounded-lg bg-white/50" />
        </div>
      ))}
    </div>
  )
}
