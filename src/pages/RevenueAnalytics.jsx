import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input, Avatar } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { revenueService } from "@/services/api"
import { cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const statusBadge = {
  active: "success",
  trial: "warning",
  suspended: "destructive",
}

const planBadge = {
  Enterprise: "primary",
  Growth: "secondary",
  Starter: "default",
}

export default function RevenueAnalytics() {
  const { t, lang } = useI18n()
  const { data: kpis } = useAsync(() => revenueService.getKpis(), [])
  const { data: trend } = useAsync(() => revenueService.getTrend(), [])
  const { data: tenants } = useAsync(() => revenueService.getTenantRevenue(), [])
  const { data: categories } = useAsync(() => revenueService.getCategories(), [])
  const { data: cohorts } = useAsync(() => revenueService.getCohorts(), [])

  const [query, setQuery] = useState("")

  const filteredTenants = useMemo(() => {
    if (!tenants) return []
    if (!query) return tenants
    const q = query.toLowerCase()
    return tenants.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q),
    )
  }, [tenants, query])

  const totalMrr = useMemo(() => (tenants || []).reduce((sum, t) => sum + t.mrr, 0), [tenants])
  const totalArr = useMemo(() => (tenants || []).reduce((sum, t) => sum + t.arr, 0), [tenants])

  return (
    <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          title={t("revenueAnalytics.title")}
          subtitle={t("revenueAnalytics.subtitle")}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4" />
                {t("revenueAnalytics.exportData")}
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: t("revenueAnalytics.mrr"), value: kpis?.mrr.value ?? 0, delta: kpis?.mrr.delta ?? 0, prefix: "$", icon: DollarSign, color: "text-primary", bg: "bg-primary/12" },
          { label: t("revenueAnalytics.arr"), value: kpis?.arr.value ?? 0, delta: kpis?.arr.delta ?? 0, prefix: "$", icon: TrendingUp, color: "text-success", bg: "bg-success/12" },
          { label: t("revenueAnalytics.arpu"), value: kpis?.arpu.value ?? 0, delta: kpis?.arpu.delta ?? 0, prefix: "$", icon: Users, color: "text-accent-foreground", bg: "bg-accent/12" },
          { label: t("revenueAnalytics.churnRate"), value: kpis?.churnRate.value ?? 0, delta: kpis?.churnRate.delta ?? 0, suffix: "%", icon: Activity, color: "text-destructive", bg: "bg-destructive/12", invertTrend: true },
          { label: t("revenueAnalytics.ltv"), value: kpis?.ltv.value ?? 0, delta: kpis?.ltv.delta ?? 0, prefix: "$", icon: DollarSign, color: "text-secondary", bg: "bg-secondary/15" },
          { label: t("revenueAnalytics.nrr"), value: kpis?.nrr.value ?? 0, delta: kpis?.nrr.delta ?? 0, suffix: "%", icon: TrendingUp, color: "text-success", bg: "bg-success/12" },
        ].map((kpi, i) => {
          const positive = (kpi.delta || 0) >= 0
          const TrendIcon = positive ? ChevronUp : ChevronDown
          const isGood = kpi.invertTrend ? !positive : positive

          return (
            <Card key={i} className={cn("relative overflow-hidden border-l-4", kpi.bg, kpi.color, "border-l-current")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.bg, kpi.color)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  {kpi.delta !== undefined && (
                    <span className={cn("flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold", isGood ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive")}>
                      <TrendIcon className="h-3 w-3" />
                      {Math.abs(kpi.delta)}%
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="font-display text-[26px] font-bold tracking-tight text-foreground">
                    {kpi.prefix || ""}
                    {(kpi.value || 0).toLocaleString()}
                    {kpi.suffix && <span className="ml-1 text-base font-medium text-muted-foreground">{kpi.suffix}</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
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
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t("revenueAnalytics.mrrTitle")}
                </CardTitle>
                <CardDescription>{t("revenueAnalytics.mrrSub")}</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  MRR
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Inpatient
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  Outpatient
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend || []} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gInpatient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gOutpatient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="mrr" name="MRR" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#gMrr)" />
                  <Area type="monotone" dataKey="inpatient" name="Inpatient" stroke="var(--color-success)" strokeWidth={2} fill="url(#gInpatient)" />
                  <Area type="monotone" dataKey="outpatient" name="Outpatient" stroke="var(--color-warning)" strokeWidth={2} fill="url(#gOutpatient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t("revenueAnalytics.categoryTitle")}
            </CardTitle>
            <CardDescription>{t("revenueAnalytics.categorySub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories || []} layout="vertical" margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
                  <Bar dataKey="value" name="Revenue" radius={[0, 4, 4, 0]} barSize={16}>
                    {(categories || []).map((entry, index) => (
                      <rect key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
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
                  <Users className="h-4 w-4 text-primary" />
                  {t("revenueAnalytics.tenantsTitle")}
                </CardTitle>
                <CardDescription>{t("revenueAnalytics.tenantsSub")}</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Total MRR: <span className="font-mono font-semibold text-foreground">${totalMrr.toLocaleString()}</span></span>
                <span>Total ARR: <span className="font-mono font-semibold text-foreground">${totalArr.toLocaleString()}</span></span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">{t("revenueAnalytics.colTenant")}</th>
                    <th className="px-5 py-3 font-semibold">{t("revenueAnalytics.colCountry")}</th>
                    <th className="px-5 py-3 font-semibold">{t("revenueAnalytics.colPlan")}</th>
                    <th className="px-5 py-3 font-semibold">{t("revenueAnalytics.colMrr")}</th>
                    <th className="px-5 py-3 font-semibold">{t("revenueAnalytics.colArr")}</th>
                    <th className="px-5 py-3 font-semibold">{t("revenueAnalytics.colGrowth")}</th>
                    <th className="px-5 py-3 font-semibold">{t("revenueAnalytics.colLastPayment")}</th>
                    <th className="px-5 py-3 font-semibold">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredTenants || []).map((tenant, i) => {
                    const growthPositive = tenant.growth >= 0
                    return (
                      <motion.tr
                        key={tenant.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={tenant.name} className="h-8 w-8 text-[10px]" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{tenant.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{tenant.country}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={planBadge[tenant.plan] || "default"}>{tenant.plan}</Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-medium text-foreground">${tenant.mrr.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm text-muted-foreground">${tenant.arr.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn("flex items-center gap-0.5 text-xs font-medium", growthPositive ? "text-success" : "text-destructive")}>
                            {growthPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(tenant.growth)}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{tenant.lastPayment}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={statusBadge[tenant.status] || "default"}>{tenant.status}</Badge>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredTenants.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("revenueAnalytics.noTenants")}</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>{t("revenueAnalytics.planDistribution")}</CardTitle>
            <CardDescription>{t("revenueAnalytics.planDistributionSub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenants || []} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="plan" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
                  <Bar dataKey="mrr" name="MRR" radius={[4, 4, 0, 0]} barSize={48}>
                    {(tenants || []).map((entry, index) => (
                      <rect key={`cell-${index}`} fill={entry.plan === "Enterprise" ? "var(--color-chart-1)" : entry.plan === "Growth" ? "var(--color-chart-2)" : "var(--color-chart-3)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>{t("revenueAnalytics.cohortTitle")}</CardTitle>
            <CardDescription>{t("revenueAnalytics.cohortSub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cohorts || []} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCohort0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gCohort1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gCohort2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="cohort0" name="Current" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#gCohort0)" />
                  <Area type="monotone" dataKey="cohort1" name="1 month" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#gCohort1)" />
                  <Area type="monotone" dataKey="cohort2" name="2 months" stroke="var(--color-chart-3)" strokeWidth={2} fill="url(#gCohort2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
