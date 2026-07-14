import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Plus, MoreHorizontal, Pill, AlertTriangle, TrendingUp, Package, PackageX, RefreshCw } from "lucide-react"
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
  Progress,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { pharmacyService } from "@/services/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartTooltip } from "@/components/ChartTooltip"
import AddMedicineModal from "@/components/AddMedicineModal"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)

const STATUS_KEYS = ["all", "disponible", "stock_faible", "rupture_stock", "expire", "desactive"]

const salesDataRaw = [
  { monthKey: "jan", sales: 250000 },
  { monthKey: "feb", sales: 280000 },
  { monthKey: "mar", sales: 320000 },
  { monthKey: "apr", sales: 310000 },
  { monthKey: "may", sales: 350000 },
  { monthKey: "jun", sales: 400000 },
]

const statusVariants = {
  disponible: "success",
  stock_faible: "warning",
  rupture_stock: "destructive",
  expire: "destructive",
  desactive: "outline",
}

export default function Pharmacy() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const lastAlertSignature = useRef("")

  const { data: pharmacyData, loading, error, reload } = useAsync(
    async () => {
      if (user?.idHopital == null) return { medicines: [], alerts: [] }
      const [medicines, alerts] = await Promise.all([
        pharmacyService.listMedicaments(),
        pharmacyService.getStockAlerts(),
      ])
      return { medicines, alerts }
    },
    [user?.idHopital],
  )

  const medicines = pharmacyData?.medicines || []
  const stockAlerts = pharmacyData?.alerts || []

  useEffect(() => {
    if (loading || !stockAlerts.length) return

    const signature = stockAlerts.map((a) => a.id).join(",")
    if (signature === lastAlertSignature.current) return
    lastAlertSignature.current = signature

    const listHtml = stockAlerts
      .slice(0, 8)
      .map((a) => `<li style="text-align:left;margin:4px 0;">${lang === "fr" ? a.messageFr : a.message}</li>`)
      .join("")

    MySwal.fire({
      icon: "warning",
      title: t("pharmacy.alertTriggeredTitle"),
      html: `<p style="margin-bottom:8px;">${t("pharmacy.alertTriggeredBody")}</p><ul style="padding-left:18px;">${listHtml}</ul>`,
      confirmButtonText: t("common.viewAll"),
      confirmButtonColor: "#d97706",
    })
  }, [stockAlerts, loading, t, lang])

  const salesData = useMemo(
    () => salesDataRaw.map((row) => ({ name: t(`pharmacy.months.${row.monthKey}`), sales: row.sales })),
    [t],
  )

  const handleSaveMedicine = async (form) => {
    setSaving(true)
    try {
      const created = await pharmacyService.createMedicament(form)
      setIsModalOpen(false)
      reload()
      await MySwal.fire({
        title: t("pharmacy.addSuccessTitle"),
        text: t("pharmacy.addSuccess", { name: created.nomMedicament }),
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })

      if (created.statutKey === "stock_faible" || created.statutKey === "rupture_stock" || created.statutKey === "expire") {
        await MySwal.fire({
          icon: "warning",
          title: t("pharmacy.alertOnCreateTitle"),
          text: t("pharmacy.alertOnCreateBody", {
            name: created.nomMedicament,
            qty: created.quantiteStock,
            min: created.stockMinimum,
          }),
          confirmButtonColor: "#d97706",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDispense = async (med) => {
    const patientResult = await MySwal.fire({
      title: t("pharmacy.dispenseTitle"),
      html: `<p style="margin-bottom:8px;"><strong>${med.nomMedicament}</strong> — ${med.prixVente ?? 0}</p>`,
      input: "number",
      inputLabel: t("pharmacy.dispensePatientId"),
      inputAttributes: { min: 1, step: 1 },
      showCancelButton: true,
      confirmButtonText: t("common.next"),
      cancelButtonText: t("common.cancel"),
    })
    if (!patientResult.isConfirmed) return
    const idPatient = Number(patientResult.value)
    if (!idPatient) {
      await MySwal.fire({ icon: "warning", title: t("pharmacy.dispenseError") })
      return
    }

    const qtyResult = await MySwal.fire({
      title: t("pharmacy.dispenseTitle"),
      input: "number",
      inputLabel: t("pharmacy.dispenseQty"),
      inputValue: 1,
      inputAttributes: { min: 1, step: 1 },
      showCancelButton: true,
      confirmButtonText: t("pharmacy.dispense"),
      cancelButtonText: t("common.cancel"),
    })
    if (!qtyResult.isConfirmed) return
    const quantite = Math.max(1, Number(qtyResult.value) || 1)

    setSaving(true)
    try {
      await pharmacyService.dispense({
        idPatient,
        items: [{ medicamentId: med.id, quantite }],
      })
      reload()
      await MySwal.fire({
        icon: "success",
        title: t("pharmacy.dispenseSuccess"),
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("pharmacy.dispenseError"),
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredMedicines = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return medicines.filter((med) => {
      const matchesSearch =
        !q ||
        med.nomMedicament.toLowerCase().includes(q) ||
        (med.nomGenerique || "").toLowerCase().includes(q) ||
        (med.categorie || "").toLowerCase().includes(q) ||
        med.displayId.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || med.statutKey === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [medicines, searchTerm, statusFilter])

  const kpis = useMemo(
    () => ({
      total: medicines.length,
      lowStock: medicines.filter((m) => m.statutKey === "stock_faible").length,
      outOfStock: medicines.filter((m) => m.statutKey === "rupture_stock").length,
      revenue: medicines.reduce((sum, m) => sum + (m.prixVente || 0) * m.quantiteStock, 0),
    }),
    [medicines],
  )

  const formatDate = (value) => {
    if (!value) return "—"
    return String(value).split("T")[0]
  }

  return (
    <div>
      <PageHeader
        title={t("nav.pharmacy")}
        subtitle={
          user?.tenantLabel
            ? t("pharmacy.subtitleTenant", { hospital: user.tenantLabel })
            : t("pharmacy.subtitle")
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("pharmacy.addMedicine")}
            </Button>
          </div>
        }
      />

      <AddMedicineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMedicine}
        loading={saving}
      />

      {error && (
        <Card className="mb-4 border-destructive/30 bg-destructive/5">
          <div className="p-4 text-sm text-destructive">{error?.message || t("pharmacy.loadError")}</div>
        </Card>
      )}

      {!loading && stockAlerts.length > 0 && (
        <Card className="mb-4 border-warning/40 bg-warning/10">
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-semibold text-foreground">{t("pharmacy.alertsTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("pharmacy.alertsSubtitle", { count: stockAlerts.length })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {stockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                    alert.level === "critical"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-warning/30 bg-background/70"
                  }`}
                >
                  <span>{lang === "fr" ? alert.messageFr : alert.message}</span>
                  <Badge variant={alert.level === "critical" ? "destructive" : "warning"}>
                    {t(`pharmacy.status.${alert.typeKey}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!loading && stockAlerts.length === 0 && medicines.length > 0 && (
        <Card className="mb-4 border-success/30 bg-success/5">
          <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <Package className="h-5 w-5 text-success" />
            {t("pharmacy.alertsEmpty")}
          </div>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("pharmacy.kpiTotal")}</p>
              <p className="text-2xl font-bold">{kpis.total}</p>
            </div>
          </div>
        </Card>
        <Card className={kpis.lowStock > 0 ? "ring-2 ring-warning/40" : ""}>
          <div className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-warning/10 p-3 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("pharmacy.kpiLowStock")}</p>
              <p className="text-2xl font-bold">{kpis.lowStock}</p>
            </div>
          </div>
        </Card>
        <Card className={kpis.outOfStock > 0 ? "ring-2 ring-destructive/40" : ""}>
          <div className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
              <PackageX className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("pharmacy.kpiOutOfStock")}</p>
              <p className="text-2xl font-bold">{kpis.outOfStock}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-success/10 p-3 text-success">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("pharmacy.kpiRevenue")}</p>
              <p className="text-2xl font-bold">
                {kpis.revenue >= 1000000 ? `${(kpis.revenue / 1000000).toFixed(2)}M` : kpis.revenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col items-center justify-between gap-4 border-b p-4 md:flex-row">
            <h3 className="font-semibold">{t("pharmacy.inventoryTitle")}</h3>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("pharmacy.searchPlaceholder")}
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
                {STATUS_KEYS.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? t("pharmacy.filterAll") : t(`pharmacy.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("pharmacy.colMedicine")}</th>
                  <th className="px-4 py-3 font-medium">{t("pharmacy.colCategory")}</th>
                  <th className="px-4 py-3 font-medium">{t("pharmacy.colStock")}</th>
                  <th className="px-4 py-3 font-medium">{t("pharmacy.colStatus")}</th>
                  <th className="px-4 py-3 font-medium">{t("pharmacy.colExpiry")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("pharmacy.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      {t("common.loading")}
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredMedicines.map((med) => (
                    <tr key={med.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2 text-primary">
                            <Pill size={16} />
                          </div>
                          <div>
                            <p className="font-medium">{med.nomMedicament}</p>
                            <p className="font-mono text-xs text-muted-foreground">{med.displayId}</p>
                            {med.nomGenerique && (
                              <p className="text-xs text-muted-foreground">{med.nomGenerique}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{med.categorie || "—"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{med.quantiteStock}</span>
                          <Progress
                            value={
                              med.stockMinimum > 0
                                ? Math.min(100, (med.quantiteStock / (med.stockMinimum * 3)) * 100)
                                : med.quantiteStock > 0
                                  ? 100
                                  : 0
                            }
                            className="h-1.5 w-20"
                            indicatorClassName={
                              med.statutKey === "stock_faible"
                                ? "bg-warning"
                                : med.statutKey === "rupture_stock"
                                  ? "bg-destructive"
                                  : med.statutKey === "expire"
                                    ? "bg-destructive"
                                    : "bg-success"
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariants[med.statutKey] || "default"}>
                          {t(`pharmacy.status.${med.statutKey}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(med.dateExpiration)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDispense(med)}>
                              {t("pharmacy.dispense")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>{t("pharmacy.actionViewDetails")}</DropdownMenuItem>
                            <DropdownMenuItem>{t("pharmacy.actionRestock")}</DropdownMenuItem>
                            <DropdownMenuItem>{t("pharmacy.actionEdit")}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredMedicines.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">{t("pharmacy.noMedicines")}</div>
          )}
        </Card>
        <Card>
          <div className="border-b p-4">
            <h3 className="font-semibold">{t("pharmacy.salesTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("pharmacy.salesSubtitle")}</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
                <Bar
                  dataKey="sales"
                  fill="var(--color-primary)"
                  name={t("pharmacy.salesChartLabel")}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
