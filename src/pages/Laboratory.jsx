import { useMemo, useState } from "react"
import { FileDown, Filter, Search, Plus, MoreHorizontal, RefreshCw } from "lucide-react"
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
import { laboratoryService } from "@/services/api"

const STATUS_KEYS = ["pending", "in_progress", "completed", "cancelled"]

const statusVariants = {
  completed: "success",
  pending: "warning",
  in_progress: "primary",
  cancelled: "destructive",
}

export default function Laboratory() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data: overview, loading, error, reload } = useAsync(() => laboratoryService.getOverview(), [])

  const tests = overview?.tests || []
  const kpis = overview?.kpis || { total: 0, pending: 0, inProgress: 0, completed: 0 }

  const formatDate = (value) => {
    if (!value) return "—"
    const d = new Date(value)
    return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        !q ||
        test.patient.toLowerCase().includes(q) ||
        test.testName.toLowerCase().includes(q) ||
        test.id.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || test.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tests, searchTerm, statusFilter])

  return (
    <div>
      <PageHeader
        title={t("nav.laboratory")}
        subtitle={
          user?.tenantLabel
            ? t("laboratory.subtitleTenant", { hospital: user.tenantLabel })
            : t("laboratory.subtitle")
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              {t("laboratory.exportResults")}
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("laboratory.newTestRequest")}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="mb-4 border-destructive/30 bg-destructive/5">
          <div className="p-4 text-sm text-destructive">
            {error?.message || t("laboratory.loadError")}
          </div>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-4">
            <p className="text-xs text-muted-foreground">{t("laboratory.kpiTotal")}</p>
            <p className="text-2xl font-bold">{kpis.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-muted-foreground">{t("laboratory.kpiPending")}</p>
            <p className="text-2xl font-bold text-warning-foreground">{kpis.pending}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-muted-foreground">{t("laboratory.kpiInProgress")}</p>
            <p className="text-2xl font-bold text-primary">{kpis.inProgress}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-muted-foreground">{t("laboratory.kpiCompleted")}</p>
            <p className="text-2xl font-bold text-success-foreground">{kpis.completed}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-between gap-4 border-b p-4 md:flex-row">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("laboratory.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">{t("laboratory.filterAll")}</option>
              {STATUS_KEYS.map((status) => (
                <option key={status} value={status}>
                  {t(`laboratory.status.${status}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("laboratory.colTestId")}</th>
                <th className="px-4 py-3 font-medium">{t("laboratory.colPatient")}</th>
                <th className="px-4 py-3 font-medium">{t("laboratory.colTestName")}</th>
                <th className="px-4 py-3 font-medium">{t("laboratory.colDate")}</th>
                <th className="px-4 py-3 font-medium">{t("laboratory.colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("laboratory.colCollectedBy")}</th>
                <th className="px-4 py-3 font-medium">{t("laboratory.colProcessedBy")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("laboratory.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!loading &&
                filteredTests.map((test) => (
                  <tr key={test.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs">{test.id}</td>
                    <td className="px-4 py-3 font-medium">{test.patient}</td>
                    <td className="px-4 py-3 text-muted-foreground">{test.testName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(test.date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariants[test.status] || "default"}>
                        {t(`laboratory.status.${test.status}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{test.collectedBy}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {test.processedBy && test.processedBy !== "—"
                        ? test.processedBy
                        : t("laboratory.notAvailable")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t("laboratory.actionViewDetails")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("laboratory.actionEnterResults")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("laboratory.actionPrintLabel")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && filteredTests.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">{t("laboratory.noTests")}</div>
        )}
      </Card>
    </div>
  )
}
