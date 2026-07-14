import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Building2, Users, DollarSign, TrendingUp, Globe } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { superAdminService } from "@/services/api"
import { formatCurrency } from "@/lib/utils"
import { ChartTooltip } from "@/components/ChartTooltip"

const statusVariant = { active: "success", trial: "warning", suspended: "destructive" }

export default function SuperAdminDashboard() {
  const { t, lang } = useI18n()
  const { data: kpis } = useAsync(() => superAdminService.getKpis(), [])
  const { data: mrr } = useAsync(() => superAdminService.getMrrSeries(), [])
  const { data: plans } = useAsync(() => superAdminService.getPlanDistribution(), [])
  const { data: tenants } = useAsync(() => superAdminService.getTenants(), [])

  return (
    <div>
      <PageHeader title={t("superDash.title")} subtitle={t("superDash.subtitle")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label={t("superDash.hospitals")} value={kpis?.hospitals.value ?? 0} delta={kpis?.hospitals.delta ?? 0} icon={Building2} tone="primary" />
        <StatCard index={1} label={t("superDash.activeUsers")} value={kpis?.activeUsers.value ?? 0} delta={kpis?.activeUsers.delta ?? 0} icon={Users} tone="accent" />
        <StatCard index={2} label={t("superDash.mrr")} value={kpis?.mrr.value ?? 0} delta={kpis?.mrr.delta ?? 0} icon={DollarSign} tone="secondary" formatter={(v) => formatCurrency(v, lang)} />
        <StatCard index={3} label={t("superDash.growth")} value={kpis?.growth.value ?? 0} delta={kpis?.growth.delta ?? 0} icon={TrendingUp} tone="warning" decimals={1} suffix="%" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("superDash.mrrTitle")}</CardTitle>
              <CardDescription>{t("superDash.mrrSub")}</CardDescription>
            </div>
            <Badge variant={kpis?.mrrGrowth >= 0 ? "success" : "destructive"}>
              {kpis?.mrrGrowth >= 0 ? "+" : ""}{Number(kpis?.mrrGrowth ?? 0).toFixed(1)}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrr || []} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip prefix="$" suffixK />} />
                  <Area type="monotone" dataKey="mrr" name={t("superDash.mrr")} stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#gMrr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("superDash.planTitle")}</CardTitle>
              <CardDescription>{t("superDash.planSub")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={plans || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>
                    {(plans || []).map((p) => (
                      <Cell key={p.name} fill={p.color} stroke="var(--color-card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-2">
              {(plans || []).map((p) => (
                <li key={p.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                  <span className="font-medium text-foreground">{p.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {t("superDash.tenantsTitle")}
            </CardTitle>
            <CardDescription>{t("superDash.tenantsSub")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">{t("superDash.colHospital")}</th>
                  <th className="px-6 py-3 font-medium">{t("superDash.colCountry")}</th>
                  <th className="px-6 py-3 font-medium">{t("superDash.colPlan")}</th>
                  <th className="px-6 py-3 font-medium">{t("superDash.colUsers")}</th>
                  <th className="px-6 py-3 font-medium">{t("superDash.colMrr")}</th>
                  <th className="px-6 py-3 font-medium">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {(tenants || []).map((row) => (
                  <tr key={row.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3.5 font-medium text-foreground">{row.name}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{row.country}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={row.plan === "Enterprise" ? "primary" : row.plan === "Growth" ? "secondary" : "default"}>
                        {row.plan}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">{row.users}</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{formatCurrency(row.mrr, lang)}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusVariant[row.status]}>{t(`statuses.${row.status}`)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
