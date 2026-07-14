import { useCallback, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Download,
  ShieldAlert,
  FilePenLine,
  Scale,
  Activity,
  LifeBuoy,
  Filter,
  RefreshCw,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Badge, Avatar } from "@/components/ui/primitives"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { auditService, hospitalService } from "@/services/api"
import { cn } from "@/lib/utils"

const STATUS_FILTERS = ["all", "INFO", "WARNING", "ERROR"]
const TICKET_STATUS = ["all", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
const TICKET_PRIORITY = ["all", "LOW", "MEDIUM", "HIGH", "CRITICAL"]

const severityBadge = {
  info: "primary",
  warning: "warning",
  critical: "destructive",
}

const statusBadge = {
  success: "success",
  failed: "destructive",
}

const ticketStatusBadge = {
  OPEN: "warning",
  IN_PROGRESS: "primary",
  RESOLVED: "success",
  CLOSED: "default",
}

const ticketPriorityBadge = {
  LOW: "default",
  MEDIUM: "primary",
  HIGH: "warning",
  CRITICAL: "destructive",
}

const defaultLogFilters = {
  hopitalId: "",
  userEmail: "",
  module: "all",
  action: "all",
  status: "all",
  requestId: "",
  endpoint: "",
  search: "",
  dateFrom: "",
  dateTo: "",
  limit: 100,
}

const defaultTicketFilters = {
  hopitalId: "",
  status: "all",
  module: "all",
  priority: "all",
  requestId: "",
  search: "",
  limit: 50,
}

function FilterSelect({ value, onChange, className, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30",
        className,
      )}
    >
      {children}
    </select>
  )
}

function FilterInput({ value, onChange, placeholder, className }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30",
        className,
      )}
    />
  )
}

export default function AuditLogs() {
  const { t } = useI18n()
  const [tab, setTab] = useState("logs")
  const [logFilters, setLogFilters] = useState(defaultLogFilters)
  const [appliedLogFilters, setAppliedLogFilters] = useState(defaultLogFilters)
  const [ticketFilters, setTicketFilters] = useState(defaultTicketFilters)
  const [appliedTicketFilters, setAppliedTicketFilters] = useState(defaultTicketFilters)
  const [selectedLog, setSelectedLog] = useState(null)

  const { data: kpis, reload: reloadKpis } = useAsync(() => auditService.getKpis(), [])
  const { data: hospitals } = useAsync(() => hospitalService.getAll(), [])
  const { data: modules } = useAsync(() => auditService.getModules(), [])
  const { data: actions } = useAsync(() => auditService.getActions(), [])

  const logQueryFilters = useMemo(() => {
    const f = { ...appliedLogFilters }
    if (f.dateFrom) f.dateFrom = new Date(f.dateFrom).toISOString()
    if (f.dateTo) f.dateTo = new Date(`${f.dateTo}T23:59:59`).toISOString()
    return f
  }, [appliedLogFilters])

  const {
    data: logs,
    loading: logsLoading,
    reload: reloadLogs,
  } = useAsync(() => auditService.getLogs(logQueryFilters), [logQueryFilters])

  const {
    data: tickets,
    loading: ticketsLoading,
    reload: reloadTickets,
  } = useAsync(() => auditService.getSupportTickets(appliedTicketFilters), [appliedTicketFilters])

  const applyLogFilters = useCallback(() => {
    setAppliedLogFilters({ ...logFilters })
  }, [logFilters])

  const clearLogFilters = useCallback(() => {
    setLogFilters(defaultLogFilters)
    setAppliedLogFilters(defaultLogFilters)
  }, [])

  const applyTicketFilters = useCallback(() => {
    setAppliedTicketFilters({ ...ticketFilters })
  }, [ticketFilters])

  const viewLogsForHospital = useCallback((hopitalId) => {
    const next = { ...defaultLogFilters, hopitalId: String(hopitalId) }
    setTab("logs")
    setLogFilters(next)
    setAppliedLogFilters(next)
  }, [])

  const viewLogsForRequest = useCallback((requestId) => {
    if (!requestId || requestId === "—") return
    const next = { ...defaultLogFilters, requestId }
    setTab("logs")
    setLogFilters(next)
    setAppliedLogFilters(next)
  }, [])

  const handleTicketStatus = async (ticket, status) => {
    await auditService.updateTicketStatus(ticket.id, { status })
    reloadTickets()
    reloadKpis()
  }

  const refreshAll = () => {
    reloadKpis()
    reloadLogs()
    reloadTickets()
  }

  return (
    <div>
      <PageHeader
        title={t("audit.title")}
        subtitle={t("audit.subtitle")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
              {t("audit.refresh")}
            </Button>
            <Button variant="outline" size="md">
              <Download className="h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("audit.totalEvents")}</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {(kpis?.totalEvents?.value ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("audit.securityAlerts")}</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {kpis?.securityAlerts?.value ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/18 text-warning">
              <FilePenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("audit.dataChanges")}</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {(kpis?.dataChanges?.value ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("audit.complianceScore")}</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {kpis?.complianceScore?.value ?? 0}%
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("audit.openTickets")}</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {kpis?.openTickets?.value ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-4 flex gap-2">
        <Button variant={tab === "logs" ? "primary" : "outline"} size="sm" onClick={() => setTab("logs")}>
          {t("audit.tabTechnicalLogs")}
        </Button>
        <Button variant={tab === "tickets" ? "primary" : "outline"} size="sm" onClick={() => setTab("tickets")}>
          {t("audit.tabSupportTickets")}
        </Button>
      </div>

      {tab === "logs" && (
        <>
          <Card className="mb-4 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="h-4 w-4" />
              {t("audit.filtersTitle")}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FilterSelect
                value={logFilters.hopitalId}
                onChange={(e) => setLogFilters((f) => ({ ...f, hopitalId: e.target.value }))}
              >
                <option value="">{t("audit.filterAllHospitals")}</option>
                {(hospitals || []).map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterInput
                value={logFilters.userEmail}
                onChange={(e) => setLogFilters((f) => ({ ...f, userEmail: e.target.value }))}
                placeholder={t("audit.filterUser")}
              />
              <FilterSelect
                value={logFilters.module}
                onChange={(e) => setLogFilters((f) => ({ ...f, module: e.target.value }))}
              >
                <option value="all">{t("audit.filterAllModules")}</option>
                {(modules || []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={logFilters.action}
                onChange={(e) => setLogFilters((f) => ({ ...f, action: e.target.value }))}
              >
                <option value="all">{t("audit.filterAll")}</option>
                {(actions || []).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={logFilters.status}
                onChange={(e) => setLogFilters((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? t("audit.filterAllStatuses") : s}
                  </option>
                ))}
              </FilterSelect>
              <FilterInput
                type="date"
                value={logFilters.dateFrom}
                onChange={(e) => setLogFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                placeholder={t("audit.filterDateFrom")}
              />
              <FilterInput
                type="date"
                value={logFilters.dateTo}
                onChange={(e) => setLogFilters((f) => ({ ...f, dateTo: e.target.value }))}
                placeholder={t("audit.filterDateTo")}
              />
              <FilterInput
                value={logFilters.requestId}
                onChange={(e) => setLogFilters((f) => ({ ...f, requestId: e.target.value }))}
                placeholder={t("audit.filterRequestId")}
              />
              <FilterInput
                value={logFilters.endpoint}
                onChange={(e) => setLogFilters((f) => ({ ...f, endpoint: e.target.value }))}
                placeholder={t("audit.filterEndpoint")}
              />
              <div className="relative md:col-span-2 xl:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FilterInput
                  value={logFilters.search}
                  onChange={(e) => setLogFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder={t("audit.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={applyLogFilters}>
                {t("audit.applyFilters")}
              </Button>
              <Button size="sm" variant="outline" onClick={clearLogFilters}>
                {t("audit.clearFilters")}
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">{t("audit.colId")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colTimestamp")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colHospital")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colUser")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colModule")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colAction")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colEndpoint")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colRequestId")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colMessage")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colSeverity")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colIp")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(logs || []).map((log, i) => (
                    <motion.tr
                      key={`${log.id}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-muted/50",
                        log.severity === "critical" && "bg-destructive/5 hover:bg-destructive/10",
                      )}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs">{log.id}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{log.timestamp}</td>
                      <td className="px-5 py-3.5">{log.hopitalNom}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={log.user} className="h-7 w-7 text-[10px]" />
                          <div>
                            <p className="text-sm font-medium">{log.user}</p>
                            <p className="text-xs text-muted-foreground">{log.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{log.module}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">{log.action}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.httpMethod} {log.endpoint}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs">{log.requestId}</td>
                      <td className="px-5 py-3.5">
                        <p className="max-w-[220px] truncate text-xs text-muted-foreground" title={log.message}>
                          {log.message}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={severityBadge[log.severity] || "default"}>{log.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{log.ip}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!logsLoading && (logs || []).length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("audit.noResults")}</div>
            )}
            {logsLoading && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
            )}
          </Card>
        </>
      )}

      {tab === "tickets" && (
        <>
          <Card className="mb-4 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FilterSelect
                value={ticketFilters.hopitalId}
                onChange={(e) => setTicketFilters((f) => ({ ...f, hopitalId: e.target.value }))}
              >
                <option value="">{t("audit.filterAllHospitals")}</option>
                {(hospitals || []).map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={ticketFilters.status}
                onChange={(e) => setTicketFilters((f) => ({ ...f, status: e.target.value }))}
              >
                {TICKET_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? t("audit.filterAllStatuses") : t(`audit.ticketStatus.${s}`)}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={ticketFilters.priority}
                onChange={(e) => setTicketFilters((f) => ({ ...f, priority: e.target.value }))}
              >
                {TICKET_PRIORITY.map((p) => (
                  <option key={p} value={p}>
                    {p === "all" ? t("audit.filterAllPriorities") : t(`audit.ticketPriorities.${p}`)}
                  </option>
                ))}
              </FilterSelect>
              <FilterInput
                value={ticketFilters.requestId}
                onChange={(e) => setTicketFilters((f) => ({ ...f, requestId: e.target.value }))}
                placeholder={t("audit.filterRequestId")}
              />
              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FilterInput
                  value={ticketFilters.search}
                  onChange={(e) => setTicketFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder={t("audit.ticketSearchPlaceholder")}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={applyTicketFilters}>
                {t("audit.applyFilters")}
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">#</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colHospital")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.ticketSubject")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colModule")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.ticketPriorityCol")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colStatus")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colRequestId")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colTimestamp")}</th>
                    <th className="px-5 py-3 font-semibold">{t("audit.colUser")}</th>
                    <th className="px-5 py-3 font-semibold">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(tickets || []).map((ticket, i) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs">TK-{ticket.id}</td>
                      <td className="px-5 py-3.5">{ticket.hopitalNom}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="max-w-[280px] truncate text-xs text-muted-foreground">{ticket.description}</p>
                      </td>
                      <td className="px-5 py-3.5">{ticket.module}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={ticketPriorityBadge[ticket.priority] || "default"}>
                          {t(`audit.ticketPriorities.${ticket.priority}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={ticketStatusBadge[ticket.status] || "default"}>
                          {t(`audit.ticketStatus.${ticket.status}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs">{ticket.requestId}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{ticket.createdAt}</td>
                      <td className="px-5 py-3.5 text-sm">{ticket.createdByEmail}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" onClick={() => viewLogsForHospital(ticket.hopitalId)}>
                            {t("audit.viewHospitalLogs")}
                          </Button>
                          {ticket.requestId !== "—" && (
                            <Button size="sm" variant="outline" onClick={() => viewLogsForRequest(ticket.requestId)}>
                              {t("audit.viewRequestLogs")}
                            </Button>
                          )}
                          {ticket.status === "OPEN" && (
                            <Button size="sm" onClick={() => handleTicketStatus(ticket, "IN_PROGRESS")}>
                              {t("audit.takeTicket")}
                            </Button>
                          )}
                          {ticket.status === "IN_PROGRESS" && (
                            <Button size="sm" onClick={() => handleTicketStatus(ticket, "RESOLVED")}>
                              {t("audit.resolveTicket")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!ticketsLoading && (tickets || []).length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("audit.noTickets")}</div>
            )}
            {ticketsLoading && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
            )}
          </Card>
        </>
      )}

      <AnimatedModal open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} contentClassName="max-w-2xl">
        {selectedLog && (
          <Card className="max-h-[85vh] w-full overflow-y-auto p-6">
            <h3 className="mb-4 font-display text-lg font-semibold">{t("audit.logDetailTitle")}</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted-foreground">{t("audit.colHospital")}</dt><dd>{selectedLog.hopitalNom}</dd></div>
              <div><dt className="text-muted-foreground">{t("audit.colUser")}</dt><dd>{selectedLog.user} ({selectedLog.role})</dd></div>
              <div><dt className="text-muted-foreground">{t("audit.colModule")}</dt><dd>{selectedLog.module}</dd></div>
              <div><dt className="text-muted-foreground">{t("audit.colAction")}</dt><dd>{selectedLog.action}</dd></div>
              <div><dt className="text-muted-foreground">{t("audit.colEndpoint")}</dt><dd className="font-mono text-xs">{selectedLog.httpMethod} {selectedLog.endpoint}</dd></div>
              <div><dt className="text-muted-foreground">{t("audit.colRequestId")}</dt><dd className="font-mono text-xs">{selectedLog.requestId}</dd></div>
              <div><dt className="text-muted-foreground">{t("audit.colMessage")}</dt><dd>{selectedLog.message}</dd></div>
              {selectedLog.errorDetails && (
                <div>
                  <dt className="text-muted-foreground">{t("audit.errorDetails")}</dt>
                  <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs">{selectedLog.errorDetails}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>{t("common.cancel")}</Button>
            </div>
          </Card>
        )}
      </AnimatedModal>
    </div>
  )
}
