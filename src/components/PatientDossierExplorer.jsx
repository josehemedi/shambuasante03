import { useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowUp,
  ChevronRight,
  Download,
  HardDrive,
  LayoutGrid,
  List,
  Loader2,
  Search,
  X,
  FolderOpen,
  Eye,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge, Button, Input } from "@/components/ui/primitives"
import RecordDetailModal from "@/components/RecordDetailModal"
import { patientPortalService, ordonnanceService } from "@/services/api"
import { cn, formatDate, formatDateTime } from "@/lib/utils"

function WinFolderIcon({ open = false, className }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("shrink-0 drop-shadow-sm", className)} aria-hidden>
      <path
        fill="#F8B83C"
        d={
          open
            ? "M4 14h14l3 3h23a2 2 0 0 1 2 2v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V14z"
            : "M4 12a3 3 0 0 1 3-3h10l3 3h21a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V12z"
        }
      />
      <path
        fill="#FFD978"
        d={
          open
            ? "M6 20h38l-3 18H9L6 20z"
            : "M7 18h34v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V18z"
        }
      />
      {open && <path fill="#E89A20" opacity="0.35" d="M6 20h38v2H6z" />}
    </svg>
  )
}

function WinPdfIcon({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("shrink-0 drop-shadow-sm", className)} aria-hidden>
      <path fill="#F3F4F6" d="M10 4h18l10 10v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path fill="#D1D5DB" d="M28 4v10h10" />
      <path fill="#DC2626" d="M8 28h32v12a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V28z" />
      <text x="24" y="38" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Segoe UI, Arial, sans-serif">
        PDF
      </text>
      <path fill="#9CA3AF" d="M14 16h14v2H14zm0 5h10v2H14z" opacity="0.7" />
    </svg>
  )
}

function WinDocIcon({ className, label = "DOC", color = "#2563EB" }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("shrink-0 drop-shadow-sm", className)} aria-hidden>
      <path fill="#EFF6FF" d="M10 4h18l10 10v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path fill="#BFDBFE" d="M28 4v10h10" />
      <path fill={color} d="M8 28h32v12a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V28z" />
      <text x="24" y="38" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="Segoe UI, Arial, sans-serif">
        {label}
      </text>
      <path fill="#93C5FD" d="M14 16h16v2H14zm0 5h12v2H14z" />
    </svg>
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

function safeFileName(parts) {
  return parts
    .filter(Boolean)
    .join("_")
    .replace(/[^\w\-À-ÿ.]+/gi, "_")
    .replace(/_+/g, "_")
    .slice(0, 80)
}

/**
 * Explorateur Windows professionnel — dossier médical patient.
 */
export default function PatientDossierExplorer({
  open,
  onClose,
  t,
  locale,
  dossier,
  records,
  patientDisplayName,
  loading,
}) {
  const [viewMode, setViewMode] = useState("icons")
  const [search, setSearch] = useState("")
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [detailRecord, setDetailRecord] = useState(null)

  const code =
    dossier?.codePatient || (dossier?.id != null ? `PT-${dossier.id}` : "—")

  const folders = useMemo(() => {
    const consultations = records.filter((r) => r.kind === "consultation")
    const antecedents = records.filter((r) => r.kind === "antecedent")
    const ordonnances = records.filter((r) => r.kind === "ordonnance")
    return [
      {
        id: "consultations",
        nom: t("records.explorer.folderConsultations"),
        count: consultations.length,
        kind: "folder",
      },
      {
        id: "ordonnances",
        nom: t("records.explorer.folderOrdonnances"),
        count: ordonnances.length,
        kind: "folder",
      },
      {
        id: "antecedents",
        nom: t("records.explorer.folderHistory"),
        count: antecedents.length,
        kind: "folder",
      },
    ]
  }, [records, t])

  const rootFiles = useMemo(() => {
    if (!dossier) return []
    return [
      {
        id: "dossier-pdf",
        kind: "pdf",
        nom: t("records.explorer.fullDossierPdf"),
        subtitle: t("records.explorer.fullDossierHint"),
        date: dossier.dateEnregistrement || null,
        action: "dossier-pdf",
      },
    ]
  }, [dossier, t])

  const folderFiles = useMemo(() => {
    if (!currentFolderId) return []
    const list = records.filter((r) => {
      if (currentFolderId === "consultations") return r.kind === "consultation"
      if (currentFolderId === "ordonnances") return r.kind === "ordonnance"
      if (currentFolderId === "antecedents") return r.kind === "antecedent"
      return false
    })

    return list.map((rec) => {
      const parsed = parseDate(rec.date)
      const dateLabel = parsed
        ? formatDate(parsed, locale)
        : formatDate(rec.date, locale)
      const isConsult = rec.kind === "consultation"
      const isOrdonnance = rec.kind === "ordonnance"
      const baseName = isConsult
        ? safeFileName([
            "Consultation",
            dateLabel,
            rec.doctor !== "—" ? rec.doctor : null,
          ])
        : isOrdonnance
          ? safeFileName([
              "Ordonnance",
              rec.numeroOrdonnance || rec.id,
              dateLabel,
            ])
          : safeFileName([
              "Antecedent",
              rec.department !== "—" ? rec.department : null,
              (rec.summary || "").slice(0, 40),
            ])

      return {
        id: rec.id,
        kind: isConsult || isOrdonnance ? "pdf" : "doc",
        nom: `${baseName}${isConsult || isOrdonnance ? ".pdf" : ".doc"}`,
        subtitle:
          rec.summary ||
          rec.motif ||
          rec.recordType ||
          (isConsult
            ? t("records.types.consultation")
            : isOrdonnance
              ? t("records.types.ordonnance")
              : t("records.types.history")),
        date: rec.date,
        doctor: rec.doctor,
        record: rec,
        action: isConsult
          ? "consultation-pdf"
          : isOrdonnance
            ? "ordonnance-pdf"
            : "detail",
      }
    })
  }, [currentFolderId, records, locale, t])

  const breadcrumb = useMemo(() => {
    const root = { id: null, nom: t("records.explorer.root") }
    if (!currentFolderId) return [root]
    const folder = folders.find((f) => f.id === currentFolderId)
    return [root, { id: currentFolderId, nom: folder?.nom || currentFolderId }]
  }, [currentFolderId, folders, t])

  const addressPath = useMemo(() => {
    const name = patientDisplayName || "Patient"
    if (!currentFolderId) return `Ce PC\\Shambua Santé\\${name}`
    const folder = folders.find((f) => f.id === currentFolderId)
    return `Ce PC\\Shambua Santé\\${name}\\${folder?.nom || ""}`
  }, [currentFolderId, folders, patientDisplayName])

  const visibleFolders = useMemo(() => {
    if (currentFolderId) return []
    const q = search.trim().toLowerCase()
    if (!q) return folders
    return folders.filter((f) => f.nom.toLowerCase().includes(q))
  }, [currentFolderId, folders, search])

  const visibleFiles = useMemo(() => {
    const source = currentFolderId ? folderFiles : rootFiles
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter(
      (f) =>
        f.nom.toLowerCase().includes(q) ||
        (f.subtitle || "").toLowerCase().includes(q) ||
        (f.doctor || "").toLowerCase().includes(q),
    )
  }, [currentFolderId, folderFiles, rootFiles, search])

  const selectedItem = useMemo(() => {
    return (
      visibleFolders.find((f) => f.id === selectedId) ||
      visibleFiles.find((f) => f.id === selectedId) ||
      null
    )
  }, [visibleFolders, visibleFiles, selectedId])

  const itemCount = visibleFolders.length + visibleFiles.length

  const goUp = () => {
    setCurrentFolderId(null)
    setSelectedId(null)
    setSearch("")
  }

  const openFolder = (id) => {
    setCurrentFolderId(id)
    setSelectedId(null)
    setSearch("")
    setActionError(null)
  }

  const openItem = useCallback(
    async (item) => {
      if (!item) return
      if (item.kind === "folder") {
        openFolder(item.id)
        return
      }
      setActionError(null)
      setBusyId(item.id)
      try {
        if (item.action === "dossier-pdf") {
          await patientPortalService.downloadDossierPdf()
        } else if (item.action === "consultation-pdf") {
          const consultId = item.record?.detail?.id ?? String(item.id).replace(/^CONS-/, "")
          await patientPortalService.downloadConsultationPdf(consultId)
        } else if (item.action === "ordonnance-pdf") {
          const ordId =
            item.record?.idOrdonnance ??
            item.record?.detail?.id ??
            String(item.id).replace(/^ORD-/, "")
          await ordonnanceService.openPdf(ordId)
        } else if (item.action === "detail" && item.record) {
          setDetailRecord(item.record)
        }
      } catch {
        setActionError(t("records.explorer.openError"))
      } finally {
        setBusyId(null)
      }
    },
    [t],
  )

  const handleClose = () => {
    setCurrentFolderId(null)
    setSelectedId(null)
    setSearch("")
    setActionError(null)
    onClose?.()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent
          className="!flex h-[min(92vh,820px)] w-[min(96vw,1120px)] max-w-none flex-col gap-0 overflow-hidden border-slate-300 p-0 shadow-2xl sm:rounded-xl [&>button.absolute]:hidden"
        >
          <DialogTitle className="sr-only">{t("records.explorer.title")}</DialogTitle>

          {/* Barre titre Windows */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-b from-[#f8fafc] to-[#eef2f7] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <WinFolderIcon open className="h-7 w-7" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-800">
                  {t("records.explorer.title")} — {patientDisplayName || "—"}
                </p>
                <p className="truncate font-mono text-[10px] text-slate-500">{code}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500 hover:text-white"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-[#f3f6f9] px-2.5 py-1.5">
            <ToolbarBtn
              title={t("records.explorer.goUp")}
              disabled={!currentFolderId}
              onClick={goUp}
            >
              <ArrowUp className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              title={t("records.explorer.viewIcons")}
              active={viewMode === "icons"}
              onClick={() => setViewMode("icons")}
            >
              <LayoutGrid className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              title={t("records.explorer.viewModeDetails")}
              active={viewMode === "details"}
              onClick={() => setViewMode("details")}
            >
              <List className="h-4 w-4" />
            </ToolbarBtn>
            <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-slate-200 bg-white text-xs"
              disabled={!dossier || busyId === "dossier-pdf"}
              onClick={() =>
                openItem({
                  id: "dossier-pdf",
                  action: "dossier-pdf",
                  kind: "pdf",
                })
              }
            >
              {busyId === "dossier-pdf" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {t("records.explorer.downloadFullPdf")}
            </Button>
            <div className="relative ml-auto w-full max-w-xs sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("records.explorer.searchPlaceholder")}
                className="h-8 border-slate-200 bg-white pl-8 text-xs"
              />
            </div>
          </div>

          {/* Barre d'adresse */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
            <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:inline">
              {t("records.explorer.address")}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-lg border border-slate-200 bg-[#f8fafc] px-2 py-1.5">
              <HardDrive className="mr-1 h-3.5 w-3.5 shrink-0 text-[#0b6bcb]" />
              {breadcrumb.map((crumb, idx, arr) => (
                <span key={`${crumb.id}-${idx}`} className="flex shrink-0 items-center">
                  {idx > 0 && <ChevronRight className="mx-0.5 h-3 w-3 text-slate-300" />}
                  <button
                    type="button"
                    onClick={() => {
                      if (crumb.id == null) goUp()
                      else openFolder(crumb.id)
                    }}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[13px] transition-colors hover:bg-[#cce4f7]",
                      idx === arr.length - 1
                        ? "font-semibold text-slate-800"
                        : "font-medium text-slate-600",
                    )}
                  >
                    {crumb.nom}
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* Navigation */}
            <aside className="w-full shrink-0 border-b border-slate-200 bg-[#f3f6f9] lg:w-[240px] lg:border-b-0 lg:border-r">
              <div className="px-3 pb-2 pt-3">
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {t("records.explorer.quickAccess")}
                </p>
                <button
                  type="button"
                  className={cn(
                    "mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors",
                    currentFolderId == null
                      ? "bg-[#cce4f7] font-semibold text-[#0b3a5b]"
                      : "text-slate-700 hover:bg-[#e8f2fa]",
                  )}
                  onClick={goUp}
                >
                  <HardDrive className="h-4 w-4 text-[#0b6bcb]" />
                  {t("records.explorer.root")}
                </button>
              </div>
              <div className="border-t border-slate-200/80 px-2 py-2">
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {t("records.explorer.tree")}
                </p>
                <div className="space-y-0.5">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => openFolder(folder.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                        currentFolderId === folder.id
                          ? "bg-[#cce4f7] font-semibold text-[#0b3a5b]"
                          : "text-slate-700 hover:bg-[#e8f2fa]",
                      )}
                    >
                      <WinFolderIcon open={currentFolderId === folder.id} className="h-5 w-5" />
                      <span className="min-w-0 flex-1 truncate">{folder.nom}</span>
                      <span className="text-[10px] text-slate-400">{folder.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Zone principale */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
              <div className="relative min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                {loading ? (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0b6bcb]" />
                    <p className="text-sm">{t("common.loading")}…</p>
                  </div>
                ) : itemCount === 0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 text-center">
                    <WinFolderIcon className="h-14 w-14 opacity-80" />
                    <p className="text-sm font-semibold text-slate-700">
                      {search ? t("records.explorer.emptySearch") : t("records.explorer.empty")}
                    </p>
                  </div>
                ) : viewMode === "icons" ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    <AnimatePresence mode="popLayout">
                      {visibleFolders.map((folder) => (
                        <ExplorerTile
                          key={folder.id}
                          selected={selectedId === folder.id}
                          busy={false}
                          icon={<WinFolderIcon open={selectedId === folder.id} className="mx-auto h-14 w-14" />}
                          title={folder.nom}
                          meta={t("records.explorer.itemsCount", { count: folder.count })}
                          onSelect={() => setSelectedId(folder.id)}
                          onOpen={() => openFolder(folder.id)}
                        />
                      ))}
                      {visibleFiles.map((file) => (
                        <ExplorerTile
                          key={file.id}
                          selected={selectedId === file.id}
                          busy={busyId === file.id}
                          icon={
                            file.kind === "pdf" ? (
                              <WinPdfIcon className="mx-auto h-14 w-14" />
                            ) : (
                              <WinDocIcon className="mx-auto h-14 w-14" label="DOC" color="#0B6BCB" />
                            )
                          }
                          title={file.nom}
                          meta={file.subtitle}
                          onSelect={() => setSelectedId(file.id)}
                          onOpen={() => openItem(file)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <DetailsTable
                    folders={visibleFolders}
                    files={visibleFiles}
                    selectedId={selectedId}
                    busyId={busyId}
                    locale={locale}
                    t={t}
                    onSelect={setSelectedId}
                    onOpenFolder={openFolder}
                    onOpenFile={openItem}
                  />
                )}
              </div>

              {/* Panneau sélection + statut */}
              <div className="border-t border-slate-200 bg-slate-50/90">
                {selectedItem && (
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-4 py-2.5 text-sm">
                    {selectedItem.kind === "folder" ? (
                      <WinFolderIcon open className="h-8 w-8" />
                    ) : selectedItem.kind === "pdf" ? (
                      <WinPdfIcon className="h-8 w-8" />
                    ) : (
                      <WinDocIcon className="h-8 w-8" label="DOC" color="#0B6BCB" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">
                        {selectedItem.nom}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {selectedItem.kind === "folder"
                          ? t("records.explorer.itemsCount", { count: selectedItem.count })
                          : selectedItem.subtitle}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5"
                      disabled={busyId === selectedItem.id}
                      onClick={() => openItem(selectedItem)}
                    >
                      {busyId === selectedItem.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : selectedItem.kind === "folder" ? (
                        <FolderOpen className="h-3.5 w-3.5" />
                      ) : selectedItem.action === "detail" ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {selectedItem.kind === "folder"
                        ? t("records.explorer.openFolder")
                        : selectedItem.action === "detail"
                          ? t("records.explorer.viewDetails")
                          : t("records.explorer.openFile")}
                    </Button>
                  </div>
                )}
                {actionError && (
                  <p className="px-4 py-2 text-xs text-rose-600">{actionError}</p>
                )}
                <div className="flex items-center justify-between px-4 py-1.5 text-[11px] text-slate-500">
                  <span>
                    {t("records.explorer.statusCount", {
                      count: itemCount,
                      folders: visibleFolders.length,
                      files: visibleFiles.length,
                    })}
                  </span>
                  <span className="truncate pl-4 opacity-70">{addressPath}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RecordDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />
    </>
  )
}

function ToolbarBtn({ children, onClick, active, title, disabled }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 transition-all disabled:opacity-40",
        active
          ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm",
      )}
    >
      {children}
    </button>
  )
}

function ExplorerTile({ selected, busy, icon, title, meta, onSelect, onOpen }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: busy ? 0.6 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        "group relative rounded-xl border px-2 pb-2 pt-3 text-center transition-all",
        selected
          ? "border-[#7ebbef] bg-[#d9ecfb] shadow-sm"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50/80",
      )}
      onClick={onSelect}
      onDoubleClick={onOpen}
    >
      <button type="button" className="mx-auto block w-full" onDoubleClick={onOpen} onClick={onSelect}>
        {busy ? <Loader2 className="mx-auto h-14 w-14 animate-spin text-[#0b6bcb]" /> : icon}
        <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-tight text-slate-800">
          {title}
        </p>
        <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">{meta}</p>
      </button>
    </motion.div>
  )
}

function DetailsTable({
  folders,
  files,
  selectedId,
  busyId,
  locale,
  t,
  onSelect,
  onOpenFolder,
  onOpenFile,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-[#f3f6f9] text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-semibold">{t("records.explorer.colName")}</th>
            <th className="hidden px-3 py-2 font-semibold sm:table-cell">
              {t("records.explorer.colDate")}
            </th>
            <th className="hidden px-3 py-2 font-semibold md:table-cell">
              {t("records.explorer.colType")}
            </th>
          </tr>
        </thead>
        <tbody>
          {folders.map((folder) => (
            <tr
              key={folder.id}
              className={cn(
                "cursor-pointer border-t border-slate-100 transition-colors",
                selectedId === folder.id ? "bg-[#d9ecfb]" : "hover:bg-slate-50",
              )}
              onClick={() => onSelect(folder.id)}
              onDoubleClick={() => onOpenFolder(folder.id)}
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <WinFolderIcon open={selectedId === folder.id} className="h-7 w-7" />
                  <span className="font-medium text-slate-800">{folder.nom}</span>
                </div>
              </td>
              <td className="hidden px-3 py-2 text-slate-500 sm:table-cell">—</td>
              <td className="hidden px-3 py-2 text-slate-500 md:table-cell">
                {t("records.explorer.typeFolder")}
              </td>
            </tr>
          ))}
          {files.map((file) => {
            const parsed = parseDate(file.date)
            return (
              <tr
                key={file.id}
                className={cn(
                  "cursor-pointer border-t border-slate-100 transition-colors",
                  selectedId === file.id ? "bg-[#d9ecfb]" : "hover:bg-slate-50",
                )}
                onClick={() => onSelect(file.id)}
                onDoubleClick={() => onOpenFile(file)}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {busyId === file.id ? (
                      <Loader2 className="h-7 w-7 animate-spin text-[#0b6bcb]" />
                    ) : file.kind === "pdf" ? (
                      <WinPdfIcon className="h-7 w-7" />
                    ) : (
                      <WinDocIcon className="h-7 w-7" label="DOC" color="#0B6BCB" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{file.nom}</p>
                      <p className="truncate text-[11px] text-slate-400">{file.subtitle}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 py-2 text-slate-500 sm:table-cell">
                  {parsed ? formatDateTime(parsed, locale) : formatDate(file.date, locale) || "—"}
                </td>
                <td className="hidden px-3 py-2 text-slate-500 md:table-cell">
                  {file.kind === "pdf" ? "PDF" : t("records.explorer.typeDocument")}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
