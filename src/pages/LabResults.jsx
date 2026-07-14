import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Beaker,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  FlaskConical,
  Loader2,
  RefreshCw,
  Search,
  Send,
  UserRound,
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
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsyncList } from "@/hooks/useAsync"
import { labTechService } from "@/services/api"
import { cn, formatDateTime } from "@/lib/utils"

const MySwal = withReactContent(Swal)

const statusConfig = {
  Pending: {
    variant: "secondary",
    icon: Clock,
    ring: "border-amber-400/30 bg-amber-50/80",
    accent: "bg-amber-500",
  },
  "In Progress": {
    variant: "warning",
    icon: Beaker,
    ring: "border-sky-400/30 bg-sky-50/80",
    accent: "bg-sky-500",
  },
  Completed: {
    variant: "success",
    icon: CheckCircle,
    ring: "border-emerald-400/30 bg-emerald-50/70",
    accent: "bg-emerald-500",
  },
  Cancelled: {
    variant: "destructive",
    icon: Clock,
    ring: "border-destructive/30 bg-destructive/5",
    accent: "bg-destructive",
  },
}

const INTERP_OPTIONS = [
  { value: "Normal", labelKey: "labResults.interpNormal" },
  { value: "High", labelKey: "labResults.interpHigh" },
  { value: "Low", labelKey: "labResults.interpLow" },
  { value: "Abnormal", labelKey: "labResults.interpAbnormal" },
]

export default function LabResults() {
  const { t, locale } = useI18n()
  const { data: results, loading, error, reload } = useAsyncList(() => labTechService.listAnalyses(), [])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selected, setSelected] = useState(null)
  const [resultatTexte, setResultatTexte] = useState("")
  const [interpretation, setInterpretation] = useState("Normal")
  const [valeursReference, setValeursReference] = useState("")
  const [saving, setSaving] = useState(false)

  const statusLabel = (status) => {
    if (status === "Pending") return t("labResults.statusPending")
    if (status === "In Progress") return t("labResults.statusInProgress")
    if (status === "Completed") return t("labResults.statusCompleted")
    return status
  }

  const counts = useMemo(() => {
    const list = results || []
    return {
      total: list.length,
      pending: list.filter((r) => r.status === "Pending").length,
      inProgress: list.filter((r) => r.status === "In Progress").length,
      completed: list.filter((r) => r.status === "Completed").length,
    }
  }, [results])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return (results || []).filter((row) => {
      const matchStatus = statusFilter === "All" || row.status === statusFilter
      const matchQ =
        !q ||
        row.patientName?.toLowerCase().includes(q) ||
        row.testName?.toLowerCase().includes(q) ||
        row.id?.toLowerCase().includes(q)
      return matchStatus && matchQ
    })
  }, [results, searchTerm, statusFilter])

  const openFill = (row) => {
    setSelected(row)
    setResultatTexte(row.resultatTexte || "")
    setInterpretation(row.interpretation || "Normal")
    setValeursReference(row.valeursReference || "")
  }

  const resolveIdAnalyse = (row) => {
    if (row?.idAnalyse != null && Number(row.idAnalyse) > 0) return Number(row.idAnalyse)
    const digits = String(row?.id || "").match(/(\d+)/)
    return digits ? Number(digits[1]) : null
  }

  const handleSendToDoctor = async () => {
    const idAnalyse = resolveIdAnalyse(selected)
    if (!idAnalyse) {
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Identifiant d'analyse introuvable.",
      })
      return
    }
    if (!resultatTexte.trim()) {
      await MySwal.fire({
        icon: "warning",
        title: t("labResults.resultRequired"),
        text: t("labResults.resultRequiredBody"),
      })
      return
    }
    setSaving(true)
    try {
      const updated = await labTechService.submitResult(idAnalyse, {
        resultatTexte: resultatTexte.trim(),
        interpretation: interpretation?.trim() || null,
        valeursReference: valeursReference?.trim() || null,
        statut: "TERMINE",
      })
      setSelected(null)
      await reload()
      await MySwal.fire({
        icon: "success",
        title: t("labResults.sentTitle"),
        text: t("labResults.sentBody"),
        timer: 2200,
        showConfirmButton: false,
      })
      // Met à jour la ligne locale immédiatement
      if (updated) {
        // reload already done
      }
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("labResults.saveError"),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    await handleSendToDoctor()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("labResults.title")}
        subtitle={t("labResults.subtitle")}
        actions={
          <Button variant="outline" size="md" className="gap-2" onClick={reload} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("labResults.refresh")}
          </Button>
        }
      />

      {/* Bandeau + KPIs */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-teal-800/20 bg-gradient-to-br from-teal-800 via-teal-700 to-sky-800 p-5 text-white shadow-lg sm:p-6"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-28 w-28 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Badge className="border-white/20 bg-white/15 text-white">
              <FlaskConical className="h-3 w-3" />
              Laboratoire
            </Badge>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              File d&apos;attente des analyses
            </h2>
            <p className="max-w-lg text-sm text-white/80">
              Saisissez les résultats et renvoyez-les au médecin prescritteur de votre établissement.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.total },
              { label: t("labResults.statusPending"), value: counts.pending },
              { label: t("labResults.statusInProgress"), value: counts.inProgress },
              { label: t("labResults.statusCompleted"), value: counts.completed },
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

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message || t("labResults.loadError")}
        </div>
      )}

      {/* Filtres */}
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-col gap-3 bg-muted/20 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 border-border/80 bg-background pl-9"
              placeholder={t("labResults.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full sm:w-56">
              <Filter className="mr-2 h-4 w-4 shrink-0 opacity-60" />
              <SelectValue placeholder={t("labResults.filterStatus")} />
            </SelectTrigger>
            <SelectContent className="min-w-[14rem]">
              <SelectItem value="All">{t("labResults.filterAll")}</SelectItem>
              <SelectItem value="Pending">{t("labResults.statusPending")}</SelectItem>
              <SelectItem value="In Progress">{t("labResults.statusInProgress")}</SelectItem>
              <SelectItem value="Completed">{t("labResults.statusCompleted")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Liste */}
      {loading && results.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> {t("labResults.loading")}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex min-h-[200px] flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700/10 text-teal-800">
            <FlaskConical className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">{t("labResults.empty")}</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((row, index) => {
            const cfg = statusConfig[row.status] || statusConfig.Pending
            const Icon = cfg.icon
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden border transition-shadow hover:shadow-md",
                    cfg.ring,
                  )}
                >
                  <div className="flex">
                    <div className={cn("w-1.5 shrink-0", cfg.accent)} />
                    <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar name={row.patientName} className="h-11 w-11 shrink-0" />
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-display text-base font-semibold text-foreground">
                              {row.patientName}
                            </p>
                            <Badge variant={cfg.variant} className="gap-1">
                              <Icon className="h-3 w-3" />
                              {statusLabel(row.status)}
                            </Badge>
                            <Badge variant="outline">{row.priority}</Badge>
                          </div>
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                            <span className="font-mono text-xs">{row.id}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Beaker className="h-3.5 w-3.5" />
                              {row.testName}
                            </span>
                          </p>
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <UserRound className="h-3 w-3" />
                            {t("labResults.prescribedBy")} {row.requestedBy}
                            <span className="opacity-50">·</span>
                            {formatDateTime(row.date, locale)}
                          </p>
                          {row.observationsMedecin && (
                            <p className="rounded-lg border border-border/60 bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground">
                              <FileText className="mr-1 inline h-3 w-3" />
                              {t("labResults.noteDoctor")} : {row.observationsMedecin}
                            </p>
                          )}
                          {row.resultatTexte && (
                            <p className="text-sm text-foreground">
                              <span className="font-medium">{t("labResults.resultPrefix")} :</span>{" "}
                              {row.resultatTexte}
                              {row.interpretation ? ` · ${row.interpretation}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0 gap-1.5 bg-teal-800 text-white hover:bg-teal-700"
                        onClick={() => openFill(row)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {row.status === "Completed" ? t("labResults.viewEdit") : t("labResults.fillSheet")}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal fiche laboratoire */}
      <AnimatedModal
        open={Boolean(selected)}
        onClose={() => !saving && setSelected(null)}
        contentClassName="max-w-xl"
        zIndex={9999}
      >
        {selected && (
          <form
            onSubmit={handleSubmit}
            className="w-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-sky-800 px-5 py-5 text-white">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                    {t("labResults.modalTitle")}
                  </p>
                  <h2 className="truncate font-display text-lg font-bold">{selected.patientName}</h2>
                  <p className="truncate text-sm text-white/80">{selected.testName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {selected.observationsMedecin && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-950">
                  <span className="font-semibold">{t("labResults.noteDoctor")} :</span>{" "}
                  {selected.observationsMedecin}
                </div>
              )}

              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("labResults.resultLabel")}
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={resultatTexte}
                  onChange={(e) => setResultatTexte(e.target.value)}
                  placeholder="Ex. : 2.5 mIU/L — dans les normes"
                  required
                />
              </label>

              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("labResults.referenceLabel")}
                <Input
                  className="h-11"
                  value={valeursReference}
                  onChange={(e) => setValeursReference(e.target.value)}
                  placeholder="Ex. : 0.4 – 4.0 mIU/L"
                />
              </label>

              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("labResults.interpretationLabel")}
                <Select value={interpretation || "Normal"} onValueChange={setInterpretation}>
                  <SelectTrigger className="h-11 w-full min-w-full text-sm font-medium normal-case tracking-normal">
                    <SelectValue placeholder={t("labResults.interpretationLabel")} />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={6}
                    className="z-[10060] w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]"
                  >
                    {INTERP_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="py-2.5 text-sm">
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected(null)}
                disabled={saving}
              >
                {t("labResults.cancel")}
              </Button>
              <Button
                type="button"
                className="gap-1.5 bg-teal-800 hover:bg-teal-700"
                disabled={saving || !resultatTexte.trim()}
                onClick={handleSendToDoctor}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("labResults.sendToDoctor")}
              </Button>
            </div>
          </form>
        )}
      </AnimatedModal>
    </div>
  )
}
