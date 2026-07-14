import { useMemo, useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  AlertCircle,
  Clock,
  Server,
  Cpu,
  HardDrive,
  RefreshCw,
  Download,
  ShieldAlert,
  FilePenLine,
  Scale,
  Zap,
  Globe,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Gauge,
  Radio,
  BarChart3,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { monitoringService } from "@/services/api"
import { cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartTooltip } from "@/components/ChartTooltip"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const rowItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
}

const severityConfig = {
  critical: {
    badge: "destructive",
    dot: "bg-destructive",
    bg: "bg-destructive/8",
    border: "border-destructive/20",
    text: "text-destructive",
    icon: XCircle,
  },
  warning: {
    badge: "warning",
    dot: "bg-warning",
    bg: "bg-warning/8",
    border: "border-warning/20",
    text: "text-warning",
    icon: AlertTriangle,
  },
  info: {
    badge: "primary",
    dot: "bg-primary",
    bg: "bg-primary/8",
    border: "border-primary/20",
    text: "text-primary",
    icon: Info,
  },
}

const statusConfig = {
  online: { badge: "success", dot: "bg-success", text: "En ligne" },
  degraded: { badge: "warning", dot: "bg-warning", text: "Dégradé" },
  offline: { badge: "destructive", dot: "bg-destructive", text: "Hors ligne" },
}

const priorityConfig = {
  high: { color: "text-destructive", bg: "bg-destructive/12", label: "Haute" },
  medium: { color: "text-warning", bg: "bg-warning/12", label: "Moyenne" },
  low: { color: "text-success", bg: "bg-success/12", label: "Basse" },
}

function formatNow() {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date())
}

export default function SystemMonitoring() {
  const { t, lang } = useI18n()
  const { data: kpis } = useAsync(() => monitoringService.getKpis(), [])
  const { data: uptimeData } = useAsync(() => monitoringService.getUptimeSeries(), [])
  const { data: latencyData } = useAsync(() => monitoringService.getLatencySeries(), [])
  const { data: incidents } = useAsync(() => monitoringService.getIncidents(), [])
  const { data: alerts } = useAsync(() => monitoringService.getAlerts(), [])
  const { data: services } = useAsync(() => monitoringService.getServiceStatus(), [])
  const { data: trendData } = useAsync(() => monitoringService.getIncidentTrends(), [])
  const [lastUpdated, setLastUpdated] = useState(formatNow())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastUpdated(formatNow())
      setIsRefreshing(false)
    }, 800)
  }

  const severityCounts = useMemo(() => {
    if (!incidents) return { critical: 0, warning: 0, info: 0 }
    return incidents.reduce(
      (acc, inc) => {
        acc[inc.severity] = (acc[inc.severity] || 0) + 1
        return acc
      },
      { critical: 0, warning: 0, info: 0 },
    )
  }, [incidents])

  const activeIncidents = useMemo(() => {
    if (!incidents) return 0
    return incidents.filter((i) => i.status === "active").length
  }, [incidents])

  const activeAlerts = useMemo(() => {
    if (!alerts) return 0
    return alerts.length
  }, [alerts])

  return (
    <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          title={t("monitoring.title")}
          subtitle={t("monitoring.subtitle")}
          actions={
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                {t("monitoring.lastUpdated")} {lastUpdated}
              </span>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                {t("monitoring.refresh")}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                {t("monitoring.exportData")}
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label: t("monitoring.uptime"),
            value: kpis?.uptime.value ?? 0,
            delta: kpis?.uptime.delta ?? 0,
            suffix: "%",
            decimals: 2,
            icon: Activity,
            color: "text-success",
            bg: "bg-success/12",
            border: "border-success/30",
          },
          {
            label: t("monitoring.latency"),
            value: kpis?.latency.value ?? 0,
            delta: kpis?.latency.delta ?? 0,
            suffix: "ms",
            icon: Clock,
            color: "text-warning",
            bg: "bg-warning/12",
            border: "border-warning/30",
          },
          {
            label: t("monitoring.errorRate"),
            value: kpis?.errorRate.value ?? 0,
            delta: kpis?.errorRate.delta ?? 0,
            suffix: "%",
            decimals: 2,
            icon: AlertCircle,
            color: "text-destructive",
            bg: "bg-destructive/12",
            border: "border-destructive/30",
          },
          {
            label: t("monitoring.incidents"),
            value: activeIncidents,
            delta: kpis?.activeIncidents.delta ?? 0,
            icon: ShieldAlert,
            color: "text-primary",
            bg: "bg-primary/12",
            border: "border-primary/30",
          },
          {
            label: t("monitoring.cpu"),
            value: kpis?.cpu.value ?? 0,
            delta: kpis?.cpu.delta ?? 0,
            suffix: "%",
            icon: Cpu,
            color: "text-accent-foreground",
            bg: "bg-accent/12",
            border: "border-accent/30",
          },
          {
            label: t("monitoring.memory"),
            value: kpis?.memory.value ?? 0,
            delta: kpis?.memory.delta ?? 0,
            suffix: "%",
            icon: HardDrive,
            color: "text-secondary",
            bg: "bg-secondary/15",
            border: "border-secondary/30",
          },
        ].map((kpi, i) => {
          const positive = (kpi.delta || 0) >= 0
          const TrendIcon = positive ? ChevronUp : ChevronDown
          const isGoodTrend = positive
            ? ["uptime", "cpu", "memory"].includes(kpi.label.toLowerCase().replace("usage ", "").replace("average ", "").replace(" (7 days)", "").replace(" (24h)", ""))
            : !["errorRate", "latency", "incidents"].includes(kpi.label.toLowerCase().replace("usage ", "").replace("average ", "").replace(" (7 days)", "").replace(" (24h)", ""))

          return (
            <Card key={i} className={cn("relative overflow-hidden border-l-4 bg-card/80 backdrop-blur-sm", kpi.border)}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.bg, kpi.color)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  {kpi.delta !== undefined && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold",
                        isGoodTrend ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
                      )}
                    >
                      <TrendIcon className="h-3 w-3" />
                      {Math.abs(kpi.delta)}%
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="font-display text-[28px] font-bold tracking-tight text-foreground">
                    {kpi.value.toLocaleString()}
                    {kpi.suffix && <span className="ml-1 text-base font-medium text-muted-foreground">{kpi.suffix}</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-success" />
                  {t("monitoring.uptimeTitle")}
                </CardTitle>
                <CardDescription>{t("monitoring.uptimeSub")}</CardDescription>
              </div>
              <Badge variant="success" className="rounded-full px-3 py-1 text-xs">
                99.98% avg
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={uptimeData || []} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUptimePro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[99.9, 100]}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v.toFixed(2)}%`}
                  />
                  <Tooltip
                    content={<ChartTooltip suffix="%" />}
                    cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    name={t("monitoring.uptime")}
                    stroke="var(--color-success)"
                    strokeWidth={2.5}
                    fill="url(#gUptimePro)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-warning" />
                  {t("monitoring.latencyTitle")}
                </CardTitle>
                <CardDescription>{t("monitoring.latencySub")}</CardDescription>
              </div>
              <Badge variant="warning" className="rounded-full px-3 py-1 text-xs">
                142ms avg
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData || []} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gLatencyPro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip suffix="ms" />}
                    cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    name={t("monitoring.latency")}
                    stroke="var(--color-warning)"
                    strokeWidth={2.5}
                    fill="url(#gLatencyPro)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {t("monitoring.incidentTrendsTitle")}
                </CardTitle>
                <CardDescription>{t("monitoring.incidentTrendsSub")}</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Critical
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  Warning
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Info
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData || []} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                  />
                  <Bar dataKey="critical" stackId="a" fill="var(--color-destructive)" radius={[0, 0, 0, 0]} barSize={12} />
                  <Bar dataKey="warning" stackId="a" fill="var(--color-warning)" radius={[0, 0, 0, 0]} barSize={12} />
                  <Bar dataKey="info" stackId="a" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  {t("monitoring.incidentsTitle")}
                </CardTitle>
                <CardDescription>
                  {t("monitoring.incidentsSub")} ({activeIncidents} {t("monitoring.active").toLowerCase()})
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colId") || "ID"}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colTitle")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colSeverity")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colPriority")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colStatus")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colDuration")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colAssignedTo")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(incidents || []).map((row, i) => {
                    const sev = severityConfig[row.severity] || severityConfig.info
                    const pri = priorityConfig[row.priority] || priorityConfig.medium
                    const statusBadge = row.status === "resolved"
                      ? { variant: "success", label: t("monitoring.resolved") }
                      : { variant: "warning", label: t("monitoring.active") }

                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={cn(
                          "border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40",
                          row.status === "active" && row.severity === "critical" && "bg-destructive/5 hover:bg-destructive/10",
                        )}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground">{row.id}</td>
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {lang === "fr" && row.titleFr ? row.titleFr : row.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {lang === "fr" && row.descriptionFr ? row.descriptionFr : row.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={sev.badge} className="gap-1.5">
                            <sev.icon className="h-3 w-3" />
                            {row.severity}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", pri.bg, pri.color)}>
                            {pri.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{row.duration}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{row.assignedTo}</td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {(!incidents || incidents.length === 0) && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("monitoring.noIncidents")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  {t("monitoring.activeTitle")}
                </CardTitle>
                <CardDescription>
                  {t("monitoring.activeSub")} ({activeAlerts})
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colService")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colMetric")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colValue")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colThreshold")}</th>
                    <th className="px-5 py-3 font-semibold">{t("monitoring.colTime")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(alerts || []).map((row, i) => {
                    const sev = severityConfig[row.severity] || severityConfig.info
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={cn(
                          "border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40",
                          row.severity === "critical" && "bg-destructive/5 hover:bg-destructive/10",
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", sev.dot)} />
                            <span className="text-sm font-medium text-foreground">{row.service}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{row.metric}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn("font-mono text-sm font-semibold", sev.text)}>{row.value}</span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{row.threshold}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{row.time}</td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {(!alerts || alerts.length === 0) && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("monitoring.noAlerts")}</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  {t("monitoring.servicesTitle")}
                </CardTitle>
                <CardDescription>{t("monitoring.servicesSub")}</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Online
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  Degraded
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Offline
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(services || []).map((svc, i) => {
                const status = statusConfig[svc.status] || statusConfig.online
                return (
                  <motion.div
                    key={svc.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "relative overflow-hidden rounded-xl border bg-card/80 p-4 transition-all hover:shadow-md",
                      svc.status === "online"
                        ? "border-success/20"
                        : svc.status === "degraded"
                          ? "border-warning/20"
                          : "border-destructive/20",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={cn("h-2.5 w-2.5 rounded-full", status.dot)} />
                          {svc.status === "online" && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                          <p className="text-xs text-muted-foreground">{svc.region}</p>
                        </div>
                      </div>
                      <Badge variant={status.badge} className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                        {status.text}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("monitoring.colUptime")}</span>
                        <span className="font-mono font-medium text-foreground">{svc.uptime}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            svc.uptime >= 99.9
                              ? "bg-success"
                              : svc.uptime >= 99
                                ? "bg-warning"
                                : "bg-destructive",
                          )}
                          style={{ width: `${Math.min(100, svc.uptime)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {svc.responseTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          {svc.load}% load
                        </span>
                        <span className="font-mono">{svc.version}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {(!services || services.length === 0) && (
              <div className="py-12 text-center text-sm text-muted-foreground">{t("monitoring.noServices")}</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
