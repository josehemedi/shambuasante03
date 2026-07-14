import { FlaskConical, Loader, CheckCircle2, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { labService } from "@/services/api"

const statusVariant = { pending: "warning", "in-progress": "primary", completed: "success" }

export default function LabDashboard() {
  const { t } = useI18n()
  const { data: kpis } = useAsync(() => labService.getKpis(), [])
  const { data: queue } = useAsync(() => labService.getQueue(), [])
  const { data: critical } = useAsync(() => labService.getCritical(), [])

  return (
    <div>
      <PageHeader title={t("labDash.title")} subtitle={t("labDash.subtitle")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label={t("labDash.pending")} value={kpis?.pending.value ?? 0} delta={kpis?.pending.delta ?? 0} icon={FlaskConical} tone="warning" />
        <StatCard index={1} label={t("labDash.inProgress")} value={kpis?.inProgress.value ?? 0} delta={kpis?.inProgress.delta ?? 0} icon={Loader} tone="primary" />
        <StatCard index={2} label={t("labDash.completed")} value={kpis?.completed.value ?? 0} delta={kpis?.completed.delta ?? 0} icon={CheckCircle2} tone="secondary" />
        <StatCard index={3} label={t("labDash.critical")} value={kpis?.critical.value ?? 0} delta={kpis?.critical.delta ?? 0} icon={AlertTriangle} tone="accent" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("labDash.queueTitle")}</CardTitle>
              <CardDescription>{t("labDash.queueSub")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">{t("labDash.colId")}</th>
                    <th className="px-6 py-3 font-medium">{t("patients.patient")}</th>
                    <th className="px-6 py-3 font-medium">{t("labDash.colTest")}</th>
                    <th className="px-6 py-3 font-medium">{t("labDash.colPriority")}</th>
                    <th className="px-6 py-3 font-medium">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(queue || []).map((row) => (
                    <tr key={row.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{row.id}</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">{row.patient}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{row.test}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={row.priority === "stat" ? "destructive" : "default"}>
                          {row.priority === "stat" ? t("labDash.stat") : t("labDash.routine")}
                        </Badge>
                      </td>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t("labDash.criticalTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(critical || []).map((c) => (
              <div key={c.id} className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{c.patient}</p>
                  <Badge variant="destructive">{c.flag}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.test}</p>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-destructive">{c.value}</span>
                  <span className="text-muted-foreground">{t("labDash.ref")}: {c.ref}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
