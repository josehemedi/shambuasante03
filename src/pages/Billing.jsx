import { useMemo, useState } from "react"
import {
  Search,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { PageHeader } from "@/components/PageHeader"
import {
  Card,
  Button,
  Badge,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { billingService } from "@/services/api"
import { exportBillingToExcel } from "@/lib/exportBillingExcel"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartTooltip } from "@/components/ChartTooltip"

const MySwal = withReactContent(Swal)

const STATUS_KEYS = ["paid", "pending", "overdue", "partial", "cancelled"]

const statusVariants = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
  partial: "primary",
  cancelled: "secondary",
}

export default function Billing() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [exporting, setExporting] = useState(false)

  const { data: overview, loading, error, reload } = useAsync(
    () => {
      if (user?.idHopital == null) return Promise.resolve(null)
      return billingService.getOverview()
    },
    [user?.idHopital],
  )

  const invoices = overview?.invoices || []
  const kpis = overview?.kpis || {
    totalRevenueYtd: 0,
    totalPaid: 0,
    outstanding: 0,
    overdue: 0,
    invoiceCount: 0,
  }
  const revenueData = overview?.revenueSeries || []

  const formatCurrency = (value) =>
    new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)

  const formatDate = (value) => {
    if (!value) return "—"
    const d = new Date(value)
    return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return invoices.filter((invoice) => {
      const matchesSearch =
        !q ||
        invoice.patient.toLowerCase().includes(q) ||
        invoice.id.toLowerCase().includes(q) ||
        invoice.service?.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, searchTerm, statusFilter])

  const handleExportExcel = async () => {
    if (user?.idHopital == null) {
      await MySwal.fire({
        icon: "warning",
        title: t("billing.exportEmptyTitle"),
        text: t("billing.exportDefaultHospital"),
      })
      return
    }

    if (!filteredInvoices.length) {
      await MySwal.fire({
        icon: "warning",
        title: t("billing.exportEmptyTitle"),
        text: t("billing.exportEmpty"),
      })
      return
    }

    setExporting(true)
    try {
      const filterParts = [t("billing.filterAll")]
      if (statusFilter !== "all") {
        filterParts.push(t(`billing.status.${statusFilter}`))
      }
      if (searchTerm.trim()) {
        filterParts.push(`${t("common.search")}: "${searchTerm.trim()}"`)
      }

      const statusLabels = STATUS_KEYS.reduce((acc, key) => {
        acc[key] = t(`billing.status.${key}`)
        return acc
      }, {})

      const columnLabels = {
        numeroFacture: t("billing.exportColumns.numeroFacture"),
        patient: t("billing.exportColumns.patient"),
        date: t("billing.exportColumns.date"),
        service: t("billing.exportColumns.service"),
        montantHt: t("billing.exportColumns.montantHt"),
        tva: t("billing.exportColumns.tva"),
        montantTtc: t("billing.exportColumns.montantTtc"),
        status: t("billing.exportColumns.status"),
      }

      const revenueColumnLabels = {
        label: t("billing.exportRevenueColumns.label"),
        year: t("billing.exportRevenueColumns.year"),
        revenue: t("billing.exportRevenueColumns.revenue"),
      }

      const { filename, count } = exportBillingToExcel(filteredInvoices, revenueData, {
        hopitalId: user.idHopital,
        hospitalName: user?.tenantLabel || overview?.hospitalName || t("billing.exportDefaultHospital"),
        exportedBy: user?.name || "",
        lang,
        sheetSubtitle: t("billing.exportSheetSubtitle"),
        platformName: "ShambuaSante",
        filterSummary: `${t("billing.exportFilterPrefix")} : ${filterParts.join(" · ")}`,
        columnLabels,
        revenueColumnLabels,
        statusLabels,
        kpis,
        summaryLabels: {
          title: t("billing.exportSummary.title"),
          paid: t("billing.exportSummary.paid"),
          pending: t("billing.exportSummary.pending"),
          overdue: t("billing.exportSummary.overdue"),
          partial: t("billing.exportSummary.partial"),
        },
      })

      await MySwal.fire({
        icon: "success",
        title: t("billing.exportSuccessTitle"),
        text: t("billing.exportSuccess", { count, filename }),
        timer: 2800,
        showConfirmButton: false,
      })
    } catch (err) {
      if (err?.message === "EMPTY") {
        await MySwal.fire({
          icon: "warning",
          title: t("billing.exportEmptyTitle"),
          text: t("billing.exportEmpty"),
        })
      } else {
        await MySwal.fire({
          icon: "error",
          title: t("common.error"),
          text: t("billing.exportError"),
        })
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t("nav.billing")}
        subtitle={
          user?.tenantLabel
            ? t("billing.subtitleTenant", { hospital: user.tenantLabel })
            : t("billing.subtitle")
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
            <Button onClick={handleExportExcel} disabled={exporting || loading}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? t("billing.exporting") : t("billing.exportExcel")}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="mb-4 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {t("billing.loadError")}
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-4">
            <p className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-2 h-4 w-4" />
              {t("billing.kpiTotalRevenue")}
            </p>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalRevenueYtd)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="mr-2 h-4 w-4 text-success" />
              {t("billing.kpiTotalPaid")}
            </p>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalPaid)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="flex items-center text-xs text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 text-warning" />
              {t("billing.kpiOutstanding")}
            </p>
            <p className="text-2xl font-bold">{formatCurrency(kpis.outstanding)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="flex items-center text-xs text-muted-foreground">
              <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
              {t("billing.kpiOverdue")}
            </p>
            <p className="text-2xl font-bold">{formatCurrency(kpis.overdue)}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-col items-center justify-between gap-4 border-b p-4 md:flex-row">
            <h3 className="font-semibold">{t("billing.recentInvoices")}</h3>
            <div className="flex w-full items-center gap-2 md:w-auto">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("billing.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">{t("billing.filterAll")}</option>
                {STATUS_KEYS.map((status) => (
                  <option key={status} value={status}>
                    {t(`billing.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("billing.colInvoiceId")}</th>
                  <th className="px-4 py-3 font-medium">{t("billing.colPatient")}</th>
                  <th className="px-4 py-3 font-medium">{t("billing.colDate")}</th>
                  <th className="px-4 py-3 font-medium">{t("billing.colAmount")}</th>
                  <th className="px-4 py-3 font-medium">{t("billing.colStatus")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {t("common.loading")}…
                    </td>
                  </tr>
                )}
                {!loading && filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {t("billing.noInvoices")}
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.idFacture || invoice.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs">{invoice.id}</td>
                      <td className="px-4 py-3 font-medium">{invoice.patient}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.date)}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(invoice.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariants[invoice.status] || "secondary"}>
                          {t(`billing.status.${invoice.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>{t("billing.actionViewDetails")}</DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              {t("billing.actionDownloadPdf")}
                            </DropdownMenuItem>
                            {invoice.status !== "paid" && (
                              <DropdownMenuItem>{t("billing.actionSendReminder")}</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="border-b p-4">
            <h3 className="font-semibold">{t("billing.revenueTrend")}</h3>
            <p className="text-sm text-muted-foreground">{t("billing.revenueTrendSub")}</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000000)}M`}
                />
                <Tooltip
                  content={<ChartTooltip formatter={(value) => formatCurrency(value)} />}
                  cursor={{ stroke: "hsl(var(--muted))", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-primary)" }}
                  activeDot={{ r: 6 }}
                  name={t("billing.revenueTrend")}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
