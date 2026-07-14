import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Archive,
  CheckCircle2,
  AlertTriangle,
  Package,
  FolderArchive,
  Clock,
  Loader2,
  Search,
  Eye,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Badge, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useNotifications } from "@/auth/NotificationProvider"
import { useAsync } from "@/hooks/useAsync"
import { archiveService } from "@/services/archiveService"
import { ROLE_KEYS } from "@/config/roles"

const TABS = ["dashboard", "aVerifier", "incomplets", "pret", "archives", "demandes"]

const STATUT_VARIANT = {
  A_VERIFIER: "warning",
  INCOMPLET: "destructive",
  PRET_A_ARCHIVER: "secondary",
  ARCHIVE: "default",
  RESTAURE: "outline",
}

export default function ArchivesDashboard() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { roleKey } = useAuth()
  const { notifications, markRead } = useNotifications()

  const pendingDischargeAlerts = notifications.filter(
    (n) => n.type === "ARCHIVE_DOSSIER_SORTIE" && !n.read,
  )

  const [activeTab, setActiveTab] = useState("dashboard")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const canArchive = roleKey === ROLE_KEYS.ARCHIVIST || roleKey === ROLE_KEYS.HOSPITAL_ADMIN
  const canVerify = canArchive
  const isReception = roleKey === ROLE_KEYS.RECEPTIONIST

  const { data: stats, loading: statsLoading, error: statsError } = useAsync(() => archiveService.getStats(), [])

  const listFetcher = useMemo(() => {
    const size = 20
    if (activeTab === "aVerifier") return () => archiveService.listAVerifier(page, size)
    if (activeTab === "incomplets") return () => archiveService.listIncomplets(page, size)
    if (activeTab === "pret") return () => archiveService.listPretAArchiver(page, size)
    if (activeTab === "archives") return () => archiveService.listArchives({ page, size, search })
    if (activeTab === "demandes") return () => archiveService.listDemandesEnAttente()
    return null
  }, [activeTab, page, search])

  const { data: listData, loading: listLoading, error: listError, reload } = useAsync(
    listFetcher || (async () => null),
    [listFetcher],
  )

  const lastAlertCountRef = useRef(pendingDischargeAlerts.length)
  useEffect(() => {
    if (roleKey !== ROLE_KEYS.ARCHIVIST) return
    if (pendingDischargeAlerts.length > lastAlertCountRef.current) {
      if (activeTab === "aVerifier" || activeTab === "dashboard") {
        reload?.()
      }
    }
    lastAlertCountRef.current = pendingDischargeAlerts.length
  }, [pendingDischargeAlerts.length, roleKey, activeTab, reload])

  const items = listData?.items || listData || []
  const total = listData?.total ?? items.length

  const kpiCards = [
    { key: "aVerifier", value: stats?.aVerifier, icon: CheckCircle2, tone: "text-amber-600" },
    { key: "incomplets", value: stats?.incomplets, icon: AlertTriangle, tone: "text-red-600" },
    { key: "pretAArchiver", value: stats?.pretAArchiver, icon: Package, tone: "text-blue-600" },
    { key: "archives", value: stats?.archives, icon: FolderArchive, tone: "text-emerald-600" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("archives.title")}
        subtitle={t("archives.subtitle")}
        icon={Archive}
      />

      {roleKey === ROLE_KEYS.ARCHIVIST && pendingDischargeAlerts.length > 0 && (
        <Card className="border-warning/40 bg-warning/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="font-semibold text-foreground">{t("archives.dischargeAlertTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("archives.dischargeAlertBody")}</p>
                <ul className="mt-3 space-y-2">
                  {pendingDischargeAlerts.slice(0, 5).map((alert) => (
                    <li key={alert.id} className="text-sm text-foreground">
                      {lang === "fr" ? alert.messageFr : alert.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  pendingDischargeAlerts.forEach((a) => markRead(a.id))
                  setActiveTab("aVerifier")
                  setPage(0)
                }}
              >
                {t("archives.viewAllPending")}
              </Button>
              {pendingDischargeAlerts[0]?.link && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    markRead(pendingDischargeAlerts[0].id)
                    navigate(pendingDischargeAlerts[0].link)
                  }}
                >
                  {t("archives.viewDossier")}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {(statsError || listError) && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {listError?.message || statsError?.message || t("archives.loadError")}
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.filter((tab) => tab !== "demandes" || canArchive || isReception).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => { setActiveTab(tab); setPage(0) }}
          >
            {t(`archives.tabs.${tab}`)}
          </Button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map(({ key, value, icon: Icon, tone }) => (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t(`archives.kpi.${key}`)}</p>
                  <p className="text-2xl font-semibold">
                    {statsLoading ? "—" : (value ?? 0)}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${tone}`} />
              </div>
            </Card>
          ))}
          <Card className="p-4 sm:col-span-2">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t("archives.kpi.today")}</p>
                <p className="font-medium">
                  {statsLoading ? "—" : `${stats?.archivesAujourdhui ?? 0} / ${stats?.archivesCeMois ?? 0} ${t("archives.kpi.thisMonth")}`}
                </p>
                {stats?.tempsMoyenAvantArchivageJours != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("archives.kpi.avgDays", { days: Math.round(stats.tempsMoyenAvantArchivageJours) })}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab !== "dashboard" && (
        <Card className="p-4 space-y-4">
          {activeTab === "archives" && (
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder={t("archives.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="outline" onClick={() => reload()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}

          {listLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("archives.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">{t("archives.columns.dossier")}</th>
                    <th className="py-2 pr-4">{t("archives.columns.patient")}</th>
                    <th className="py-2 pr-4">{t("archives.columns.type")}</th>
                    <th className="py-2 pr-4">{t("archives.columns.medecin")}</th>
                    <th className="py-2 pr-4">{t("archives.columns.statut")}</th>
                    <th className="py-2 pr-4">{t("archives.columns.dateFin")}</th>
                    <th className="py-2">{t("archives.columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id || row.archiveId} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs">{row.numeroDossier || `#${row.id}`}</td>
                      <td className="py-3 pr-4">{row.nomPatient || row.nomDemandeur || "—"}</td>
                      <td className="py-3 pr-4">{row.typeEpisode || "—"}</td>
                      <td className="py-3 pr-4">{row.nomMedecin || "—"}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={STATUT_VARIANT[row.statutArchive || row.statut] || "outline"}>
                          {row.statutArchive || row.statut}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {row.dateFinEpisode
                          ? new Date(row.dateFinEpisode).toLocaleDateString()
                          : row.dateDemande
                          ? new Date(row.dateDemande).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3">
                        {row.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/archives/${row.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t("archives.view")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "archives" && total > 20 && (
            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                {t("common.previous")}
              </Button>
              <span className="text-xs text-muted-foreground">{page + 1} / {Math.ceil(total / 20)}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
