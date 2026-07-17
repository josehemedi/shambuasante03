import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Download,
  FileHeart,
  Stethoscope,
  ClipboardList,
  Shield,
  Loader2,
  ChevronRight,
  Calendar,
  Sparkles,
  Lock,
  Activity,
  AlertCircle,
  FolderOpen,
  Pill,
} from "lucide-react"
import {
  Button,
  Badge,
  Input,
  Avatar,
} from "@/components/ui/primitives"
import RecordDetailModal from "@/components/RecordDetailModal"
import PatientDossierExplorer from "@/components/PatientDossierExplorer"
import { cn, formatDate, formatDateTime } from "@/lib/utils"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80"

/**
 * Coffre-fort médical patient — expérience immersive Shambua Santé (palette bleue).
 */
export default function PatientRecordsVault({
  t,
  locale,
  user,
  dossier,
  loading,
  error,
  records,
  patientDisplayName,
  onDownloadPdf,
  pdfLoading,
  pdfError,
}) {
  const [query, setQuery] = useState("")
  const [kindFilter, setKindFilter] = useState("all")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [explorerOpen, setExplorerOpen] = useState(false)

  const stats = useMemo(() => {
    const consultations = records.filter((r) => r.kind === "consultation").length
    const history = records.filter((r) => r.kind === "antecedent").length
    const ordonnances = records.filter((r) => r.kind === "ordonnance").length
    return { total: records.length, consultations, history, ordonnances }
  }, [records])

  const filtered = useMemo(() => {
    return records.filter((rec) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        (rec.summary || "").toLowerCase().includes(q) ||
        (rec.motif || "").toLowerCase().includes(q) ||
        (rec.doctor || "").toLowerCase().includes(q) ||
        (rec.recordType || "").toLowerCase().includes(q) ||
        (rec.numeroOrdonnance || "").toLowerCase().includes(q)
      const matchesKind =
        kindFilter === "all" ||
        (kindFilter === "consultation" && rec.kind === "consultation") ||
        (kindFilter === "history" && rec.kind === "antecedent") ||
        (kindFilter === "ordonnance" && rec.kind === "ordonnance")
      return matchesQuery && matchesKind
    })
  }, [records, query, kindFilter])

  const code =
    dossier?.codePatient || (dossier?.id != null ? `PT-${dossier.id}` : "—")

  return (
    <div className="relative -mx-3 min-h-[calc(100vh-6.5rem)] overflow-hidden pb-12 sm:-mx-4 lg:-mx-6">
      {/* Atmosphere globale — bleu */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 0% -5%, rgba(37, 99, 235, 0.12), transparent 50%), radial-gradient(ellipse 80% 55% at 100% 5%, rgba(56, 189, 248, 0.1), transparent 45%), linear-gradient(180deg, #f0f5fb 0%, #eef3f9 45%, #f4f7fb 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Hero plein cadre */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]"
        style={{ minHeight: "min(72vh, 34rem)" }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center 35%" }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(15, 40, 80, 0.95) 0%, rgba(23, 58, 120, 0.9) 38%, rgba(37, 99, 235, 0.55) 68%, rgba(56, 140, 220, 0.32) 100%)",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl"
          animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.12, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-80 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ x: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-200"
              style={{ fontFamily: '"Sora", sans-serif' }}
            >
              {t("records.secured")}
            </p>
            <h1
              className="mt-4 text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              Shambua Santé
            </h1>
            <p
              className="mt-3 text-lg font-medium text-sky-100 sm:text-xl"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {t("records.vaultTitle")}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-50/75 sm:text-[15px]">
              {t("records.vaultSubtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-12 gap-2.5 rounded-xl border-0 bg-sky-300 px-6 text-[15px] font-semibold text-[#0b1f4a] shadow-xl shadow-blue-950/30 transition-transform hover:scale-[1.02] hover:bg-sky-200"
                disabled={loading || !dossier}
                onClick={() => setExplorerOpen(true)}
              >
                <FolderOpen className="h-4 w-4" />
                {t("records.myDossier")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2.5 rounded-xl border-white/25 bg-white/10 px-5 text-[14px] font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                disabled={pdfLoading || loading || !dossier}
                onClick={onDownloadPdf}
              >
                {pdfLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t("records.openDossierPdf")}
              </Button>
              <span className="inline-flex items-center gap-2 text-xs text-white/70">
                <Lock className="h-3.5 w-3.5 text-sky-200" />
                {t("records.secured")}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Identité + métriques */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-8 flex flex-col gap-6 px-1 sm:flex-row sm:items-end sm:justify-between sm:px-2"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              name={patientDisplayName || "Patient"}
              className="h-[4.25rem] w-[4.25rem] text-lg ring-[3px] ring-white shadow-xl shadow-blue-900/15"
            />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.45, stiffness: 260 }}
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg"
            >
              <Shield className="h-3.5 w-3.5" />
            </motion.span>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800/55"
              style={{ fontFamily: '"Sora", sans-serif' }}
            >
              {t("records.myDossier")}
            </p>
            <h2
              className="mt-0.5 text-2xl font-semibold tracking-tight text-[#0b1f4a] sm:text-[1.75rem]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {loading ? "…" : patientDisplayName || "—"}
            </h2>
            <p className="mt-1 font-mono text-[11px] tracking-wide text-blue-800/50">
              {code}
              {user?.tenantLabel ? ` · ${user.tenantLabel}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 sm:gap-10">
          <VaultMetric
            icon={FileHeart}
            value={loading ? "—" : stats.total}
            label={t("records.statTotal")}
            delay={0.3}
          />
          <VaultMetric
            icon={Stethoscope}
            value={loading ? "—" : stats.consultations}
            label={t("records.statConsultations")}
            delay={0.38}
          />
          <VaultMetric
            icon={ClipboardList}
            value={loading ? "—" : stats.history}
            label={t("records.statHistory")}
            delay={0.46}
          />
          <VaultMetric
            icon={Pill}
            value={loading ? "—" : stats.ordonnances}
            label={t("records.statOrdonnances")}
            delay={0.52}
          />
        </div>
      </motion.div>

      {(pdfError || error) && (
        <div className="mt-5 space-y-2 px-1 sm:px-2">
          {pdfError && (
            <p className="rounded-xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
              {pdfError}
            </p>
          )}
          {error && (
            <p className="rounded-xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
              {error?.message || t("records.loadError")}
            </p>
          )}
        </div>
      )}

      {/* Parcours */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.32 }}
        className="mt-10 px-1 sm:px-2"
      >
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3
              className="text-2xl font-semibold text-[#0b1f4a]"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {t("records.vaultTimeline")}
            </h3>
            <p className="mt-1 text-sm text-blue-800/50">
              {filtered.length} / {records.length} · {t("records.vaultTimelineHint")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-blue-900/8 pb-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Input
              icon={Search}
              type="text"
              placeholder={t("records.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-blue-900/10 bg-white/80 shadow-sm backdrop-blur-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { id: "all", label: t("records.filterAll") },
              { id: "consultation", label: t("records.filterConsultation") },
              { id: "ordonnance", label: t("records.filterOrdonnance") },
              { id: "history", label: t("records.filterHistory") },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setKindFilter(f.id)}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  kindFilter === f.id
                    ? "bg-blue-800 text-white shadow-md shadow-blue-900/25"
                    : "text-blue-900/65 hover:bg-blue-900/[0.06] hover:text-blue-950",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <VaultSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-800/10 text-blue-800"
              >
                <Sparkles className="h-7 w-7" />
              </motion.div>
              <p
                className="text-lg font-semibold text-[#0b1f4a]"
                style={{ fontFamily: '"Fraunces", "Sora", serif' }}
              >
                {query || kindFilter !== "all"
                  ? t("records.emptySearch")
                  : t("records.emptyPatient")}
              </p>
            </div>
          ) : (
            <div className="relative">
              <div
                aria-hidden
                className="absolute bottom-6 left-[1.35rem] top-3 w-px bg-gradient-to-b from-blue-700/40 via-sky-400/45 to-transparent sm:left-[1.6rem]"
              />
              <AnimatePresence mode="popLayout">
                {filtered.map((rec, index) => (
                  <TimelineEntry
                    key={rec.id}
                    rec={rec}
                    index={index}
                    locale={locale}
                    t={t}
                    onOpen={() => setSelectedRecord(rec)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.section>

      <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />

      <PatientDossierExplorer
        open={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        t={t}
        locale={locale}
        dossier={dossier}
        records={records}
        patientDisplayName={patientDisplayName}
        loading={loading}
      />
    </div>
  )
}

function VaultMetric({ icon: Icon, value, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="min-w-[5.25rem]"
    >
      <div className="flex items-center gap-1.5 text-blue-800/45">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ fontFamily: '"Sora", sans-serif' }}
        >
          {label}
        </span>
      </div>
      <p
        className="mt-1.5 text-[2rem] font-semibold tabular-nums leading-none tracking-tight text-[#0b1f4a]"
        style={{ fontFamily: '"Fraunces", "Sora", serif' }}
      >
        {value}
      </p>
    </motion.div>
  )
}

function TimelineEntry({ rec, index, locale, t, onOpen }) {
  const Icon = rec.icon || Activity
  const parsed = parseDate(rec.date)
  const isConsult = rec.kind === "consultation"
  const isOrdonnance = rec.kind === "ordonnance"

  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.38, delay: Math.min(index * 0.045, 0.35) }}
      className="relative flex gap-4 pb-5 sm:gap-5"
    >
      <div className="relative z-10 flex w-11 shrink-0 flex-col items-center sm:w-12">
        <motion.div
          whileHover={{ scale: 1.06 }}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11",
            isConsult
              ? "bg-blue-800 text-sky-200 shadow-lg shadow-blue-900/30"
              : isOrdonnance
                ? "bg-indigo-700 text-sky-100 shadow-lg shadow-indigo-900/30"
                : "bg-sky-200 text-blue-900 shadow-lg shadow-sky-400/35",
          )}
        >
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
        </motion.div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "group min-w-0 flex-1 border-b border-blue-900/6 py-3 pr-1 text-left transition-colors duration-300",
          "hover:border-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:ring-offset-2",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "border-0 text-[10px] font-semibold uppercase tracking-wide",
                  isConsult
                    ? "bg-blue-800/10 text-blue-900"
                    : isOrdonnance
                      ? "bg-indigo-100 text-indigo-900"
                      : "bg-sky-200/60 text-blue-900",
                )}
              >
                {rec.recordType}
              </Badge>
              {rec.isCritical && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                  <AlertCircle className="h-3 w-3" />
                  {t("records.detail.critical")}
                </span>
              )}
            </div>
            <h4
              className="mt-2 line-clamp-2 text-[1.05rem] font-semibold leading-snug text-[#0b1f4a] transition-colors group-hover:text-blue-800"
              style={{ fontFamily: '"Fraunces", "Sora", serif' }}
            >
              {rec.summary || rec.motif || rec.recordType}
            </h4>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-blue-800/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-700" />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-800/50">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {parsed ? formatDateTime(parsed, locale) : formatDate(rec.date, locale)}
          </span>
          {rec.doctor && rec.doctor !== "—" && (
            <span className="inline-flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              {rec.doctor}
            </span>
          )}
          {rec.numeroOrdonnance && (
            <span className="font-mono opacity-80">{rec.numeroOrdonnance}</span>
          )}
          {rec.department && rec.department !== "—" && !isConsult && !isOrdonnance && (
            <span>{rec.department}</span>
          )}
        </div>
      </button>
    </motion.article>
  )
}

function VaultSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 sm:gap-5">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-blue-900/10" />
          <div className="h-20 flex-1 animate-pulse rounded-lg bg-white/50" />
        </div>
      ))}
    </div>
  )
}

function parseDate(value) {
  if (!value) return null
  const normalized =
    String(value).includes(" ") && !String(value).includes("T")
      ? String(value).replace(" ", "T")
      : value
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
