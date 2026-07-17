import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Pill,
  Printer,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  Clock3,
  Sparkles,
  Stethoscope,
  X,
  Send,
  ShieldCheck,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { PageHeader } from "@/components/PageHeader"
import {
  Card,
  Button,
  Badge,
  Input,
  Avatar,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useTenantScope } from "@/hooks/useTenantScope"
import { useAsync } from "@/hooks/useAsync"
import { useRolePath } from "@/hooks/useRolePath"
import { ordonnanceService } from "@/services/api"
import { cn, formatDate, formatDateTime } from "@/lib/utils"

const MySwal = withReactContent(Swal)

const STATUS_FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "ACTIVE", label: "Actives" },
  { key: "RENOUVELEE", label: "Renouvelées" },
  { key: "ANNULEE", label: "Annulées" },
]

function statusMeta(statut) {
  const s = String(statut || "ACTIVE").toUpperCase()
  if (s === "ACTIVE") {
    return {
      label: "Active",
      variant: "success",
      tone: "border-emerald-400/30 bg-emerald-50/80 text-emerald-900",
      ribbon: "bg-emerald-600",
    }
  }
  if (s === "RENOUVELEE") {
    return {
      label: "Renouvelée",
      variant: "secondary",
      tone: "border-sky-400/30 bg-sky-50/80 text-sky-900",
      ribbon: "bg-sky-600",
    }
  }
  if (s === "ANNULEE" || s === "EXPIRED" || s === "EXPIREE") {
    return {
      label: "Annulée",
      variant: "destructive",
      tone: "border-rose-400/30 bg-rose-50/80 text-rose-900",
      ribbon: "bg-rose-600",
    }
  }
  return {
    label: statut || "—",
    variant: "outline",
    tone: "border-border bg-muted/40 text-foreground",
    ribbon: "bg-slate-500",
  }
}

function medLinesFromContenu(contenu) {
  return String(contenu || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
}

function PrescriptionPaperCard({ item, hospitalName, doctorName, selected, onSelect, index }) {
  const meta = statusMeta(item.statut)
  const lines = medLinesFromContenu(item.contenuOrdonnance).slice(0, 3)
  const more = Math.max(0, medLinesFromContenu(item.contenuOrdonnance).length - 3)
  const numero = item.numeroOrdonnance || `ORD-${item.idOrdonnance}`

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.35, ease: "easeOut" }}
      onClick={() => onSelect(item)}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-300",
        "bg-gradient-to-br from-[#fbfbf8] via-white to-slate-50",
        selected
          ? "border-primary/40 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
          : "border-slate-200/90 shadow-sm hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5",
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1.5", meta.ribbon)} />
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative border-b border-slate-200/80 px-5 pb-3 pt-4 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {hospitalName}
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">{numero}</p>
          </div>
          <Badge variant={meta.variant} className="shrink-0 text-[10px]">
            {meta.label}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={item.nomPatient || "Patient"} className="h-10 w-10 text-xs shadow-sm" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-slate-900">
              {item.nomPatient || `Patient #${item.idPatient || "—"}`}
            </p>
            <p className="text-xs text-slate-500">
              {formatDateTime(item.datePrescription) || formatDate(item.datePrescription) || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-5 py-4 pl-6">
        <div className="mb-2 flex items-end gap-2">
          <span className="font-display text-2xl font-bold leading-none text-slate-800">Rp/</span>
          <span className="pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Prescription
          </span>
        </div>
        {item.diagnostic && (
          <p className="mb-2 line-clamp-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Diag.</span> {item.diagnostic}
          </p>
        )}
        {lines.length === 0 ? (
          <p className="text-sm italic text-slate-400">Contenu non renseigné</p>
        ) : (
          <ul className="space-y-1.5">
            {lines.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-800">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span className="line-clamp-2 leading-snug">{line.replace(/^\d+[.)]\s*/, "")}</span>
              </li>
            ))}
          </ul>
        )}
        {more > 0 && (
          <p className="mt-2 text-[11px] font-medium text-primary">+{more} ligne(s)</p>
        )}
      </div>

      <div className="relative flex items-center justify-between border-t border-slate-100 bg-white/60 px-5 py-2.5 pl-6">
        <p className="truncate text-[11px] text-slate-500">
          <Stethoscope className="mr-1 inline h-3 w-3" />
          {doctorName}
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Voir <Eye className="h-3 w-3" />
        </span>
      </div>
    </motion.button>
  )
}

function DetailPanel({
  item,
  hospitalName,
  doctorName,
  onClose,
  onPrint,
  printing,
  onSend,
  sending,
  t,
}) {
  if (!item) return null
  const meta = statusMeta(item.statut)
  const lines = medLinesFromContenu(item.contenuOrdonnance)
  const numero = item.numeroOrdonnance || `ORD-${item.idOrdonnance}`
  const isCancelled = ["ANNULEE", "EXPIRED", "EXPIREE"].includes(
    String(item.statut || "").toUpperCase(),
  )

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Aperçu clinique
          </p>
          <p className="font-mono text-xs text-slate-600">{numero}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-blue-800 text-white shadow-md shadow-blue-900/20 hover:bg-blue-900"
            disabled={!item.idOrdonnance || sending || isCancelled}
            onClick={() => onSend(item)}
            title={isCancelled ? t("rxPage.sendCancelledBlocked") : t("rxPage.sendHint")}
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {sending ? t("rxPage.sending") : t("rxPage.sendToPatient")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!item.idOrdonnance || printing}
            onClick={() => onPrint(item)}
          >
            {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
            PDF
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50/90 to-sky-50/50 px-5 py-2.5">
        <p className="flex items-center gap-2 text-[11px] font-medium text-blue-900/70">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-700" />
          {t("rxPage.sendHint")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%)] p-4 sm:p-5">
        <article className="overflow-hidden rounded-sm border border-slate-300 bg-[#fbfbf9] text-slate-900 shadow-sm">
          <div className="border-b-2 border-slate-800 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold tracking-tight">{hospitalName}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Ordonnance médicale
                </p>
              </div>
              <div className="text-right">
                <Badge className={cn("border text-[10px]", meta.tone)}>{meta.label}</Badge>
                <p className="mt-1 text-xs text-slate-600">
                  {formatDateTime(item.datePrescription) || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-b border-slate-200 px-5 py-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Patient</p>
              <p className="mt-1 text-sm font-semibold">
                {item.nomPatient || `Patient #${item.idPatient || "—"}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Prescripteur</p>
              <p className="mt-1 text-sm font-semibold">{doctorName}</p>
            </div>
          </div>

          {item.diagnostic && (
            <div className="border-b border-slate-200 px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Diagnostic</p>
              <p className="mt-1 text-sm">{item.diagnostic}</p>
            </div>
          )}

          <div className="px-5 py-4">
            <div className="mb-3 flex items-end gap-2">
              <span className="font-display text-3xl font-bold leading-none">Rp/</span>
              <span className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Prescription
              </span>
            </div>
            {lines.length === 0 ? (
              <p className="text-sm italic text-slate-400">Aucune ligne de prescription.</p>
            ) : (
              <ol className="space-y-3">
                {lines.map((line, i) => (
                  <li key={i} className="flex gap-3 border-b border-dotted border-slate-300 pb-3 last:border-0">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-400 text-xs font-semibold">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed">{line.replace(/^\d+[.)]\s*/, "")}</p>
                  </li>
                ))}
              </ol>
            )}
            {item.observations && (
              <div className="mt-4 rounded-sm border border-slate-200 bg-white/80 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Observations
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.observations}</p>
              </div>
            )}
            <div className="mt-8 flex justify-end">
              <div className="w-40 text-center">
                <div className="mb-6 h-10 border-b border-slate-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Signature
                </p>
                <p className="mt-1 text-xs text-slate-600">{doctorName}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </motion.aside>
  )
}

export default function Prescriptions() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { hospitalName } = useTenantScope()
  const { go } = useRolePath()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [selected, setSelected] = useState(null)
  const [printingId, setPrintingId] = useState(null)
  const [sendingId, setSendingId] = useState(null)

  const { data, loading, error, reload } = useAsync(
    () => ordonnanceService.listMine(),
    [user?.idMedecin],
  )

  const prescriptions = data || []
  const doctorName = user?.name || "Médecin"

  const counts = useMemo(() => {
    const list = prescriptions
    return {
      total: list.length,
      active: list.filter((p) => String(p.statut || "").toUpperCase() === "ACTIVE").length,
      renewed: list.filter((p) => String(p.statut || "").toUpperCase() === "RENOUVELEE").length,
      cancelled: list.filter((p) =>
        ["ANNULEE", "EXPIRED", "EXPIREE"].includes(String(p.statut || "").toUpperCase()),
      ).length,
    }
  }, [prescriptions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prescriptions.filter((p) => {
      const statut = String(p.statut || "ACTIVE").toUpperCase()
      const matchesStatus = status === "all" || statut === status
      if (!matchesStatus) return false
      if (!q) return true
      const hay = [
        p.nomPatient,
        p.numeroOrdonnance,
        p.idOrdonnance,
        p.diagnostic,
        p.contenuOrdonnance,
        p.idPatient,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [prescriptions, query, status])

  const handlePrint = async (item) => {
    if (!item?.idOrdonnance) return
    setPrintingId(item.idOrdonnance)
    try {
      await ordonnanceService.openPdf(item.idOrdonnance)
    } finally {
      setPrintingId(null)
    }
  }

  const handleSend = async (item) => {
    if (!item?.idOrdonnance || sendingId) return
    const statut = String(item.statut || "").toUpperCase()
    if (["ANNULEE", "EXPIRED", "EXPIREE"].includes(statut)) {
      await MySwal.fire({
        icon: "warning",
        title: t("rxPage.sendErrorTitle"),
        text: t("rxPage.sendCancelledBlocked"),
      })
      return
    }

    const patientLabel = item.nomPatient || `Patient #${item.idPatient || "—"}`
    const numero = item.numeroOrdonnance || `ORD-${item.idOrdonnance}`
    const confirm = await MySwal.fire({
      icon: "question",
      title: t("rxPage.sendConfirmTitle"),
      html: t("rxPage.sendConfirmHtml", { patient: patientLabel, numero }),
      showCancelButton: true,
      confirmButtonText: t("rxPage.sendConfirmBtn"),
      cancelButtonText: t("rxPage.sendCancelBtn"),
      confirmButtonColor: "#1e40af",
      focusConfirm: false,
    })
    if (!confirm.isConfirmed) return

    setSendingId(item.idOrdonnance)
    try {
      const result = await ordonnanceService.sendToPatient(item.idOrdonnance)
      await MySwal.fire({
        icon: "success",
        title: t("rxPage.sendSuccessTitle"),
        text: t("rxPage.sendSuccessText", {
          patient: result?.nomPatient || patientLabel,
          email: result?.emailMasque || "—",
        }),
        timer: 3200,
        showConfirmButton: false,
      })
    } catch (err) {
      await MySwal.fire({
        icon: "error",
        title: t("rxPage.sendErrorTitle"),
        text: err?.message || t("rxPage.sendErrorText"),
      })
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.prescriptions")}
        subtitle={t("rxPage.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="md" onClick={reload} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualiser
            </Button>
            <Button size="md" onClick={() => go("/test-requests")}>
              <Pill className="h-4 w-4" />
              Prescrire
            </Button>
          </div>
        }
      />

      {/* Hero composition */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary via-[oklch(0.42_0.12_245)] to-[oklch(0.38_0.08_200)] p-6 text-primary-foreground shadow-xl shadow-primary/20 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-secondary/25 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-3">
            <Badge className="border-white/20 bg-white/15 text-primary-foreground backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Cabinet numérique
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Ordonnancier médical
            </h2>
            <p className="text-sm leading-relaxed text-primary-foreground/85">
              Retrouvez chaque prescription comme un document clinique — lisible, élégant, prêt à
              imprimer avec QR de traçabilité.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.total, icon: FileText },
              { label: "Actives", value: counts.active, icon: CheckCircle2 },
              { label: "Renouvelées", value: counts.renewed, icon: Activity },
              { label: "Annulées", value: counts.cancelled, icon: XCircle },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="min-w-[5.5rem] rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-center backdrop-blur-md"
              >
                <kpi.icon className="mx-auto mb-1.5 h-3.5 w-3.5 text-white/70" />
                <p className="font-display text-xl font-bold leading-none">
                  {loading ? "—" : kpi.value}
                </p>
                <p className="mt-1.5 text-[10px] uppercase tracking-wide text-white/70">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Filters */}
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-xl border-border/80 bg-muted/20 pl-10"
              placeholder="Rechercher patient, n°, diagnostic…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatus(f.key)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                  status === f.key
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message || "Impossible de charger les ordonnances."}
          <Button variant="outline" size="sm" className="ml-3" onClick={reload}>
            Réessayer
          </Button>
        </Card>
      )}

      {loading && prescriptions.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm">Chargement de l&apos;ordonnancier…</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex min-h-[240px] flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
          <div className="rounded-2xl bg-primary/10 p-4 text-primary">
            <Pill className="h-8 w-8" />
          </div>
          <p className="font-display text-lg font-semibold text-foreground">Aucune ordonnance</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Créez une prescription depuis une consultation ou une demande d&apos;analyses pour la
            voir apparaître ici.
          </p>
          <Button className="mt-2 gap-2" onClick={() => go("/test-requests")}>
            <Pill className="h-4 w-4" />
            Aller aux analyses
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((item, index) => (
              <PrescriptionPaperCard
                key={item.idOrdonnance || item.numeroOrdonnance || index}
                item={item}
                hospitalName={hospitalName}
                doctorName={doctorName}
                selected={selected?.idOrdonnance === item.idOrdonnance}
                onSelect={setSelected}
                index={index}
              />
            ))}
          </div>

          <div className="hidden xl:block">
            <AnimatePresence mode="wait">
              {selected ? (
                <DetailPanel
                  key={selected.idOrdonnance}
                  item={selected}
                  hospitalName={hospitalName}
                  doctorName={doctorName}
                  onClose={() => setSelected(null)}
                  onPrint={handlePrint}
                  printing={printingId === selected.idOrdonnance}
                  onSend={handleSend}
                  sending={sendingId === selected.idOrdonnance}
                  t={t}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full min-h-[28rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center"
                >
                  <div className="rounded-2xl bg-card p-4 shadow-sm">
                    <Clock3 className="h-7 w-7 text-muted-foreground/60" />
                  </div>
                  <p className="font-display text-base font-semibold">Sélectionnez une ordonnance</p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    L&apos;aperçu document s&apos;affiche ici, prêt à être imprimé en PDF.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mobile detail sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 p-3 backdrop-blur-sm xl:hidden"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="mx-auto mt-6 max-h-[90vh] max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <DetailPanel
                item={selected}
                hospitalName={hospitalName}
                doctorName={doctorName}
                onClose={() => setSelected(null)}
                onPrint={handlePrint}
                printing={printingId === selected.idOrdonnance}
                onSend={handleSend}
                sending={sendingId === selected.idOrdonnance}
                t={t}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
