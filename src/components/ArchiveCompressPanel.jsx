import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Archive,
  CheckCircle2,
  Download,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  Sparkles,
  X,
} from "lucide-react"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { archiveService } from "@/services/archiveService"
import { cn } from "@/lib/utils"

const FORMATS = [
  {
    id: "ZIP",
    icon: FileArchive,
    accent: "from-blue-600 to-sky-500",
    ring: "ring-blue-200",
    bg: "bg-blue-50/80",
  },
  {
    id: "PDF_OPTIMIZED",
    icon: FileText,
    accent: "from-indigo-600 to-blue-500",
    ring: "ring-indigo-200",
    bg: "bg-indigo-50/70",
  },
  {
    id: "PNG",
    icon: FileImage,
    accent: "from-cyan-600 to-sky-500",
    ring: "ring-cyan-200",
    bg: "bg-cyan-50/70",
  },
  {
    id: "TIFF",
    icon: Archive,
    accent: "from-emerald-600 to-teal-500",
    ring: "ring-emerald-200",
    bg: "bg-emerald-50/70",
  },
]

function formatBytes(n) {
  if (n == null || Number.isNaN(Number(n))) return "—"
  const v = Number(n)
  if (v < 1024) return `${v} o`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} Ko`
  return `${(v / (1024 * 1024)).toFixed(2)} Mo`
}

/**
 * Panneau professionnel de compression / export multi-formats d'un dossier archivé.
 */
export default function ArchiveCompressPanel({
  archiveId,
  patientName,
  numeroDossier,
  variant = "card",
  className,
}) {
  const { t } = useI18n()
  const [selected, setSelected] = useState("ZIP")
  const [exporting, setExporting] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [open, setOpen] = useState(variant === "card")

  const meta = useMemo(
    () => ({
      patient: patientName || "—",
      dossier: numeroDossier || (archiveId ? `#${archiveId}` : "—"),
    }),
    [patientName, numeroDossier, archiveId],
  )

  const handleExport = async (formatId) => {
    if (!archiveId || exporting) return
    const format = formatId || selected
    setExporting(format)
    try {
      const result = await archiveService.exportDossier(archiveId, format)
      setLastResult({
        format,
        filename: result.filename,
        size: result.size,
        pages: result.pages,
      })
      await Swal.fire({
        icon: "success",
        title: t("archives.compress.successTitle"),
        text: t("archives.compress.successBody", {
          format: t(`archives.compress.formats.${format}.label`),
          filename: result.filename,
          size: formatBytes(result.size),
        }),
        timer: 2600,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("archives.compress.error"),
      })
    } finally {
      setExporting(null)
    }
  }

  const panel = (
    <div className={cn("relative overflow-hidden rounded-[1.5rem] border border-blue-200/70 bg-white", className)}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-200/30 blur-3xl" />

      <div className="relative space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                <Sparkles className="h-3 w-3" />
                {t("archives.compress.badge")}
              </span>
              <span className="text-xs text-slate-500">{meta.dossier}</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-slate-900">
              {t("archives.compress.title")}
            </h3>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              {t("archives.compress.subtitle", { patient: meta.patient })}
            </p>
          </div>
          {variant === "modal" && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={t("common.cancel")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {FORMATS.map((fmt) => {
            const Icon = fmt.icon
            const active = selected === fmt.id
            const busy = exporting === fmt.id
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => setSelected(fmt.id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300",
                  active
                    ? cn("border-blue-300 shadow-sm shadow-blue-500/10 ring-1", fmt.ring, fmt.bg)
                    : "border-slate-200/80 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/40",
                  exporting && !busy && "opacity-60",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                      fmt.accent,
                    )}
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-slate-900">
                      {t(`archives.compress.formats.${fmt.id}.label`)}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {t(`archives.compress.formats.${fmt.id}.hint`)}
                    </p>
                  </div>
                  {active && !busy && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-blue-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {lastResult
              ? t("archives.compress.lastExport", {
                  filename: lastResult.filename,
                  size: formatBytes(lastResult.size),
                })
              : t("archives.compress.readyHint")}
          </p>
          <Button
            size="md"
            className="gap-2 bg-blue-700 text-white shadow-md shadow-blue-600/20 hover:bg-blue-600"
            disabled={!archiveId || Boolean(exporting)}
            onClick={() => handleExport(selected)}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting
              ? t("archives.compress.exporting")
              : t("archives.compress.download", {
                  format: t(`archives.compress.formats.${selected}.label`),
                })}
          </Button>
        </div>
      </div>
    </div>
  )

  if (variant === "modal") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-blue-200 text-blue-800 hover:bg-blue-50"
          onClick={() => setOpen(true)}
        >
          <FileArchive className="h-3.5 w-3.5" />
          {t("archives.compress.action")}
        </Button>
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {panel}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return panel
}
