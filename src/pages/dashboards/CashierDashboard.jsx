import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  Wallet,
  Clock,
  LogOut,
  ArrowRight,
  FileBarChart2,
  Loader2,
  Receipt,
  TrendingUp,
  CircleDollarSign,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  History,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import { ChartTooltip } from "@/components/ChartTooltip"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Avatar,
  Progress,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { cashierService } from "@/services/api"
import { cn, formatCurrency, formatDateTime } from "@/lib/utils"

const MySwal = withReactContent(Swal)

const STATUS_VARIANT = {
  pending: "secondary",
  partial: "warning",
  paid: "success",
}

const PRIORITY_VARIANT = {
  high: "destructive",
  normal: "secondary",
  low: "default",
}

const CHART_COLORS = ["#1E56A0", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#6366F1"]

const METHOD_ICONS = {
  cash: Banknote,
  card: CreditCard,
  mobile_money: Smartphone,
  transfer: Building2,
}

function DashboardPanel({ title, subtitle, icon: Icon, actionLabel, onAction, children, className = "" }) {
  return (
    <Card className={cn("flex h-full flex-col overflow-hidden", className)}>
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              {title}
            </CardTitle>
            {subtitle && <CardDescription className="mt-1.5">{subtitle}</CardDescription>}
          </div>
          {onAction && (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 py-4">{children}</CardContent>
    </Card>
  )
}

function EmptyState({ message, icon: Icon = Receipt }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function buildPaymentChart(history, t) {
  if (!history.length) return []
  const grouped = history.reduce((acc, item) => {
    const key = item.method || "cash"
    acc[key] = (acc[key] || 0) + item.amount
    return acc
  }, {})
  return Object.entries(grouped).map(([method, amount]) => ({
    name: t(`cashier.payment.method_${method}`),
    value: amount,
    method,
  }))
}

function buildStatusChart(queue, t) {
  if (!queue.length) return []
  const grouped = queue.reduce((acc, item) => {
    const key = item.status || "pending"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  return Object.entries(grouped).map(([status, count]) => ({
    name: t(`cashier.status.${status}`),
    count,
    status,
  }))
}

export default function CashierDashboard() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reportLoading, setReportLoading] = useState(false)

  const { data: workspace, loading, error } = useAsync(
    () => {
      if (user?.idHopital == null) return Promise.resolve(null)
      return cashierService.getWorkspace()
    },
    [user?.idHopital],
  )

  const kpis = workspace?.kpis
  const queue = workspace?.queue || []
  const history = workspace?.history || []
  const topWaiting = queue.slice(0, 5)
  const recentHistory = history.slice(0, 5)

  const totalBalanceDue = useMemo(
    () => queue.reduce((sum, row) => sum + (row.balanceDue || 0), 0),
    [queue],
  )

  const paymentChartData = useMemo(() => buildPaymentChart(history, t), [history, t])
  const statusChartData = useMemo(() => buildStatusChart(queue, t), [queue, t])

  const formatMoney = (v) => formatCurrency(v, lang)
  const errorMessage = error?.message || (error ? t("cashier.dash.loadError") : null)

  const handleViewReport = async () => {
    if (reportLoading) return
    setReportLoading(true)
    try {
      await cashierService.downloadDashboardPdf()
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("cashier.dash.reportErrorTitle"),
        text: err?.message || t("cashier.dash.reportError"),
      })
    } finally {
      setReportLoading(false)
    }
  }

  const openDesk = () => navigate("/cashier")

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <PageHeader
        title={`${t("cashier.dash.greeting")}${user?.name ? `, ${user.name}` : ""}`}
        subtitle={
          user?.tenantLabel
            ? t("cashier.dash.subtitleTenant", { hospital: user.tenantLabel })
            : t("cashier.dash.subtitle")
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={reportLoading || loading}
              onClick={handleViewReport}
              className="gap-2"
            >
              {reportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart2 className="h-4 w-4" />
              )}
              {reportLoading ? t("cashier.dash.reportLoading") : t("cashier.dash.viewReport")}
            </Button>
            <Button size="md" onClick={openDesk} className="gap-2">
              <Wallet className="h-4 w-4" />
              {t("cashier.dash.openDesk")}
            </Button>
          </div>
        }
      />

      {/* Bannière synthèse */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[#1E56A0] via-blue-700 to-indigo-900 p-6 text-white shadow-lg shadow-blue-900/20">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">
              {workspace?.hospitalName || user?.tenantLabel || t("cashier.dash.title")}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">
              {t("cashier.dash.heroTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-blue-50/85">{t("cashier.dash.heroSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-100">
                <TrendingUp className="h-4 w-4" />
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {t("cashier.dash.collectedToday")}
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-bold">
                {formatMoney(kpis?.collectedToday?.value ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-100">
                <CircleDollarSign className="h-4 w-4" />
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {t("cashier.dash.heroBalanceDue")}
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-bold">{formatMoney(totalBalanceDue)}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-100">
                <Users className="h-4 w-4" />
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {t("cashier.dash.heroPatientsWaiting")}
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-bold">{kpis?.waitingPayment?.value ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label={t("cashier.dash.waitingPayment")}
          value={kpis?.waitingPayment?.value ?? 0}
          delta={0}
          icon={Users}
          tone="warning"
          hideDelta
        />
        <StatCard
          index={1}
          label={t("cashier.dash.collectedToday")}
          value={kpis?.collectedToday?.value ?? 0}
          delta={0}
          icon={Wallet}
          tone="primary"
          formatter={(v) => formatCurrency(v, lang)}
          hideDelta
        />
        <StatCard
          index={2}
          label={t("cashier.dash.partialPayments")}
          value={kpis?.partialPayments?.value ?? 0}
          delta={0}
          icon={Clock}
          tone="secondary"
          hideDelta
        />
        <StatCard
          index={3}
          label={t("cashier.dash.dischargePending")}
          value={kpis?.adminDischargePending?.value ?? 0}
          delta={0}
          icon={LogOut}
          tone="accent"
          hideDelta
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-base">{t("cashier.dash.chartPayments")}</CardTitle>
            <CardDescription>{t("cashier.dash.chartPaymentsSub")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <EmptyState message={t("common.loading")} />
            ) : paymentChartData.length === 0 ? (
              <EmptyState message={t("cashier.dash.noHistory")} icon={History} />
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={entry.method} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <ChartTooltip
                          prefix={lang === "fr" ? "" : ""}
                          suffix={lang === "fr" ? " GNF" : " GNF"}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-base">{t("cashier.dash.chartQueue")}</CardTitle>
            <CardDescription>{t("cashier.dash.chartQueueSub")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <EmptyState message={t("common.loading")} />
            ) : statusChartData.length === 0 ? (
              <EmptyState message={t("cashier.desk.emptyQueue")} />
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name={t("cashier.dash.patientsLabel")} radius={[6, 6, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File + Historique */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardPanel
          title={t("cashier.dash.queuePreview")}
          subtitle={t("cashier.dash.queuePreviewSub")}
          icon={Users}
          actionLabel={t("cashier.dash.viewAll")}
          onAction={openDesk}
        >
          {loading ? (
            <EmptyState message={t("common.loading")} />
          ) : topWaiting.length === 0 ? (
            <EmptyState message={t("cashier.desk.emptyQueue")} />
          ) : (
            topWaiting.map((row) => {
              const paidRatio =
                row.totalAmount > 0 ? Math.round((row.paidAmount / row.totalAmount) * 100) : 0
              return (
                <div
                  key={row.id}
                  className="group rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={row.patientName} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{row.patientName}</p>
                        <Badge variant={PRIORITY_VARIANT[row.priority] || "default"} className="text-[10px]">
                          {t(`priority.${row.priority}`)}
                        </Badge>
                        <Badge variant={STATUS_VARIANT[row.status] || "default"} className="text-[10px]">
                          {t(`cashier.status.${row.status}`)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {row.invoiceNumber} · {row.department} · {row.doctorName}
                      </p>
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{t("cashier.dash.paidProgress", { percent: paidRatio })}</span>
                          <span className="font-mono font-semibold text-foreground">
                            {formatMoney(row.balanceDue)}
                          </span>
                        </div>
                        <Progress
                          value={paidRatio}
                          className="h-1.5"
                          indicatorClassName={cn(
                            row.status === "partial" ? "bg-amber-500" : "bg-primary",
                          )}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={openDesk}
                      className="shrink-0 opacity-90 group-hover:opacity-100"
                    >
                      {t("cashier.actions.collect")}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </DashboardPanel>

        <DashboardPanel
          title={t("cashier.dash.historyTitle")}
          subtitle={t("cashier.dash.historySub")}
          icon={History}
          actionLabel={t("cashier.dash.viewAll")}
          onAction={openDesk}
        >
          {loading ? (
            <EmptyState message={t("common.loading")} />
          ) : recentHistory.length === 0 ? (
            <EmptyState message={t("cashier.dash.noHistory")} icon={History} />
          ) : (
            recentHistory.map((item) => {
              const MethodIcon = METHOD_ICONS[item.method] || Banknote
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MethodIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{item.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.receiptNumber} · {item.invoiceNumber}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {item.paidAt ? formatDateTime(item.paidAt, lang) : "—"} ·{" "}
                      {t(`cashier.payment.method_${item.method}`)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-primary">
                      +{formatMoney(item.amount)}
                    </p>
                    {item.balanceAfter > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {t("cashier.receipt.remaining")}: {formatMoney(item.balanceAfter)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}
