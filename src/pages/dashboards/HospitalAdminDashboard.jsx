import { motion } from "framer-motion"
import { useState } from "react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Users,
  Video,
  DollarSign,
  Sparkles,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  Download,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { hospitalAdminDashboardService, tenantSubscriptionService } from "@/services/api"
import { SubscriptionAlertBanner } from "@/pages/MySubscription"
import SubscriptionPaymentModal from "@/components/SubscriptionPaymentModal"
import { formatCurrency } from "@/lib/utils"
import { ChartTooltip } from "@/components/ChartTooltip"
import { exportHospitalAdminDashboardToExcel } from "@/lib/exportHospitalAdminDashboardExcel"

const MySwal = withReactContent(Swal)

export default function Dashboard() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [paying, setPaying] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { data: dashboard } = useAsync(
    () => hospitalAdminDashboardService.getDashboard(lang),
    [lang],
  )
  const { data: subscription, reload: reloadSubscription } = useAsync(
    () => tenantSubscriptionService.getCurrent(),
    [],
  )

  const kpis = dashboard?.kpis
  const revenue = dashboard?.revenueSeries
  const flow = dashboard?.patientFlow
  const deptLoad = dashboard?.departmentLoad
  const alerts = dashboard?.emergencyAlerts
  const insights = dashboard?.aiInsights
  const timeline = dashboard?.activityTimeline
  const revenueDelta = kpis?.revenueMtd?.delta ?? 0

  const handleQuickRepay = () => {
    setPaymentOpen(true)
  }

  const processRepayment = async () => {
    setPaying(true)
    try {
      await tenantSubscriptionService.repay()
      reloadSubscription()
      await Swal.fire({
        icon: "success",
        title: t("mySubscription.repaySuccessTitle"),
        text: t("mySubscription.repaySuccess"),
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      throw err
    } finally {
      setPaying(false)
    }
  }

  const subscriptionAmount = subscription?.montantMensuel != null
    ? `${formatCurrency(subscription.montantMensuel, lang)}${t("mySubscription.perMonth")}`
    : "—"

  const handleExportAll = async () => {
    if (!dashboard || exporting) return
    setExporting(true)
    try {
      const { filename, sheets } = exportHospitalAdminDashboardToExcel(dashboard, {
        hopitalId: user?.idHopital,
        hospitalName: dashboard?.hospitalName || user?.tenantLabel || t("dashboard.exportDefaultHospital"),
        exportedBy: user?.name || "",
        lang,
        labels: {
          summarySubtitle: t("dashboard.exportSummarySubtitle"),
          kpiSection: t("dashboard.exportKpiSection"),
          totalPatients: t("dashboard.totalPatients"),
          activeConsultations: t("dashboard.activeConsultations"),
          revenue: t("dashboard.revenue"),
          revenueSubtitle: t("dashboard.revenueOverview"),
          revenueNote: t("dashboard.exportRevenueNote"),
          month: t("dashboard.exportMonth"),
          inpatient: t("dashboard.inpatient"),
          outpatient: t("dashboard.outpatient"),
          tele: t("dashboard.tele"),
          total: t("dashboard.exportTotal"),
          visual: t("dashboard.exportVisual"),
          flowSubtitle: t("dashboard.patientFlow"),
          flowNote: t("dashboard.exportFlowNote"),
          day: t("dashboard.exportDay"),
          admissions: t("dashboard.admissions"),
          discharges: t("dashboard.discharges"),
          admissionsBar: t("dashboard.exportAdmissionsBar"),
          dischargesBar: t("dashboard.exportDischargesBar"),
          days: {
            mon: t("dashboard.days.mon"),
            tue: t("dashboard.days.tue"),
            wed: t("dashboard.days.wed"),
            thu: t("dashboard.days.thu"),
            fri: t("dashboard.days.fri"),
            sat: t("dashboard.days.sat"),
            sun: t("dashboard.days.sun"),
          },
          deptSubtitle: t("dashboard.departmentLoad"),
          deptNote: t("dashboard.exportDeptNote"),
          department: t("dashboard.exportDepartment"),
          load: t("dashboard.exportLoad"),
          status: t("dashboard.exportStatus"),
          critical: t("dashboard.exportCritical"),
          high: t("dashboard.exportHigh"),
          normal: t("dashboard.exportNormal"),
          warning: t("dashboard.exportWarning"),
          alertsSubtitle: t("dashboard.emergencyAlerts"),
          alertsNote: t("dashboard.exportAlertsNote"),
          noAlerts: t("dashboard.noAlerts"),
          level: t("dashboard.exportLevel"),
          alertTitle: t("dashboard.exportAlertTitle"),
          deptCol: t("dashboard.exportDepartment"),
          timeCol: t("dashboard.exportTime"),
          insightsSubtitle: t("dashboard.aiInsights"),
          insightsNote: t("dashboard.exportInsightsNote"),
          type: t("dashboard.exportType"),
          detail: t("dashboard.exportDetail"),
          timelineSubtitle: t("dashboard.activityTimeline"),
          timelineNote: t("dashboard.exportTimelineNote"),
          noActivity: t("dashboard.noActivity"),
          event: t("dashboard.exportEvent"),
          actor: t("dashboard.exportActor"),
        },
      })

      await MySwal.fire({
        icon: "success",
        title: t("dashboard.exportSuccessTitle"),
        text: t("dashboard.exportSuccess", { sheets, filename }),
        timer: 2800,
        showConfirmButton: false,
      })
    } catch (err) {
      if (err?.message === "EMPTY") {
        await MySwal.fire({
          icon: "info",
          title: t("dashboard.exportEmptyTitle"),
          text: t("dashboard.exportEmpty"),
        })
      } else {
        await MySwal.fire({
          icon: "error",
          title: t("dashboard.exportErrorTitle"),
          text: t("dashboard.exportError"),
        })
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <SubscriptionAlertBanner subscription={subscription} onRepay={handleQuickRepay} paying={paying} />
      <PageHeader
        title={t("dashboard.title")}
        subtitle={dashboard?.hospitalName || user?.tenantLabel
          ? t("dashboard.subtitleTenant", { hospital: dashboard?.hospitalName || user?.tenantLabel })
          : t("dashboard.subtitle")}
        actions={
          <>
            <Button variant="outline" size="md" onClick={handleExportAll} disabled={exporting || !dashboard}>
              <Download className="h-4 w-4" />
              {exporting ? t("dashboard.exporting") : t("dashboard.exportAll")}
            </Button>
            <Button size="md">
              <Sparkles className="h-4 w-4" />
              {t("dashboard.aiInsights")}
            </Button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          index={0}
          label={t("dashboard.totalPatients")}
          value={kpis?.totalPatients.value ?? 0}
          delta={kpis?.totalPatients.delta ?? 0}
          icon={Users}
          tone="primary"
        />
        <StatCard
          index={1}
          label={t("dashboard.activeConsultations")}
          value={kpis?.activeConsultations.value ?? 0}
          delta={kpis?.activeConsultations.delta ?? 0}
          icon={Video}
          tone="accent"
        />
        <StatCard
          index={2}
          label={t("dashboard.revenue")}
          value={kpis?.revenueMtd.value ?? 0}
          delta={kpis?.revenueMtd.delta ?? 0}
          icon={DollarSign}
          tone="secondary"
          formatter={(v) => formatCurrency(v, lang)}
        />
      </div>

      {/* Charts row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("dashboard.revenueOverview")}</CardTitle>
              <CardDescription>{t("dashboard.revenueSub")}</CardDescription>
            </div>
            <Badge variant={revenueDelta >= 0 ? "success" : "destructive"}>
              <ArrowUpRight className="h-3 w-3" />
              {revenueDelta >= 0 ? "+" : ""}
              {Number(revenueDelta).toFixed(1)}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue || []} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gTele" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip prefix="$" suffixK />} />
                  <Area type="monotone" dataKey="inpatient" name={t("dashboard.inpatient")} stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#gIn)" />
                  <Area type="monotone" dataKey="outpatient" name={t("dashboard.outpatient")} stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#gOut)" />
                  <Area type="monotone" dataKey="tele" name={t("dashboard.tele")} stroke="var(--color-chart-3)" strokeWidth={2.5} fill="url(#gTele)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department load */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("dashboard.departmentLoad")}</CardTitle>
              <CardDescription>{t("dashboard.departmentLoadSub")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(deptLoad || []).map((d, i) => (
              <div key={d.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{d.name}</span>
                  <span className="text-muted-foreground">{d.value}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: d.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${d.value}%` }}
                    transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Patient flow + alerts/insights */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("dashboard.patientFlow")}</CardTitle>
              <CardDescription>{t("dashboard.patientFlowSub")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flow || []} margin={{ left: -16, right: 8, top: 8 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="dayKey"
                    tickFormatter={(key) => t(`dashboard.days.${key}`, key)}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="admissions" name={t("dashboard.admissions")} fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="discharges" name={t("dashboard.discharges")} fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Emergency alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {t("dashboard.emergencyAlerts")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(alerts || []).length === 0 && (
                <p className="text-sm text-muted-foreground">{t("dashboard.noAlerts")}</p>
              )}
              {(alerts || []).map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3"
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      a.level === "critical" ? "bg-destructive animate-pulse" : "bg-warning"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{lang === "fr" ? a.titleFr : a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.dept} · {a.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI insights + timeline */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("dashboard.aiInsights")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(insights || []).map((ins) => (
              <div
                key={ins.id}
                className="rounded-xl border border-border bg-gradient-to-br from-muted/50 to-transparent p-4"
              >
                <Badge variant={ins.tone === "warning" ? "warning" : ins.tone === "secondary" ? "secondary" : "primary"}>
                  {ins.tone === "warning" ? "Alert" : "Insight"}
                </Badge>
                <p className="mt-2.5 text-sm font-semibold text-foreground text-pretty">
                  {lang === "fr" ? ins.titleFr : ins.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground text-pretty">
                  {lang === "fr" ? ins.detailFr : ins.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-secondary" />
              {t("dashboard.activityTimeline")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {(timeline || []).length === 0 && (
                <li className="text-sm text-muted-foreground">{t("dashboard.noActivity")}</li>
              )}
              {(timeline || []).map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                  <p className="text-sm text-foreground text-pretty">{lang === "fr" ? e.textFr : e.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.time} · {e.actor}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <SubscriptionPaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        planName={subscription?.planNom || "Starter"}
        amountLabel={subscriptionAmount}
        onPay={processRepayment}
        paying={paying}
      />
    </div>
  )
}
