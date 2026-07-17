import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRolePath } from "@/hooks/useRolePath"
import { motion, AnimatePresence } from "framer-motion"
import {
  Archive,
  AlertTriangle,
  Package,
  FolderArchive,
  Clock,
  Loader2,
  Search,
  Eye,
  LayoutDashboard,
  Files,
  FolderOpen,
  Inbox,
  ChevronRight,
  FileText,
  CheckCircle2,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useNotifications } from "@/auth/NotificationProvider"
import { useAsync } from "@/hooks/useAsync"
import { archiveService } from "@/services/archiveService"
import { ROLE_KEYS } from "@/config/roles"
import { ArchivesExplorer } from "@/components/ArchivesExplorer"
import ArchiveCompressPanel from "@/components/ArchiveCompressPanel"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "aVerifier", icon: Inbox },
  { id: "incomplets", icon: AlertTriangle },
  { id: "pret", icon: Package },
  { id: "archives", icon: Files },
  { id: "classement", icon: FolderOpen },
  { id: "demandes", icon: CheckCircle2 },
]

const STATUT_STYLE = {
  A_VERIFIER: "bg-amber-100 text-amber-800 ring-amber-200/80",
  INCOMPLET: "bg-rose-100 text-rose-800 ring-rose-200/80",
  PRET_A_ARCHIVER: "bg-sky-100 text-sky-800 ring-sky-200/80",
  ARCHIVE: "bg-emerald-100 text-emerald-800 ring-emerald-200/80",
  RESTAURE: "bg-slate-100 text-slate-700 ring-slate-200/80",
}

const KPI_STYLES = {
  aVerifier: {
    icon: CheckCircle2,
    accent: "from-amber-500/15 via-amber-400/5 to-transparent",
    iconBg: "bg-amber-500/15 text-amber-700",
    ring: "hover:ring-amber-300/60",
  },
  incomplets: {
    icon: AlertTriangle,
    accent: "from-rose-500/15 via-rose-400/5 to-transparent",
    iconBg: "bg-rose-500/15 text-rose-700",
    ring: "hover:ring-rose-300/60",
  },
  pretAArchiver: {
    icon: Package,
    accent: "from-sky-500/15 via-sky-400/5 to-transparent",
    iconBg: "bg-sky-500/15 text-sky-700",
    ring: "hover:ring-sky-300/60",
  },
  archives: {
    icon: FolderArchive,
    accent: "from-emerald-500/15 via-emerald-400/5 to-transparent",
    iconBg: "bg-emerald-500/15 text-emerald-700",
    ring: "hover:ring-emerald-300/60",
  },
}

export default function ArchivesDashboard() {
  const { t, lang } = useI18n()
  const { go } = useRolePath()
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
  const isReception = roleKey === ROLE_KEYS.RECEPTIONIST

  const { data: stats, loading: statsLoading, error: statsError, reload: reloadStats } = useAsync(
    () => archiveService.getStats(),
    [],
  )

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
      reloadStats?.()
      if (activeTab === "aVerifier" || activeTab === "dashboard") {
        reload?.()
      }
    }
    lastAlertCountRef.current = pendingDischargeAlerts.length
  }, [pendingDischargeAlerts.length, roleKey, activeTab, reload, reloadStats])

  const items = listData?.items || listData || []
  const total = listData?.total ?? items.length

  const visibleTabs = TABS.filter((tab) => tab.id !== "demandes" || canArchive || isReception)

  return (
    <div className="relative space-y-6">
      {/* Fond atmosphère archives */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -top-4 h-56 rounded-3xl bg-[radial-gradient(ellipse_at_top_left,rgba(59_130_246/0.12),transparent_55%),radial-gradient(ellipse_at_top_right,rgba(16_185_129/0.10),transparent_50%)]"
      />

      <div className="relative">
        <PageHeader
          title={t("archives.title")}
          subtitle={t("archives.subtitle")}
          actions={
            <div className="flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-primary">
              <Archive className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">{t("archives.title")}</span>
            </div>
          }
        />
      </div>

      {roleKey === ROLE_KEYS.ARCHIVIST && pendingDischargeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">{t("archives.dischargeAlertTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("archives.dischargeAlertBody")}</p>
                <ul className="mt-3 space-y-1.5">
                  {pendingDischargeAlerts.slice(0, 5).map((alert) => (
                    <li key={alert.id} className="flex items-start gap-2 text-sm text-foreground/90">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      {lang === "fr" ? alert.messageFr : alert.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                size="sm"
                className="shadow-sm"
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
                  className="border-amber-300/70 bg-white/80"
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
        </motion.div>
      )}

      {(statsError || listError) && !(statsError?.silent || listError?.silent) && (statsError?.message || listError?.message) && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {listError?.message || statsError?.message || t("archives.loadError")}
        </Card>
      )}

      {/* Navigation onglets */}
      <div className="relative overflow-x-auto pb-1">
        <div className="inline-flex min-w-full gap-1 rounded-2xl border border-border/80 bg-card/80 p-1.5 shadow-sm backdrop-blur-sm sm:min-w-0">
          {visibleTabs.map(({ id, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id)
                  setPage(0)
                }}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  active ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="archives-tab-pill"
                    className="absolute inset-0 rounded-xl bg-primary shadow-md shadow-primary/25"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{t(`archives.tabs.${id}`)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries(KPI_STYLES).map(([key, style], index) => {
                const Icon = style.icon
                const value = stats?.[key]
                return (
                  <motion.button
                    key={key}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      const map = {
                        aVerifier: "aVerifier",
                        incomplets: "incomplets",
                        pretAArchiver: "pret",
                        archives: "archives",
                      }
                      setActiveTab(map[key])
                      setPage(0)
                    }}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md",
                      style.ring,
                    )}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", style.accent)} />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t(`archives.kpi.${key}`)}
                        </p>
                        <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                          {statsLoading ? "—" : (value ?? 0)}
                        </p>
                      </div>
                      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105", style.iconBg)}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            <Card className="relative overflow-hidden border-border/70 p-5 shadow-sm">
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-accent to-secondary" />
              <div className="flex flex-wrap items-center gap-4 pl-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{t("archives.kpi.today")}</p>
                  <p className="font-display text-lg font-semibold text-foreground">
                    {statsLoading
                      ? "—"
                      : `${stats?.archivesAujourdhui ?? 0} / ${stats?.archivesCeMois ?? 0} ${t("archives.kpi.thisMonth")}`}
                  </p>
                  {stats?.tempsMoyenAvantArchivageJours != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("archives.kpi.avgDays", { days: Math.round(stats.tempsMoyenAvantArchivageJours) })}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setActiveTab("classement")}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  {t("archives.tabs.classement")}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "classement" && (
          <motion.div
            key="classement"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <ArchivesExplorer canManage={canArchive} />
          </motion.div>
        )}

        {activeTab !== "dashboard" && activeTab !== "classement" && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-muted/40 via-card to-primary/[0.03] px-4 py-3">
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {t(`archives.tabs.${activeTab}`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {listLoading ? "…" : `${total} ${t("archives.columns.dossier").toLowerCase()}`}
                  </p>
                </div>
                {activeTab === "archives" && (
                  <div className="flex w-full max-w-md gap-2 sm:w-auto">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t("archives.searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 bg-background pl-8"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        reload()
                        reloadStats()
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-2 sm:p-3">
                {listLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <Archive className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t("archives.empty")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="px-3 py-2.5">{t("archives.columns.dossier")}</th>
                          <th className="px-3 py-2.5">{t("archives.columns.patient")}</th>
                          <th className="hidden px-3 py-2.5 md:table-cell">{t("archives.columns.type")}</th>
                          <th className="hidden px-3 py-2.5 lg:table-cell">{t("archives.columns.medecin")}</th>
                          <th className="px-3 py-2.5">{t("archives.columns.statut")}</th>
                          <th className="hidden px-3 py-2.5 sm:table-cell">{t("archives.columns.dateFin")}</th>
                          <th className="px-3 py-2.5 text-right">{t("archives.columns.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row, i) => (
                          <motion.tr
                            key={row.id || row.archiveId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.02, 0.2) }}
                            className="group border-t border-border/50 transition-colors hover:bg-primary/[0.03]"
                          >
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground/80">
                                {(row.hasPdf || row.nomPdf) && (
                                  <FileText className="h-3.5 w-3.5 text-rose-600" />
                                )}
                                {row.numeroDossier || `#${row.id}`}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-medium text-foreground">
                              {row.nomPatient || row.nomDemandeur || "—"}
                            </td>
                            <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                              {row.typeEpisode || "—"}
                            </td>
                            <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                              {row.nomMedecin || "—"}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                                  STATUT_STYLE[row.statutArchive || row.statut] || STATUT_STYLE.RESTAURE,
                                )}
                              >
                                {row.statutArchive || row.statut}
                              </span>
                            </td>
                            <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                              {row.dateFinEpisode
                                ? new Date(row.dateFinEpisode).toLocaleDateString()
                                : row.dateDemande
                                  ? new Date(row.dateDemande).toLocaleDateString()
                                  : "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {row.id && (
                                <div className="flex flex-wrap items-center justify-end gap-1">
                                  <ArchiveCompressPanel
                                    variant="modal"
                                    archiveId={row.id}
                                    patientName={row.nomPatient || row.nomDemandeur}
                                    numeroDossier={row.numeroDossier}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 gap-1 text-primary hover:bg-primary/10 hover:text-primary"
                                    onClick={() => go(`/archives/${row.id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t("archives.view")}</span>
                                  </Button>
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "archives" && total > 20 && (
                  <div className="flex items-center justify-between border-t border-border/50 px-2 pt-3">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      {t("common.previous")}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {page + 1} / {Math.ceil(total / 20)}
                    </span>
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
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
