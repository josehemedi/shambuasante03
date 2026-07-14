import { useMemo, useState } from "react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { reportsService } from "@/services/api"
import { exportReportsToExcel } from "@/lib/exportReportsExcel"
import { formatCurrency } from "@/lib/utils"
import { Download, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { ChartTooltip } from "@/components/ChartTooltip"

const MySwal = withReactContent(Swal)

const PIE_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f97316"]

function defaultDateRange() {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const fromDate = new Date(today.getFullYear(), today.getMonth() - 5, 1)
  const from = fromDate.toISOString().slice(0, 10)
  return { from, to }
}

export default function Reports() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [exporting, setExporting] = useState(false)

  const { data: overview, loading } = useAsync(
    () => reportsService.getOverview({ from: dateRange.from, to: dateRange.to }),
    [dateRange.from, dateRange.to],
  )

  const monthlyAppointmentsData = overview?.monthlyAppointments || []
  const revenueData = overview?.revenueSeries || []
  const patientDemographicsData = useMemo(
    () =>
      (overview?.patientDemographics || []).map((entry) => ({
        name: lang === "fr" ? entry.nameFr || entry.name : entry.name,
        value: entry.value,
      })),
    [overview?.patientDemographics, lang],
  )

  const handleExportAll = async () => {
    if (!overview || exporting) return
    setExporting(true)
    try {
      const { filename, sheets } = exportReportsToExcel(overview, {
        hopitalId: user?.idHopital,
        hospitalName: overview.hospitalName || user?.tenantLabel || t("reportsPage.defaultHospital"),
        exportedBy: user?.name || "",
        lang,
        labels: {
          summarySubtitle: t("reportsPage.exportSummarySubtitle"),
          kpiSection: t("reportsPage.exportKpiSection"),
          totalPatients: t("reportsPage.totalPatients"),
          totalAppointments: t("reportsPage.totalAppointments"),
          totalRevenue: t("reportsPage.totalRevenue"),
          totalInvoices: t("reportsPage.totalInvoices"),
          summaryNote: t("reportsPage.exportSummaryNote"),
          period: t("reportsPage.period"),
          appointmentsSubtitle: t("reportsPage.appointmentsTitle"),
          appointmentsNote: t("reportsPage.appointmentsSub"),
          month: t("reportsPage.month"),
          consultation: t("reportsPage.consultation"),
          followUp: t("reportsPage.followUp"),
          total: t("reportsPage.total"),
          share: t("reportsPage.share"),
          visual: t("reportsPage.visual"),
          revenueSubtitle: t("reportsPage.revenueTitle"),
          revenue: t("reportsPage.revenue"),
          periodTotal: t("reportsPage.periodTotal"),
          demographicsSubtitle: t("reportsPage.demographicsTitle"),
          ageGroup: t("reportsPage.ageGroup"),
          patients: t("reportsPage.patients"),
          color: t("reportsPage.color"),
        },
      })

      await MySwal.fire({
        icon: "success",
        title: t("reportsPage.exportSuccessTitle"),
        text: t("reportsPage.exportSuccess", { sheets, filename }),
        timer: 2800,
        showConfirmButton: false,
      })
    } catch (err) {
      if (err?.message === "EMPTY") {
        await MySwal.fire({
          icon: "info",
          title: t("reportsPage.exportEmptyTitle"),
          text: t("reportsPage.exportEmpty"),
        })
      } else {
        await MySwal.fire({
          icon: "error",
          title: t("reportsPage.exportErrorTitle"),
          text: t("reportsPage.exportError"),
        })
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t("nav.reports")}
        subtitle={t("reportsPage.subtitle")}
        actions={
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={`${dateRange.from} → ${dateRange.to}`}
                readOnly
                className="pl-10 w-64 bg-card"
                placeholder={t("reportsPage.dateRange")}
              />
            </div>
            <Button variant="outline" onClick={handleExportAll} disabled={exporting || loading || !overview}>
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {exporting ? t("reportsPage.exporting") : t("reportsPage.exportAll")}
            </Button>
          </div>
        }
      />

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("reportsPage.loading")}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("reportsPage.totalPatients"), value: overview?.totalPatients ?? 0, tone: "text-sky-600" },
          { label: t("reportsPage.totalAppointments"), value: overview?.totalAppointments ?? 0, tone: "text-violet-600" },
          { label: t("reportsPage.totalRevenue"), value: formatCurrency(overview?.totalRevenue ?? 0, lang), tone: "text-emerald-600", text: true },
          { label: t("reportsPage.totalInvoices"), value: overview?.totalInvoices ?? 0, tone: "text-orange-600" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold ${kpi.tone}`}>{kpi.text ? kpi.value : kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold">{t("reportsPage.appointmentsTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("reportsPage.appointmentsSub")}</p>
          </div>
          <div className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyAppointmentsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
                  <Legend iconSize={10} />
                  <Bar
                    dataKey="consultation"
                    stackId="a"
                    fill="var(--color-primary)"
                    name={t("reportsPage.consultation")}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="followUp"
                    stackId="a"
                    fill="var(--color-secondary)"
                    name={t("reportsPage.followUp")}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold">{t("reportsPage.revenueTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("reportsPage.revenueSub")}</p>
          </div>
          <div className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    content={<ChartTooltip formatter={(v) => formatCurrency(v, lang)} />}
                    cursor={{ stroke: "hsl(var(--muted))", strokeWidth: 2 }}
                  />
                  <Legend iconSize={10} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-success)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--color-success)" }}
                    activeDot={{ r: 6 }}
                    name={t("reportsPage.revenue")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-4 border-b">
            <h3 className="font-semibold">{t("reportsPage.demographicsTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("reportsPage.demographicsSub")}</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={patientDemographicsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {patientDemographicsData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4">
              {patientDemographicsData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {entry.value} {t("reportsPage.patients")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
