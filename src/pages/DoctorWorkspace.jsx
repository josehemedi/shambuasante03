import { useMemo, useState, useEffect, useRef } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronRight,
  FileHeart,
  FileText,
  FlaskConical,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Stethoscope,
  Video,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { StatCard } from "@/components/StatCard"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Avatar,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useRolePath } from "@/hooks/useRolePath"
import { useAsync } from "@/hooks/useAsync"
import { consultationService, workspaceService } from "@/services/api"
import { useTenantScope } from "@/hooks/useTenantScope"
import { TenantScopeBar } from "@/components/TenantScopeBar"
import NewConsultationModal from "@/components/NewConsultationModal"
import ConsultationClinicalPanel from "@/components/ConsultationClinicalPanel"
import { cn } from "@/lib/utils"

const MySwal = withReactContent(Swal)

const APPT_STATUS_VARIANT = {
  arrived: "success",
  confirmed: "primary",
  pending: "warning",
}

const ACTIVITY_STYLES = {
  LAB: {
    icon: FlaskConical,
    ring: "bg-secondary/15 text-secondary ring-secondary/25",
    dot: "bg-secondary",
  },
  NOTIFICATION: {
    icon: MessageSquare,
    ring: "bg-accent/15 text-accent-foreground ring-accent/25",
    dot: "bg-accent",
  },
  default: {
    icon: FileText,
    ring: "bg-primary/10 text-primary ring-primary/20",
    dot: "bg-primary",
  },
}

const QUICK_LINKS = [
  { to: "/appointments", icon: CalendarDays, labelKey: "nav.appointments", tone: "primary" },
  { to: "/teleconsultation", icon: Video, labelKey: "nav.teleconsultation", tone: "secondary" },
  { to: "/records", icon: FileHeart, labelKey: "nav.records", tone: "accent" },
  { to: "/test-requests", icon: FlaskConical, labelKey: "nav.testRequests", tone: "warning" },
]

function WorkspacePanel({ title, subtitle, icon: Icon, actionTo, actionLabel, children, className = "" }) {
  return (
    <Card className={cn("flex h-full flex-col overflow-hidden", className)}>
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <Icon className="h-4 w-4" />
              </span>
              {title}
            </CardTitle>
            {subtitle && <CardDescription className="mt-1.5 pl-[2.875rem]">{subtitle}</CardDescription>}
          </div>
          {actionTo && (
            <Link to={actionTo} className="shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5">
                {actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2.5 py-4">{children}</CardContent>
    </Card>
  )
}

function EmptyState({ message, icon: Icon = Calendar }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-gradient-to-b from-muted/30 to-muted/10 px-6 py-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function formatTodayDate(locale) {
  try {
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date())
  } catch {
    return new Date().toLocaleDateString()
  }
}

export default function DoctorWorkspace() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const { path } = useRolePath()
  const { scopedSubtitle, hasTenant } = useTenantScope()
  const [searchParams, setSearchParams] = useSearchParams()
  const consultationIdParam = searchParams.get("consultation")
  const rdvIdParam = searchParams.get("rdv")
  const doctorName = user?.name || "Dr."
  const { data, loading, error, reload } = useAsync(() => workspaceService.getData(), [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [openingId, setOpeningId] = useState(null)
  const consultPanelRef = useRef(null)

  const stats = data?.stats
  const agenda = data?.agenda || []
  const recentActivity = data?.recentActivity || []
  const todayLabel = useMemo(() => formatTodayDate(locale), [locale])

  const closeConsultationPanel = () => {
    const next = new URLSearchParams(searchParams)
    next.delete("consultation")
    next.delete("rdv")
    setSearchParams(next, { replace: true })
  }

  const openPresentielFiche = async (idRdv) => {
    if (!idRdv) return
    setOpeningId(idRdv)
    try {
      const fiche = await consultationService.openFicheByRdv(idRdv)
      const idConsultation = fiche?.idConsultation
      if (!idConsultation) {
        throw new Error(t("tele.consultSheet.loadError"))
      }
      const next = new URLSearchParams(searchParams)
      next.set("consultation", String(idConsultation))
      next.delete("rdv")
      setSearchParams(next, { replace: true })
      requestAnimationFrame(() => {
        consultPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("tele.consultSheet.loadError"),
      })
    } finally {
      setOpeningId(null)
    }
  }

  // Ouverture auto si on arrive avec ?rdv= (présentiel)
  useEffect(() => {
    if (!rdvIdParam || consultationIdParam) return undefined
    openPresentielFiche(Number(rdvIdParam))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdvIdParam, consultationIdParam])

  useEffect(() => {
    if (consultationIdParam) {
      requestAnimationFrame(() => {
        consultPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [consultationIdParam])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await reload()
    } finally {
      setRefreshing(false)
    }
  }

  const handleSaveConsultation = async (formData) => {
    if (!user?.idMedecin) {
      throw new Error(t("workspace.noDoctor"))
    }

    const toDecimal = (value) => {
      if (!value) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }

    const toInteger = (value) => {
      if (!value) return null
      const parsed = Number.parseInt(value, 10)
      return Number.isFinite(parsed) ? parsed : null
    }

    setSaving(true)
    try {
      await consultationService.create({
        idMedecin: user.idMedecin,
        idPatient: Number(formData.patientId),
        idRdv: formData.appointmentId ? Number(formData.appointmentId) : null,
        motifVisite: `${formData.typeLabel}: ${formData.chiefComplaint}`,
        poids: toDecimal(formData.weight),
        taille: toInteger(formData.height),
        tensionArterielle: formData.bloodPressure || null,
        temperature: toDecimal(formData.temperature),
        frequenceCardiaque: toInteger(formData.heartRate),
        observations: formData.treatmentPlan || null,
        diagnostic: formData.diagnosis || null,
      })

      setIsModalOpen(false)
      reload()
      await MySwal.fire({
        icon: "success",
        title: t("workspace.saveConsultation"),
        text: t("workspace.createSuccess"),
        timer: 2200,
        showConfirmButton: false,
      })
    } finally {
      setSaving(false)
    }
  }

  const resolveActivityStyle = (type) => ACTIVITY_STYLES[type] || ACTIVITY_STYLES.default

  const resolveApptLink = (appt) =>
    appt.canal === "TELECONSULTATION" ? path(`/teleconsultation?rdv=${appt.id}`) : null

  const handleAgendaClick = (appt) => {
    if ((appt.canal || "").toUpperCase() === "TELECONSULTATION") {
      return
    }
    openPresentielFiche(appt.id)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message || t("workspace.loadError")}
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground shadow-lg shadow-primary/20 lg:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-secondary/25 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-3">
            <Badge className="border-white/20 bg-white/15 text-primary-foreground backdrop-blur-sm">
              <Stethoscope className="h-3 w-3" />
              {t("workspace.clinicalBadge")}
            </Badge>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
                {t("workspace.welcomeBack", { name: doctorName })}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-primary-foreground/85">
                {hasTenant ? scopedSubtitle("workspace.subtitleTenant") : t("workspace.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-primary-foreground/90">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                <Calendar className="h-3.5 w-3.5" />
                {todayLabel}
              </span>
              {user?.tenantLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                  {user.tenantLabel}
                </span>
              )}
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20"
              disabled={refreshing || loading}
              onClick={handleRefresh}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t("workspace.refreshData")}
            </Button>
            <Link to={path("/teleconsultation")}>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20"
              >
                <Video className="h-4 w-4" />
                {t("workspace.startTeleconsultation")}
              </Button>
            </Link>
            <Button
              size="sm"
              className="bg-white text-primary shadow-md hover:bg-white/95"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("workspace.newConsultation")}
            </Button>
          </div>
        </div>
      </motion.section>

      <TenantScopeBar />

      {consultationIdParam && (
        <div ref={consultPanelRef}>
          <ConsultationClinicalPanel
            enabled
            idConsultation={Number(consultationIdParam)}
            onClose={closeConsultationPanel}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          hideDelta
          label={t("workspace.appointmentsToday")}
          value={loading ? 0 : stats?.appointmentsToday ?? 0}
          icon={Calendar}
          tone="primary"
        />
        <StatCard
          index={1}
          hideDelta
          label={t("workspace.pendingLabResults")}
          value={loading ? 0 : stats?.pendingLabResults ?? 0}
          icon={FlaskConical}
          tone="secondary"
        />
        <StatCard
          index={2}
          hideDelta
          label={t("workspace.unreadMessages")}
          value={loading ? 0 : stats?.unreadMessages ?? 0}
          icon={MessageSquare}
          tone="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <WorkspacePanel
            title={t("workspace.todayAgenda")}
            subtitle={t("workspace.agendaSub")}
            icon={CalendarDays}
            actionTo="/appointments"
            actionLabel={t("common.viewAll")}
          >
            {loading ? (
              <EmptyState message={t("common.loading")} />
            ) : agenda.length === 0 ? (
              <EmptyState message={t("workspace.noAgenda")} />
            ) : (
              agenda.map((appt, index) => {
                const isTele = (appt.canal || "").toUpperCase() === "TELECONSULTATION"
                const busy = openingId === appt.id
                return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  role={isTele ? undefined : "button"}
                  tabIndex={isTele ? undefined : 0}
                  onClick={() => !isTele && handleAgendaClick(appt)}
                  onKeyDown={(e) => {
                    if (!isTele && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault()
                      handleAgendaClick(appt)
                    }
                  }}
                  className={cn(
                    "group flex items-center gap-4 rounded-xl border border-border/80 bg-card p-3.5 transition-all hover:border-primary/25 hover:bg-muted/30 hover:shadow-sm",
                    !isTele && "cursor-pointer",
                    Number(consultationIdParam) && !isTele && openingId == null && "ring-0",
                  )}
                >
                  <div className="flex w-[4.5rem] shrink-0 flex-col items-center rounded-xl bg-primary/10 py-2.5 text-primary">
                    <span className="text-sm font-bold leading-none">{appt.time}</span>
                    {isTele && (
                      <Video className="mt-1.5 h-3.5 w-3.5 opacity-80" />
                    )}
                  </div>
                  <Avatar name={appt.patientName} className="h-10 w-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{appt.patientName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {appt.motif || t(`workspace.apptTypes.${appt.typeKey}`)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                      {isTele
                        ? t("docDash.teleconsultation")
                        : t("docDash.inPerson")}
                    </p>
                  </div>
                  <Badge variant={APPT_STATUS_VARIANT[appt.statusKey] || "default"}>
                    {t(`workspace.apptStatuses.${appt.statusKey}`)}
                  </Badge>
                  {isTele ? (
                    <Link to={resolveApptLink(appt)} onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 opacity-80 transition-opacity group-hover:opacity-100"
                      >
                        {t("workspace.view")}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAgendaClick(appt)
                      }}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="h-3.5 w-3.5" />}
                      Consulter
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </motion.div>
                )
              })
            )}
          </WorkspacePanel>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="text-base">{t("workspace.quickActions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1">
              {QUICK_LINKS.map(({ to, icon: Icon, labelKey, tone }) => (
                <Link
                  key={to}
                  to={path(to)}
                  className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 transition-all hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      tone === "primary" && "bg-primary/10 text-primary",
                      tone === "secondary" && "bg-secondary/15 text-secondary",
                      tone === "accent" && "bg-accent/15 text-accent-foreground",
                      tone === "warning" && "bg-warning/18 text-warning",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {t(labelKey)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <WorkspacePanel
            title={t("workspace.recentActivity")}
            subtitle={t("workspace.activitySub")}
            icon={FileText}
          >
            {loading ? (
              <EmptyState message={t("common.loading")} icon={FileText} />
            ) : recentActivity.length === 0 ? (
              <EmptyState message={t("workspace.noActivity")} icon={FileText} />
            ) : (
              <ul className="relative space-y-0">
                {recentActivity.map((activity, index) => {
                  const style = resolveActivityStyle(activity.type)
                  const Icon = style.icon
                  const isLast = index === recentActivity.length - 1
                  return (
                    <li key={`${activity.type}-${activity.id}`} className="relative flex gap-3 pb-5 last:pb-0">
                      {!isLast && (
                        <span className="absolute left-[1.125rem] top-10 h-[calc(100%-1.5rem)] w-px bg-border" />
                      )}
                      <span
                        className={cn(
                          "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2",
                          style.ring,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                        {activity.patient && (
                          <p className="text-sm font-semibold text-foreground">{activity.patient}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{activity.detail}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", style.dot)} />
                          {activity.time}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </WorkspacePanel>
        </div>
      </div>

      <NewConsultationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveConsultation}
        loading={saving}
        appointments={agenda}
      />
    </div>
  )
}
