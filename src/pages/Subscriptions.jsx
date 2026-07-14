import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  CreditCard,
  Search,
  Download,
  RefreshCw,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input, Avatar } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { subscriptionService } from "@/services/api"
import { cn } from "@/lib/utils"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const statusConfig = {
  paid: { badge: "success", dot: "bg-success", labelKey: "subscriptions.statusPaid" },
  pending: { badge: "warning", dot: "bg-warning", labelKey: "subscriptions.statusPending" },
  overdue: { badge: "destructive", dot: "bg-destructive", labelKey: "subscriptions.statusOverdue" },
}

const planConfig = {
  Enterprise: "primary",
  Growth: "secondary",
  Starter: "default",
}

const actionConfig = {
  upgraded: { icon: ArrowUpRight, color: "text-success", bg: "bg-success/12", labelKey: "subscriptions.actionUpgraded" },
  downgraded: { icon: ArrowDownRight, color: "text-destructive", bg: "bg-destructive/12", labelKey: "subscriptions.actionDowngraded" },
  renewed: { icon: RefreshCw, color: "text-primary", bg: "bg-primary/10", labelKey: "subscriptions.actionRenewed" },
  trial: { icon: Clock, color: "text-warning", bg: "bg-warning/12", labelKey: "subscriptions.actionTrial" },
}

export default function Subscriptions() {
  const { t, lang } = useI18n()
  const { data: kpis } = useAsync(() => subscriptionService.getKpis(), [])
  const { data: invoices } = useAsync(() => subscriptionService.getInvoices(), [])
  const { data: plans } = useAsync(() => subscriptionService.getPlans(), [])
  const { data: timeline } = useAsync(() => subscriptionService.getTimeline(), [])

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = useMemo(() => {
    if (!invoices) return []
    return invoices.filter((inv) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.tenant.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [invoices, query, statusFilter])

  const totalRevenue = useMemo(() => (invoices || []).reduce((sum, inv) => sum + inv.amount, 0), [invoices])

  return (
    <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          title={t("subscriptions.title")}
          subtitle={t("subscriptions.subtitle")}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
                {t("subscriptions.refresh")}
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4" />
                {t("subscriptions.exportInvoices")}
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {[
          { label: t("subscriptions.activeSubscriptions"), value: kpis?.activeSubscriptions.value ?? 0, delta: kpis?.activeSubscriptions.delta ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/12" },
          { label: t("subscriptions.mrr"), value: kpis?.mrr.value ?? 0, delta: kpis?.mrr.delta ?? 0, prefix: "$", icon: DollarSign, color: "text-success", bg: "bg-success/12" },
          { label: t("subscriptions.arpu"), value: kpis?.arpu.value ?? 0, delta: kpis?.arpu.delta ?? 0, prefix: "$", icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/15" },
          { label: t("subscriptions.churnRate"), value: kpis?.churnRate.value ?? 0, delta: kpis?.churnRate.delta ?? 0, suffix: "%", icon: Activity, color: "text-destructive", bg: "bg-destructive/12" },
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

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  {t("subscriptions.invoices")}
                </CardTitle>
                <CardDescription>{t("subscriptions.invoicesSub")}</CardDescription>
              </div>
              <Badge variant="secondary">{filtered.length} {t("subscriptions.totalInvoices")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("subscriptions.searchInvoices")}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">{t("subscriptions.filterAll")}</option>
                <option value="paid">{t("subscriptions.statusPaid")}</option>
                <option value="pending">{t("subscriptions.statusPending")}</option>
                <option value="overdue">{t("subscriptions.statusOverdue")}</option>
              </select>
            </div>
          </CardContent>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">{t("subscriptions.colInvoice")}</th>
                    <th className="px-5 py-3 font-semibold">{t("subscriptions.colTenant")}</th>
                    <th className="px-5 py-3 font-semibold">{t("subscriptions.colPlan")}</th>
                    <th className="px-5 py-3 font-semibold">{t("subscriptions.colAmount")}</th>
                    <th className="px-5 py-3 font-semibold">{t("subscriptions.colStatus")}</th>
                    <th className="px-5 py-3 font-semibold">{t("subscriptions.colDate")}</th>
                    <th className="px-5 py-3 font-semibold">{t("subscriptions.colDueDate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(filtered || []).map((invoice, i) => {
                    const status = statusConfig[invoice.status] || statusConfig.pending
                    return (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-medium text-foreground">{invoice.id}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={invoice.tenant} className="h-9 w-9 text-xs" />
                            <span className="text-sm font-medium text-foreground">{invoice.tenant}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={planConfig[invoice.plan] || "default"}>{invoice.plan}</Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-medium text-foreground">
                            ${invoice.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", status.dot)} />
                            <Badge variant={status.badge}>{t(status.labelKey)}</Badge>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{invoice.date}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{invoice.dueDate}</td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("subscriptions.noInvoices")}</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t("subscriptions.timeline")}
            </CardTitle>
            <CardDescription>{t("subscriptions.timelineSub")}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <div className="space-y-0">
                {(timeline || []).map((event, i) => {
                  const action = actionConfig[event.action] || actionConfig.renewed
                  const ActionIcon = action.icon
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 border-b border-border/60 last:border-0 px-5 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", action.bg, action.color)}>
                        <ActionIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{event.tenant}</p>
                        <p className="text-xs text-muted-foreground">{t(action.labelKey)} {event.plan}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{event.date}</span>
                          {event.amount > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-mono">${event.amount.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
            {(!timeline || timeline.length === 0) && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("subscriptions.noTimeline")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              {t("subscriptions.plans")}
            </CardTitle>
            <CardDescription>{t("subscriptions.plansSub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(plans || []).map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border bg-card p-4 transition-all hover:shadow-md",
                    plan.popular ? "border-primary/30 shadow-sm" : "border-border",
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="primary" className="text-[10px] uppercase tracking-wider">
                        {t("subscriptions.popular")}
                      </Badge>
                    </div>
                  )}
                  <div className="mb-3">
                    <h3 className="font-display text-base font-semibold text-foreground">{lang === "fr" ? plan.nameFr : plan.name}</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="font-display text-2xl font-bold text-foreground">
                        ${plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">{t("subscriptions.perMonth")}</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {(lang === "fr" ? plan.featuresFr : plan.features).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
