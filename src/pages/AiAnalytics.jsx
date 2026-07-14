import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Brain,
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  Search,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  BarChart3,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { aiAnalyticsService, dashboardService } from "@/services/api"
import { cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts"
import { ChartTooltip } from "@/components/ChartTooltip"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const categoryConfig = {
  improvement: { badge: "success", icon: TrendingUp, labelKey: "aiAnalytics.improvement", bg: "bg-success/12", color: "text-success" },
  usage: { badge: "primary", icon: BarChart3, labelKey: "aiAnalytics.usage", bg: "bg-primary/10", color: "text-primary" },
  engagement: { badge: "secondary", icon: Activity, labelKey: "aiAnalytics.engagement", bg: "bg-accent/15", color: "text-accent-foreground" },
}

export default function AiAnalytics() {
  const { t, lang } = useI18n()
  const { data: kpis } = useAsync(() => aiAnalyticsService.getKpis(), [])
  const { data: modelUsage } = useAsync(() => aiAnalyticsService.getModelUsageSeries(), [])
  const { data: costData } = useAsync(() => aiAnalyticsService.getInferenceCostSeries(), [])
  const { data: adoption } = useAsync(() => aiAnalyticsService.getAdoptionByTenant(), [])
  const { data: quality } = useAsync(() => aiAnalyticsService.getQualityMetrics(), [])
  const { data: insights } = useAsync(() => dashboardService.getAiInsights(), [])

  const [query, setQuery] = useState("")

  const filteredInsights = useMemo(() => {
    if (!insights) return []
    if (!query) return insights
    const q = query.toLowerCase()
    return insights.filter((ins) => ins.text.toLowerCase().includes(q))
  }, [insights, query])

  return (
    <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          title={t("aiAnalytics.title")}
          subtitle={t("aiAnalytics.subtitle")}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
                {t("common.refresh")}
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4" />
                {t("common.export")}
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {[
          { label: t("aiAnalytics.modelUsage"), value: kpis?.modelUsage.value ?? 0, delta: kpis?.modelUsage.delta ?? 0, icon: Brain, color: "text-secondary", bg: "bg-secondary/15" },
          { label: t("aiAnalytics.inferenceCost"), value: kpis?.inferenceCost.value ?? 0, delta: kpis?.inferenceCost.delta ?? 0, prefix: "$", icon: DollarSign, color: "text-warning", bg: "bg-warning/18" },
          { label: t("aiAnalytics.adoption"), value: kpis?.adoption.value ?? 0, delta: kpis?.adoption.delta ?? 0, suffix: "%", icon: Users, color: "text-primary", bg: "bg-primary/12" },
          { label: t("aiAnalytics.qualityScore"), value: kpis?.qualityScore.value ?? 0, delta: kpis?.qualityScore.delta ?? 0, suffix: "%", decimals: 1, icon: Activity, color: "text-success", bg: "bg-success/12" },
        ].map((kpi, i) => {
          const positive = (kpi.delta || 0) >= 0
          const TrendIcon = positive ? ChevronUp : ChevronDown
          return (
            <Card key={i} className={cn("relative overflow-hidden border-l-4", kpi.bg, kpi.color, "border-l-current")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.bg, kpi.color)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  {kpi.delta !== undefined && (
                    <span className={cn("flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold", positive ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive")}>
                      <TrendIcon className="h-3 w-3" />
                      {Math.abs(kpi.delta)}%
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="font-display text-[26px] font-bold tracking-tight text-foreground">
                    {kpi.prefix || ""}
                    {(kpi.value || 0).toLocaleString()}
                    {kpi.suffix || ""}
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
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                {t("aiAnalytics.usageTitle")}
              </CardTitle>
              <CardDescription>{t("aiAnalytics.usageSub")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={modelUsage || []} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gGpt4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gClaude" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMedllm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="gpt4" name={t("aiAnalytics.gpt4")} stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#gGpt4)" />
                  <Area type="monotone" dataKey="claude" name={t("aiAnalytics.claude")} stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#gClaude)" />
                  <Area type="monotone" dataKey="medllm" name={t("aiAnalytics.medllm")} stroke="var(--color-chart-3)" strokeWidth={2} fill="url(#gMedllm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                {t("aiAnalytics.costTitle")}
              </CardTitle>
              <CardDescription>{t("aiAnalytics.costSub")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData || []} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip prefix="$" />} />
                  <Bar dataKey="cost" name={t("aiAnalytics.inferenceCost")} fill="url(#gCost)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {t("aiAnalytics.adoptionTitle")}
              </CardTitle>
              <CardDescription>{t("aiAnalytics.adoptionSub")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(adoption || []).map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium text-foreground">{item.adoption}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.adoption}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                {t("aiAnalytics.qualityTitle")}
              </CardTitle>
              <CardDescription>{t("aiAnalytics.qualitySub")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">{t("aiAnalytics.model") || "Model"}</th>
                    <th className="px-6 py-3 font-semibold">{t("aiAnalytics.accuracy")}</th>
                    <th className="px-6 py-3 font-semibold">{t("aiAnalytics.precision")}</th>
                    <th className="px-6 py-3 font-semibold">{t("aiAnalytics.recall")}</th>
                    <th className="px-6 py-3 font-semibold">{t("aiAnalytics.f1")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(quality || []).map((row, i) => (
                    <motion.tr
                      key={row.model}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-6 py-3.5 font-medium text-foreground">{row.model}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{row.accuracy}%</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{row.precision}%</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{row.recall}%</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">{row.f1}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
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
                  <Lightbulb className="h-4 w-4 text-primary" />
                  {t("aiAnalytics.insightsTitle")}
                </CardTitle>
                <CardDescription>{t("aiAnalytics.insightsSub")}</CardDescription>
              </div>
              <Badge variant="secondary">{filteredInsights.length} insights</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("common.searchEverything")}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
          </CardContent>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <div className="space-y-0">
                {(filteredInsights || []).map((ins, i) => {
                  const category = categoryConfig[ins.category] || categoryConfig.usage
                  return (
                    <motion.div
                      key={ins.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 border-b border-border/60 last:border-0 px-5 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", category.bg, category.color)}>
                        <category.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{lang === "fr" ? ins.textFr : ins.text}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant={category.badge} className="text-[10px]">{t(category.labelKey)}</Badge>
                          <span>•</span>
                          <span>{ins.time}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
            {filteredInsights.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("common.noResults")}</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
