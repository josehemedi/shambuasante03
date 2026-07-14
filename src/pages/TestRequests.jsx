import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Beaker,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Filter,
  FlaskConical,
  Loader2,
  Pill,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { PageHeader } from "@/components/PageHeader"
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS } from "@/config/roles"
import { cn, formatDateTime } from "@/lib/utils"
import { medecinLabService, labTechService } from "@/services/api"
import TestRequestDetailModal from "@/components/TestRequestDetailModal"
import NewTestRequestModal from "@/components/NewTestRequestModal"
import PrescriptionOrdonnanceModal from "@/components/PrescriptionOrdonnanceModal"

const MySwal = withReactContent(Swal)

const STATUS_KEYS = ["All", "Pending", "In Progress", "Completed", "Draft"]
const PRIORITY_KEYS = ["All", "Routine", "Urgent", "STAT"]

const statusConfig = {
  Pending: {
    icon: Clock,
    variant: "secondary",
    color: "text-amber-700",
    ring: "border-amber-400/25 bg-amber-50/70",
    accent: "bg-amber-500",
    labelKey: "testRequests.status.pending",
  },
  "In Progress": {
    icon: Edit,
    variant: "warning",
    color: "text-sky-700",
    ring: "border-sky-400/25 bg-sky-50/70",
    accent: "bg-sky-500",
    labelKey: "testRequests.status.inProgress",
  },
  Completed: {
    icon: CheckCircle,
    variant: "success",
    color: "text-emerald-700",
    ring: "border-emerald-400/25 bg-emerald-50/60",
    accent: "bg-emerald-500",
    labelKey: "testRequests.status.completed",
  },
  Draft: {
    icon: FileText,
    variant: "secondary",
    color: "text-muted-foreground",
    ring: "border-border bg-muted/30",
    accent: "bg-muted-foreground",
    labelKey: "testRequests.status.draft",
  },
  Cancelled: {
    icon: FileText,
    variant: "destructive",
    color: "text-destructive",
    ring: "border-destructive/25 bg-destructive/5",
    accent: "bg-destructive",
    labelKey: "testRequests.status.cancelled",
  },
}

const priorityConfig = {
  Routine: { variant: "secondary", labelKey: "testRequests.priority.routine" },
  Urgent: { variant: "warning", labelKey: "testRequests.priority.urgent" },
  STAT: { variant: "destructive", labelKey: "testRequests.priority.stat" },
}

function resolvePatientId(req) {
  if (req?.numericPatientId) return Number(req.numericPatientId)
  const digits = String(req?.patientId || "").match(/(\d+)/)
  return digits ? Number(digits[1]) : null
}

export default function TestRequests() {
  const { t, lang, locale } = useI18n()
  const { roleKey, user } = useAuth()
  const navigate = useNavigate()
  const isLabTech = roleKey === ROLE_KEYS.LAB_TECH
  const isDoctor = roleKey === ROLE_KEYS.DOCTOR
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("All")
  const [priority, setPriority] = useState("All")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rxRequest, setRxRequest] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      const list = isLabTech ? await labTechService.listAnalyses() : await medecinLabService.list()
      setRequests(list || [])
    } catch (err) {
      setLoadError(err?.message || t("testRequests.loadError"))
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [isLabTech, t])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const counts = useMemo(() => {
    const list = requests || []
    return {
      total: list.length,
      pending: list.filter((r) => r.status === "Pending").length,
      inProgress: list.filter((r) => r.status === "In Progress").length,
      completed: list.filter((r) => r.status === "Completed").length,
    }
  }, [requests])

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesQuery =
        (req.patientName || "").toLowerCase().includes(query.toLowerCase()) ||
        (req.id || "").toLowerCase().includes(query.toLowerCase()) ||
        (req.testName || "").toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "All" || req.status === status
      const matchesPriority = priority === "All" || req.priority === priority
      return matchesQuery && matchesStatus && matchesPriority
    })
  }, [requests, query, status, priority])

  const handleSaveRequest = async (data) => {
    if (isLabTech) return
    setSaving(true)
    try {
      if (data.status === "Draft") {
        await MySwal.fire({
          icon: "info",
          title: t("testRequests.draftNotSupportedTitle"),
          text: t("testRequests.draftNotSupportedText"),
        })
        return
      }

      const patientNumericId = Number(String(data.patientNumericId || data.patientId).replace(/\D/g, ""))
      if (!patientNumericId) {
        throw new Error(t("testRequests.errors.patientRequired"))
      }

      const created = await medecinLabService.create({
        idPatient: patientNumericId,
        testCode: data.testCode,
        testName: data.testName,
        priority: data.priority,
        notes: data.notes,
        fastingRequired: data.fastingRequired,
        submit: true,
      })
      setRequests((prev) => [created, ...prev])
      setIsCreateModalOpen(false)
      await MySwal.fire({
        icon: "success",
        title: t("testRequests.saveSuccessTitle"),
        text: t("testRequests.saveSuccessSent"),
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("testRequests.saveErrorTitle"),
        text: err?.message || t("testRequests.saveError"),
      })
    } finally {
      setSaving(false)
    }
  }

  const openPrescription = (req) => {
    const idPatient = resolvePatientId(req)
    if (!idPatient) {
      MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Identifiant patient introuvable pour cette demande.",
      })
      return
    }
    if (!user?.idMedecin) {
      MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Profil médecin manquant sur votre session.",
      })
      return
    }
    setRxRequest(req)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.testRequests")}
        subtitle={
          isLabTech
            ? "Demandes d'analyses de votre établissement — traitez-les ou saisissez les résultats"
            : t("testRequests.subtitle")
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadRequests} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualiser
            </Button>
            {isLabTech ? (
              <Button variant="secondary" onClick={() => navigate("/lab-results")}>
                <FlaskConical className="h-4 w-4" />
                Saisir un résultat
              </Button>
            ) : (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("laboratory.newTestRequest")}
              </Button>
            )}
          </div>
        }
      />

      {/* Hero médecin */}
      {!isLabTech && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-teal-800/20 bg-gradient-to-br from-teal-800 via-teal-700 to-sky-800 p-5 text-white shadow-lg sm:p-6"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge className="border-white/20 bg-white/15 text-white">
                <Beaker className="h-3 w-3" />
                Laboratoire clinique
              </Badge>
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Demandes d&apos;analyses
              </h2>
              <p className="max-w-xl text-sm text-white/80">
                Suivez vos demandes, consultez les résultats du laborantin, puis prescrits une ordonnance
                pour le patient — données de votre établissement uniquement.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Total", value: counts.total },
                { label: t("testRequests.status.pending"), value: counts.pending },
                { label: t("testRequests.status.inProgress"), value: counts.inProgress },
                { label: t("testRequests.status.completed"), value: counts.completed },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="min-w-[4.5rem] rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center backdrop-blur-sm"
                >
                  <p className="font-display text-lg font-bold leading-none">{loading ? "—" : kpi.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-white/70">{kpi.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {!isLabTech && (
        <NewTestRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleSaveRequest}
          saving={saving}
        />
      )}

      <TestRequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />

      <PrescriptionOrdonnanceModal
        open={Boolean(rxRequest)}
        onClose={() => setRxRequest(null)}
        patientName={rxRequest?.patientName}
        idPatient={resolvePatientId(rxRequest)}
        idMedecin={user?.idMedecin}
        diagnosticHint={
          rxRequest?.resultatTexte
            ? `Suite résultat labo (${rxRequest.testName})`
            : rxRequest?.testName
              ? `Après analyse ${rxRequest.testName}`
              : ""
        }
        labContext={
          rxRequest
            ? `${rxRequest.id} · ${rxRequest.testName}${
                rxRequest.resultatTexte ? ` · ${rxRequest.resultatTexte}` : ""
              }`
            : ""
        }
      />

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="grid grid-cols-1 gap-3 bg-muted/20 p-4 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder={t("testRequests.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10">
              <Filter className="mr-2 h-4 w-4 opacity-60" />
              <SelectValue placeholder={t("testRequests.filterStatus")} />
            </SelectTrigger>
            <SelectContent className="min-w-[14rem]">
              {STATUS_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "All" ? t("testRequests.filterAll") : t(statusConfig[s]?.labelKey || s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("testRequests.filterPriority")} />
            </SelectTrigger>
            <SelectContent className="min-w-[12rem]">
              {PRIORITY_KEYS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p === "All" ? t("testRequests.filterAll") : t(priorityConfig[p]?.labelKey || p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
          <Button variant="outline" size="sm" className="ml-3" onClick={loadRequests}>
            {t("common.retry")}
          </Button>
        </Card>
      )}

      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("testRequests.loading")}
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="flex min-h-[180px] flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
          <FlaskConical className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t("testRequests.empty")}</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredRequests.map((req, index) => {
            const sConf = statusConfig[req.status] || statusConfig.Draft
            const pConfig = priorityConfig[req.priority]
            const StatusIcon = sConf.icon
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", sConf.ring)}>
                  <div className="flex">
                    <div className={cn("w-1.5 shrink-0", sConf.accent)} />
                    <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar name={req.patientName} className="h-11 w-11 shrink-0" />
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-display text-base font-semibold">{req.patientName}</p>
                            <Badge variant={sConf.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {t(sConf.labelKey)}
                            </Badge>
                            <Badge variant={pConfig?.variant || "secondary"}>
                              {t(pConfig?.labelKey || req.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono text-xs">{req.id}</span>
                            <span className="mx-1.5">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Beaker className="h-3.5 w-3.5" />
                              {req.testName}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.patientId} · {formatDateTime(req.date, locale || lang)}
                          </p>
                          {req.resultatTexte && (
                            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-900">
                              <span className="font-semibold">Résultat labo :</span> {req.resultatTexte}
                              {req.interpretation ? ` · ${req.interpretation}` : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSelectedRequest(req)}>
                          <Eye className="h-3.5 w-3.5" />
                          Détail
                        </Button>
                        {isDoctor && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-teal-800 text-white hover:bg-teal-700"
                            onClick={() => openPrescription(req)}
                          >
                            <Pill className="h-3.5 w-3.5" />
                            Ordonnance
                          </Button>
                        )}
                        {isLabTech && req.status !== "Completed" && (
                          <Button size="sm" variant="secondary" onClick={() => navigate("/lab-results")}>
                            Remplir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
