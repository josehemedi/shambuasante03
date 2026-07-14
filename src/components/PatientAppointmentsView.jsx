import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
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
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Badge, Avatar, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { cn, formatDateTime } from "@/lib/utils"

const FILTER_KEYS = ["all", "upcoming", "tele", "physical", "past"]

const STATUS_VARIANT = {
  upcoming: "primary",
  "in-progress": "accent",
  completed: "success",
  cancelled: "destructive",
}

function SummaryStat({ icon: Icon, label, value, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    secondary: "bg-secondary/15 text-secondary",
    success: "bg-success/10 text-success",
  }
  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function DateBadge({ appointment, locale }) {
  const dt = appointment.dateHeureRdv ? new Date(String(appointment.dateHeureRdv).replace(" ", "T")) : null
  const valid = dt && !Number.isNaN(dt.getTime())
  const day = valid ? dt.getDate() : "—"
  const month = valid
    ? dt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "short" })
    : "—"

  return (
    <div className="flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/12 to-primary/5 py-3 text-primary shadow-sm">
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{month}</span>
      <span className="font-display text-2xl font-bold leading-none">{day}</span>
      <span className="mt-1.5 text-xs font-semibold">{appointment.time}</span>
    </div>
  )
}

function AppointmentCard({ appointment, t, locale, onJoin }) {
  const isTele = appointment.isTele
  const canJoin = isTele && ["upcoming", "in-progress"].includes(appointment.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        isTele ? "border-l-4 border-l-primary" : "border-l-4 border-l-secondary",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50",
          isTele ? "from-primary/6 via-transparent to-transparent" : "from-secondary/6 via-transparent to-transparent",
        )}
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <DateBadge appointment={appointment} locale={locale} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isTele ? "primary" : "secondary"} className="gap-1 text-[10px] uppercase tracking-wide">
              {isTele ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              {isTele ? t("appointments.patientPortal.modeTele") : t("appointments.patientPortal.modePhysical")}
            </Badge>
            <Badge variant={STATUS_VARIANT[appointment.status] || "default"}>
              {t(`statuses.${appointment.status}`)}
            </Badge>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <Avatar name={appointment.doctor} className="h-10 w-10 text-sm" />
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-foreground">{appointment.doctor}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{appointment.reason}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {appointment.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateTime(appointment.dateHeureRdv, locale)}
            </span>
            {appointment.idRdv && (
              <span className="font-mono opacity-70">#{appointment.idRdv}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {canJoin ? (
            <Button size="sm" className="gap-2 shadow-sm" onClick={() => onJoin(appointment)}>
              <Video className="h-4 w-4" />
              {t("appointments.actionsJoin")}
            </Button>
          ) : appointment.status === "upcoming" && !isTele ? (
            <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
              <Stethoscope className="mx-auto mb-1 h-4 w-4 text-primary" />
              {t("appointments.patientPortal.presentialHint")}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

function NextAppointmentHero({ appointment, t, locale, onJoin }) {
  if (!appointment) return null
  const isTele = appointment.isTele

  return (
    <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card shadow-md">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/15 p-3 text-primary">
            {isTele ? <Video className="h-6 w-6" /> : <CalendarDays className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("appointments.patientPortal.nextAppointment")}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-foreground">{appointment.doctor}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{appointment.reason}</p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {formatDateTime(appointment.dateHeureRdv, locale)}
              <span className="mx-2 text-muted-foreground">·</span>
              {appointment.duration}
            </p>
          </div>
        </div>
        {isTele && ["upcoming", "in-progress"].includes(appointment.status) && (
          <Button size="md" className="gap-2 shadow-lg shadow-primary/20" onClick={() => onJoin(appointment)}>
            <Video className="h-4 w-4" />
            {t("tele.joinSession")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  )
}

export default function PatientAppointmentsView({ appointments, loading, error, onRetry }) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
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
        const ts = a.dateHeureRdv ? new Date(String(a.dateHeureRdv).replace(" ", "T")).getTime() : 0
        return ts >= now || a.status === "in-progress"
      })
      .sort((a, b) => {
        const da = a.dateHeureRdv ? new Date(String(a.dateHeureRdv).replace(" ", "T")).getTime() : 0
        const db = b.dateHeureRdv ? new Date(String(b.dateHeureRdv).replace(" ", "T")).getTime() : 0
        return da - db
      })[0]
  }, [appointments])

  function handleJoin(appointment) {
    if (appointment?.idRdv) {
      navigate(`/teleconsultation?rdv=${appointment.idRdv}`)
    }
  }

  const patientName = user?.name || t("roles.patient")

  return (
    <div className="min-h-full">
      <PageHeader title={t("appointments.title")} subtitle={t("appointments.patientPortal.subtitle")} />

      <main className="space-y-6 p-6">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/8 via-card to-card">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={patientName} className="h-14 w-14 text-base" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  {t("appointments.patientPortal.mySchedule")}
                </p>
                <h2 className="font-display text-xl font-bold text-foreground">{patientName}</h2>
                <p className="text-sm text-muted-foreground">
                  {user?.tenantLabel || "Shambua Santé"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                {t("appointments.patientPortal.secured")}
              </div>
              <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {t("common.refresh")}
              </Button>
            </div>
          </div>
        </Card>

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat icon={CalendarDays} label={t("appointments.patientPortal.statTotal")} value={stats.total} tone="primary" />
            <SummaryStat icon={Clock} label={t("appointments.patientPortal.statUpcoming")} value={stats.upcoming} tone="accent" />
            <SummaryStat icon={Video} label={t("appointments.patientPortal.statTele")} value={stats.tele} tone="secondary" />
            <SummaryStat icon={MapPin} label={t("appointments.patientPortal.statPhysical")} value={stats.physical} tone="success" />
          </div>
        )}

        {!loading && !error && nextAppointment && filter !== "past" && (
          <NextAppointmentHero appointment={nextAppointment} t={t} locale={locale} onJoin={handleJoin} />
        )}

        {error && (
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <p>{t("appointments.patientPortal.loadError")}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              {t("common.refresh")}
            </Button>
          </Card>
        )}

        <Card className="overflow-hidden shadow-sm">
          <div className="border-b border-border/60 bg-muted/20 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("appointments.patientPortal.searchPlaceholder")}
                  className="h-10 pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_KEYS.map((key) => (
                  <FilterChip key={key} active={filter === key} onClick={() => setFilter(key)}>
                    {t(`appointments.patientPortal.filter.${key}`)}
                  </FilterChip>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">{t("appointments.patientPortal.loading")}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="rounded-2xl bg-muted/60 p-4 text-muted-foreground">
                  <CalendarDays className="h-10 w-10" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("appointments.patientPortal.emptyTitle")}</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("appointments.patientPortal.empty")}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {grouped.map(([key, group]) => (
                  <section key={key}>
                    <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {group.label}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal normal-case">
                        {group.items.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {group.items.map((a) => (
                        <AppointmentCard
                          key={a.idRdv || a.id}
                          appointment={a}
                          t={t}
                          locale={locale}
                          onJoin={handleJoin}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
