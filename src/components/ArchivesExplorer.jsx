import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  ChevronRight,
  FileStack,
  FileText,
  FolderPlus,
  HardDrive,
  LayoutGrid,
  List,
  Loader2,
  MoveRight,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  ArrowUp,
  Download,
} from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Badge, Button, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useRolePath } from "@/hooks/useRolePath"
import { archiveService } from "@/services/archiveService"
import { cn } from "@/lib/utils"

const MySwal = withReactContent(Swal)

const STATUT_VARIANT = {
  A_VERIFIER: "warning",
  INCOMPLET: "destructive",
  PRET_A_ARCHIVER: "secondary",
  ARCHIVE: "default",
  RESTAURE: "outline",
}

/** Icône dossier type Windows (jaune / ambre). */
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

/** Icône fichier dossier médical. */
function WinFileIcon({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("shrink-0 drop-shadow-sm", className)} aria-hidden>
      <path fill="#E8F1FB" d="M10 4h18l10 10v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path fill="#B8D4F0" d="M28 4v10h10" />
      <path fill="#3B82F6" d="M14 24h20v2.5H14zm0 6h16v2.5H14zm0 6h12v2.5H14z" opacity="0.85" />
      <circle cx="16" cy="16" r="3" fill="#0EA5E9" />
    </svg>
  )
}

/**
 * Explorateur d'archivage — esthétique Gestionnaire de fichiers Windows.
 */
export function ArchivesExplorer({ canManage = false }) {
  const { t } = useI18n()
  const { go } = useRolePath()
  const [folderId, setFolderId] = useState(null)
  const [content, setContent] = useState(null)
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedArchiveId, setSelectedArchiveId] = useState(null)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [draggingArchiveId, setDraggingArchiveId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(undefined)
  const [viewMode, setViewMode] = useState("icons") // icons | details
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState(() => new Set())

  const load = useCallback(
    async (id = folderId, { soft = false } = {}) => {
      if (!soft) setLoading(true)
      setError(null)
      try {
        const [explorer, arbre] = await Promise.all([
          archiveService.explorer(id),
          archiveService.arbreDossiers(),
        ])
        setContent(explorer)
        setTree(arbre || [])
      } catch (err) {
        if (err?.silent || err?.status === 403) {
          setError(null)
          setContent({
            folders: [],
            files: [],
            breadcrumb: [{ id: null, nom: t("archives.explorer.root") }],
          })
          setTree([])
        } else {
          setError(err?.message || t("archives.loadError"))
        }
      } finally {
        if (!soft) setLoading(false)
      }
    },
    [folderId, t],
  )

  useEffect(() => {
    load(folderId)
  }, [folderId, load])

  // Rechargement auto (sans F5) tant que l’explorateur est ouvert
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "hidden") return
      load(folderId, { soft: true })
    }
    const timer = window.setInterval(tick, 15_000)
    const onVisibility = () => {
      if (document.visibilityState === "visible") load(folderId, { soft: true })
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [folderId, load])

  const openFolder = (id) => {
    setSelectedArchiveId(null)
    setSelectedFolderId(null)
    setFolderId(id ?? null)
    if (id != null) {
      setExpanded((prev) => new Set(prev).add(id))
    }
  }

  const goUp = () => {
    const crumbs = content?.breadcrumb || []
    if (crumbs.length < 2) {
      openFolder(null)
      return
    }
    openFolder(crumbs[crumbs.length - 2]?.id ?? null)
  }

  const promptName = async (title, initial = "") => {
    const { value } = await MySwal.fire({
      title,
      input: "text",
      inputValue: initial,
      showCancelButton: true,
      confirmButtonText: t("archives.explorer.confirm"),
      cancelButtonText: t("archives.explorer.cancel"),
      inputValidator: (v) => (!v?.trim() ? t("archives.explorer.nameRequired") : null),
    })
    return value?.trim() || null
  }

  const handleCreateFolder = async () => {
    const nom = await promptName(t("archives.explorer.newFolderTitle"))
    if (!nom) return
    try {
      await archiveService.creerDossierVirtuel({ nom, parentId: folderId })
      await load(folderId)
    } catch (err) {
      if (err?.silent || err?.status === 403) return
      await MySwal.fire({
        icon: "error",
        title: t("archives.explorer.error"),
        text: err?.message || t("archives.explorer.error"),
      })
    }
  }

  const handleRenameFolder = async (folder) => {
    const nom = await promptName(t("archives.explorer.renameFolderTitle"), folder.nom)
    if (!nom || nom === folder.nom) return
    try {
      await archiveService.renommerDossierVirtuel(folder.id, nom)
      await load(folderId)
    } catch (err) {
      if (err?.silent || err?.status === 403) return
      await MySwal.fire({
        icon: "error",
        title: t("archives.explorer.error"),
        text: err?.message || t("archives.explorer.error"),
      })
    }
  }

  const handleDeleteFolder = async (folder) => {
    const result = await MySwal.fire({
      icon: "warning",
      title: t("archives.explorer.deleteFolderTitle"),
      text: t("archives.explorer.deleteFolderBody", { name: folder.nom }),
      showCancelButton: true,
      confirmButtonText: t("archives.explorer.delete"),
      cancelButtonText: t("archives.explorer.cancel"),
    })
    if (!result.isConfirmed) return
    try {
      await archiveService.supprimerDossierVirtuel(folder.id)
      await load(folderId)
    } catch (err) {
      if (err?.silent || err?.status === 403) return
      await MySwal.fire({
        icon: "error",
        title: t("archives.explorer.error"),
        text: err?.message || t("archives.explorer.error"),
      })
    }
  }

  const handleMoveArchive = async (archive, targetFolderId) => {
    try {
      await archiveService.deplacerArchiveDansDossier(archive.id, targetFolderId ?? null)
      setSelectedArchiveId(null)
      await load(folderId)
    } catch (err) {
      if (err?.silent || err?.status === 403) return
      await MySwal.fire({
        icon: "error",
        title: t("archives.explorer.error"),
        text: err?.message || t("archives.explorer.error"),
      })
    }
  }

  const pickMoveTarget = async (archive) => {
    const options = [
      { id: null, label: t("archives.explorer.root") },
      ...flattenTree(tree).filter((f) => f.id !== folderId),
    ]
    const { value } = await MySwal.fire({
      title: t("archives.explorer.moveTitle"),
      input: "select",
      inputOptions: Object.fromEntries(
        options.map((o) => [String(o.id ?? "root"), o.label || o.path || o.nom]),
      ),
      showCancelButton: true,
      confirmButtonText: t("archives.explorer.move"),
      cancelButtonText: t("archives.explorer.cancel"),
    })
    if (value === undefined) return
    const target = value === "root" ? null : Number(value)
    await handleMoveArchive(archive, target)
  }

  const onDropOnFolder = async (e, targetFolderId) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetId(undefined)
    const archiveId = Number(e.dataTransfer.getData("text/archive-id") || draggingArchiveId)
    if (!archiveId) return
    const archive = (content?.files || []).find((f) => f.id === archiveId) || { id: archiveId }
    await handleMoveArchive(archive, targetFolderId)
    setDraggingArchiveId(null)
  }

  const toggleExpand = (id, e) => {
    e.stopPropagation()
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredFolders = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = content?.folders || []
    if (!q) return list
    return list.filter((f) => f.nom?.toLowerCase().includes(q))
  }, [content?.folders, search])

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = content?.files || []
    if (!q) return list
    return list.filter(
      (f) =>
        f.nomPatient?.toLowerCase().includes(q) ||
        f.numeroDossier?.toLowerCase().includes(q) ||
        f.typeEpisode?.toLowerCase().includes(q) ||
        f.statutArchive?.toLowerCase().includes(q),
    )
  }, [content?.files, search])

  const itemCount = filteredFolders.length + filteredFiles.length
  const selectedFile = filteredFiles.find((f) => f.id === selectedArchiveId)

  const pickPrimaryFichier = (file) => {
    const list = file?.fichiers || []
    if (!list.length) return null
    return (
      list.find((f) => f.typeFichier === "DOSSIER_PATIENT") ||
      list.find((f) =>
        String(f.mimeType || "").includes("pdf") ||
        String(f.nomFichier || "").toLowerCase().endsWith(".pdf") ||
        String(f.typeFichier || "").includes("PDF") ||
        String(f.typeFichier || "").startsWith("ORDONNANCE_") ||
        String(f.typeFichier || "").startsWith("CONSULTATION_") ||
        String(f.typeFichier || "").startsWith("BULLETIN_"),
      ) ||
      list[0]
    )
  }

  const openArchivePdf = async (file) => {
    if (!file?.id) return
    const fichier = pickPrimaryFichier(file)
    if (!fichier?.id) {
      go(`/archives/${file.id}`)
      return
    }
    try {
      const blob = await archiveService.downloadFichierBlob(file.id, fichier.id)
      const url = URL.createObjectURL(blob)
      const isPdf =
        String(fichier.mimeType || "").includes("pdf") ||
        String(fichier.nomFichier || "").toLowerCase().endsWith(".pdf") ||
        fichier.typeFichier === "DOSSIER_PATIENT" ||
        String(fichier.typeFichier || "").startsWith("ORDONNANCE_") ||
        String(fichier.typeFichier || "").startsWith("CONSULTATION_") ||
        String(fichier.typeFichier || "").startsWith("BULLETIN_")
      if (isPdf) {
        window.open(url, "_blank", "noopener,noreferrer")
      } else {
        const a = document.createElement("a")
        a.href = url
        a.download = fichier.nomFichier || "fichier"
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      if (err?.silent || err?.status === 403) return
      await MySwal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("archives.explorer.error"),
      })
    }
  }

  const addressPath = (content?.breadcrumb || [{ id: null, nom: t("archives.explorer.root") }])
    .map((c) => c.nom)
    .join(" › ")

  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = (node.children || []).length > 0
    const isOpen = expanded.has(node.id) || folderId === node.id
    const isActive = folderId === node.id
    const isDrop = dropTargetId === node.id

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-0.5 rounded-md pr-2 text-[13px] transition-colors",
            isActive ? "bg-[#cce4f7] text-[#0b3a5b]" : "hover:bg-[#e8f2fa] text-slate-700",
            isDrop && "ring-2 ring-[#60a5fa] bg-[#dbeafe]",
          )}
          style={{ paddingLeft: 6 + depth * 12 }}
          onDragOver={(e) => {
            e.preventDefault()
            setDropTargetId(node.id)
          }}
          onDragLeave={() => setDropTargetId((cur) => (cur === node.id ? undefined : cur))}
          onDrop={(e) => onDropOnFolder(e, node.id)}
        >
          <button
            type="button"
            className="flex h-6 w-5 shrink-0 items-center justify-center text-slate-400"
            onClick={(e) => (hasChildren ? toggleExpand(node.id, e) : openFolder(node.id))}
            aria-label="Expand"
          >
            {hasChildren ? (
              isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <span className="w-3.5" />
            )}
          </button>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
            onClick={() => openFolder(node.id)}
          >
            <WinFolderIcon open={isActive} className="h-4 w-4" />
            <span className="truncate font-medium">{node.nom}</span>
          </button>
          {(node.dossiersCount > 0 || node.enfantsCount > 0) && (
            <span className="ml-auto text-[10px] tabular-nums text-slate-400">
              {node.dossiersCount || 0}
            </span>
          )}
        </div>
        {hasChildren && isOpen && (
          <div>{(node.children || []).map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-primary/5">
      {/* Barre de titre */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 bg-gradient-to-r from-primary/[0.08] via-white to-emerald-500/[0.06] px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-inner">
          <HardDrive className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-slate-800">
            {t("archives.explorer.windowTitle")}
          </p>
          <p className="truncate text-[11px] text-slate-500">{t("archives.explorer.windowHint")}</p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <ToolbarBtn
            active={viewMode === "icons"}
            onClick={() => setViewMode("icons")}
            title={t("archives.explorer.viewIcons")}
          >
            <LayoutGrid className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={viewMode === "details"}
            onClick={() => setViewMode("details")}
            title={t("archives.explorer.viewDetails")}
          >
            <List className="h-4 w-4" />
          </ToolbarBtn>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
        <ToolbarBtn onClick={goUp} title={t("archives.explorer.up")}>
          <ArrowUp className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => load(folderId)} title={t("archives.explorer.refresh")}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </ToolbarBtn>
        <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-slate-200 bg-white text-slate-700 shadow-sm"
            onClick={handleCreateFolder}
          >
            <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
            {t("archives.explorer.newFolder")}
          </Button>
        )}
        <div className="relative ml-auto w-full max-w-xs sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("archives.explorer.searchPlaceholder")}
            className="h-8 border-slate-200 bg-white pl-8 text-xs"
          />
        </div>
      </div>

      {/* Barre d'adresse */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:inline">
          {t("archives.explorer.address")}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-lg border border-slate-200 bg-[#f8fafc] px-2 py-1.5">
          <HardDrive className="mr-1 h-3.5 w-3.5 shrink-0 text-[#0b6bcb]" />
          {(content?.breadcrumb || [{ id: null, nom: t("archives.explorer.root") }]).map(
            (crumb, idx, arr) => (
              <span key={`${crumb.id}-${idx}`} className="flex shrink-0 items-center">
                {idx > 0 && <ChevronRight className="mx-0.5 h-3 w-3 text-slate-300" />}
                <button
                  type="button"
                  onClick={() => openFolder(crumb.id)}
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
            ),
          )}
        </div>
      </div>

      <div className="flex min-h-[520px] flex-col lg:flex-row">
        {/* Panneau navigation */}
        <aside className="w-full shrink-0 border-b border-slate-200 bg-[#f3f6f9] lg:w-[260px] lg:border-b-0 lg:border-r">
          <div className="px-3 pb-2 pt-3">
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {t("archives.explorer.quickAccess")}
            </p>
            <button
              type="button"
              className={cn(
                "mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors",
                folderId == null
                  ? "bg-[#cce4f7] font-semibold text-[#0b3a5b]"
                  : "text-slate-700 hover:bg-[#e8f2fa]",
                dropTargetId === null && "ring-2 ring-[#60a5fa]",
              )}
              onClick={() => openFolder(null)}
              onDragOver={(e) => {
                e.preventDefault()
                setDropTargetId(null)
              }}
              onDragLeave={() => setDropTargetId((cur) => (cur === null ? undefined : cur))}
              onDrop={(e) => onDropOnFolder(e, null)}
            >
              <FileStack className="h-4 w-4 text-[#0b6bcb]" />
              {t("archives.explorer.root")}
            </button>
          </div>
          <div className="border-t border-slate-200/80 px-2 py-2">
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {t("archives.explorer.tree")}
            </p>
            <div className="max-h-[380px] overflow-y-auto pr-1">
              {tree.length === 0 ? (
                <p className="px-3 py-4 text-xs text-slate-400">{t("archives.explorer.noFoldersYet")}</p>
              ) : (
                tree.map((n) => renderTreeNode(n))
              )}
            </div>
          </div>
        </aside>

        {/* Zone principale */}
        <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div
            className="relative flex-1 p-3 sm:p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              // drop hors dossier = ignore
              e.preventDefault()
              setDropTargetId(undefined)
            }}
          >
            {loading ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#0b6bcb]" />
                <p className="text-sm">{t("common.loading")}…</p>
              </div>
            ) : error ? (
              <p className="p-6 text-sm text-destructive">{error}</p>
            ) : itemCount === 0 ? (
              <EmptyExplorer
                t={t}
                canManage={canManage}
                onCreate={handleCreateFolder}
                addressPath={addressPath}
              />
            ) : viewMode === "icons" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                <AnimatePresence mode="popLayout">
                  {filteredFolders.map((folder) => (
                    <FolderTile
                      key={`f-${folder.id}`}
                      folder={folder}
                      selected={selectedFolderId === folder.id}
                      dropActive={dropTargetId === folder.id}
                      canManage={canManage}
                      meta={t("archives.explorer.folderMeta", {
                        folders: folder.enfantsCount || 0,
                        files: folder.dossiersCount || 0,
                      })}
                      onOpen={() => openFolder(folder.id)}
                      onSelect={() => {
                        setSelectedFolderId(folder.id)
                        setSelectedArchiveId(null)
                      }}
                      onRename={() => handleRenameFolder(folder)}
                      onDelete={() => handleDeleteFolder(folder)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDropTargetId(folder.id)
                      }}
                      onDragLeave={() =>
                        setDropTargetId((cur) => (cur === folder.id ? undefined : cur))
                      }
                      onDrop={(e) => onDropOnFolder(e, folder.id)}
                    />
                  ))}
                  {filteredFiles.map((file) => (
                    <FileTile
                      key={`a-${file.id}`}
                      file={file}
                      selected={selectedArchiveId === file.id}
                      canManage={canManage}
                      dragging={draggingArchiveId === file.id}
                      onSelect={() => {
                        setSelectedArchiveId(file.id)
                        setSelectedFolderId(null)
                      }}
                      onOpen={() => openArchivePdf(file)}
                      onDragStart={(e) => {
                        setDraggingArchiveId(file.id)
                        e.dataTransfer.setData("text/archive-id", String(file.id))
                        e.dataTransfer.effectAllowed = "move"
                      }}
                      onDragEnd={() => setDraggingArchiveId(null)}
                      statusLabel={file.statutArchive}
                      statusVariant={STATUT_VARIANT[file.statutArchive] || "outline"}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <DetailsTable
                folders={filteredFolders}
                files={filteredFiles}
                canManage={canManage}
                selectedArchiveId={selectedArchiveId}
                selectedFolderId={selectedFolderId}
                dropTargetId={dropTargetId}
                draggingArchiveId={draggingArchiveId}
                t={t}
                onOpenFolder={openFolder}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id)
                  setSelectedArchiveId(null)
                }}
                onSelectFile={(id) => {
                  setSelectedArchiveId(id)
                  setSelectedFolderId(null)
                }}
                onOpenFile={(file) => openArchivePdf(file)}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveFile={pickMoveTarget}
                onDropOnFolder={onDropOnFolder}
                setDropTargetId={setDropTargetId}
                setDraggingArchiveId={setDraggingArchiveId}
              />
            )}
          </div>

          {/* Panneau détail sélection + barre d'état */}
          <div className="border-t border-slate-200 bg-slate-50/90">
            {selectedFile && (
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-4 py-2.5 text-sm">
                <WinFileIcon className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">
                    {selectedFile.nomPatient || selectedFile.numeroDossier}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {selectedFile.numeroDossier} · {selectedFile.typeEpisode} ·{" "}
                    {selectedFile.statutArchive}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => go(`/archives/${selectedFile.id}`)}
                >
                  {t("archives.viewDossier")}
                </Button>
                {pickPrimaryFichier(selectedFile) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => openArchivePdf(selectedFile)}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    {t("archives.pdf.open")}
                  </Button>
                )}
                {canManage && (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => pickMoveTarget(selectedFile)}>
                    <MoveRight className="mr-1 h-3.5 w-3.5" />
                    {t("archives.explorer.move")}
                  </Button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-1.5 text-[11px] text-slate-500">
              <span>
                {t("archives.explorer.statusCount", {
                  count: itemCount,
                  folders: filteredFolders.length,
                  files: filteredFiles.length,
                })}
              </span>
              <span className="truncate pl-4 opacity-70">{addressPath}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({ children, onClick, active, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 transition-all",
        active
          ? "border-primary/30 bg-primary/12 text-primary shadow-sm"
          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm",
      )}
    >
      {children}
    </button>
  )
}

function FolderTile({
  folder,
  selected,
  dropActive,
  canManage,
  meta,
  onOpen,
  onSelect,
  onRename,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        "group relative rounded-xl border px-2 pb-2 pt-3 text-center transition-all",
        selected
          ? "border-[#7ebbef] bg-[#d9ecfb] shadow-sm"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50/80",
        dropActive && "border-[#60a5fa] bg-[#dbeafe] ring-2 ring-[#93c5fd]",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onSelect}
      onDoubleClick={onOpen}
    >
      <button type="button" className="mx-auto block" onDoubleClick={onOpen} onClick={onSelect}>
        <WinFolderIcon open={selected || dropActive} className="mx-auto h-14 w-14" />
        <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-tight text-slate-800">
          {folder.nom}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">{meta}</p>
      </button>
      {canManage && (
        <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            className="rounded bg-white/90 p-1 shadow-sm hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onRename()
            }}
          >
            <Pencil className="h-3 w-3 text-slate-500" />
          </button>
          <button
            type="button"
            className="rounded bg-white/90 p-1 shadow-sm hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

function FileTile({
  file,
  selected,
  canManage,
  dragging,
  onSelect,
  onOpen,
  onDragStart,
  onDragEnd,
  statusLabel,
  statusVariant,
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: dragging ? 0.55 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      draggable={canManage}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onDoubleClick={onOpen}
      className={cn(
        "cursor-default rounded-xl border px-2 pb-2 pt-3 text-center transition-all",
        selected
          ? "border-[#7ebbef] bg-[#d9ecfb] shadow-sm"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50/80",
        canManage && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="relative mx-auto h-14 w-14">
        {file.hasPdf ? (
          <FileText className="mx-auto h-14 w-14 text-red-600" strokeWidth={1.25} />
        ) : (
          <WinFileIcon className="mx-auto h-14 w-14" />
        )}
        {file.hasPdf && (
          <span className="absolute -right-1 -top-1 rounded bg-red-600 px-1 text-[9px] font-bold text-white">
            PDF
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-tight text-slate-800">
        {file.hasPdf && file.nomPdf
          ? file.nomPdf.replace(/\.pdf$/i, "")
          : file.nomPatient || file.numeroDossier || `#${file.id}`}
      </p>
      <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
        {file.hasPdf ? (file.nomPdf || "dossier.pdf") : file.numeroDossier || `ID-${file.id}`}
      </p>
      <div className="mt-1.5 flex justify-center">
        <Badge variant={statusVariant} className="text-[9px]">
          {statusLabel}
        </Badge>
      </div>
    </motion.div>
  )
}

function DetailsTable({
  folders,
  files,
  canManage,
  selectedArchiveId,
  selectedFolderId,
  dropTargetId,
  draggingArchiveId,
  t,
  onOpenFolder,
  onSelectFolder,
  onSelectFile,
  onOpenFile,
  onRenameFolder,
  onDeleteFolder,
  onMoveFile,
  onDropOnFolder,
  setDropTargetId,
  setDraggingArchiveId,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2.5">{t("archives.explorer.colName")}</th>
            <th className="hidden px-3 py-2.5 sm:table-cell">{t("archives.explorer.colType")}</th>
            <th className="hidden px-3 py-2.5 md:table-cell">{t("archives.columns.statut")}</th>
            <th className="px-3 py-2.5 text-right">{t("archives.columns.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {folders.map((folder) => (
            <tr
              key={`fd-${folder.id}`}
              className={cn(
                "border-b border-slate-100 transition-colors",
                selectedFolderId === folder.id ? "bg-[#d9ecfb]" : "hover:bg-slate-50",
                dropTargetId === folder.id && "bg-[#dbeafe]",
              )}
              onClick={() => onSelectFolder(folder.id)}
              onDoubleClick={() => onOpenFolder(folder.id)}
              onDragOver={(e) => {
                e.preventDefault()
                setDropTargetId(folder.id)
              }}
              onDragLeave={() => setDropTargetId((cur) => (cur === folder.id ? undefined : cur))}
              onDrop={(e) => onDropOnFolder(e, folder.id)}
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <WinFolderIcon className="h-5 w-5" />
                  <span className="font-medium text-slate-800">{folder.nom}</span>
                </div>
              </td>
              <td className="hidden px-3 py-2 text-slate-500 sm:table-cell">
                {t("archives.explorer.folders")}
              </td>
              <td className="hidden px-3 py-2 md:table-cell">
                <span className="text-slate-400">—</span>
              </td>
              <td className="px-3 py-2 text-right">
                {canManage && (
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onRenameFolder(folder)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive"
                      onClick={() => onDeleteFolder(folder)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {files.map((file) => (
            <tr
              key={`fl-${file.id}`}
              draggable={canManage}
              onDragStart={(e) => {
                setDraggingArchiveId(file.id)
                e.dataTransfer.setData("text/archive-id", String(file.id))
              }}
              onDragEnd={() => setDraggingArchiveId(null)}
              className={cn(
                "border-b border-slate-100 transition-colors",
                selectedArchiveId === file.id ? "bg-[#d9ecfb]" : "hover:bg-slate-50",
                draggingArchiveId === file.id && "opacity-50",
              )}
              onClick={() => onSelectFile(file.id)}
              onDoubleClick={() => onOpenFile(file)}
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {file.hasPdf ? (
                    <FileText className="h-5 w-5 text-red-600" />
                  ) : (
                    <WinFileIcon className="h-5 w-5" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {file.hasPdf && file.nomPdf
                        ? file.nomPdf
                        : file.nomPatient || file.numeroDossier}
                    </p>
                    <p className="truncate font-mono text-[10px] text-slate-400">
                      {file.numeroDossier}
                      {file.hasPdf ? " · PDF" : ""}
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden px-3 py-2 text-slate-500 sm:table-cell">
                {file.typeEpisode || "—"}
              </td>
              <td className="hidden px-3 py-2 md:table-cell">
                <Badge variant={STATUT_VARIANT[file.statutArchive] || "outline"} className="text-[10px]">
                  {file.statutArchive}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="inline-flex gap-1">
                  <Button size="sm" variant="outline" className="h-7" onClick={() => onOpenFile(file)}>
                    {file.hasPdf ? t("archives.pdf.open") : t("archives.viewDossier")}
                  </Button>
                  {canManage && (
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onMoveFile(file)}>
                      <MoveRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyExplorer({ t, canManage, onCreate, addressPath }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center">
      <WinFolderIcon open className="mb-4 h-16 w-16 opacity-90" />
      <p className="font-display text-lg font-semibold text-slate-800">{t("archives.explorer.empty")}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{t("archives.explorer.emptyHint")}</p>
      <p className="mt-3 font-mono text-[11px] text-slate-400">{addressPath}</p>
      {canManage && (
        <Button className="mt-5 gap-2" onClick={onCreate}>
          <FolderPlus className="h-4 w-4" />
          {t("archives.explorer.newFolder")}
        </Button>
      )}
    </div>
  )
}

function flattenTree(nodes, prefix = "") {
  const out = []
  for (const n of nodes || []) {
    const path = prefix ? `${prefix} / ${n.nom}` : n.nom
    out.push({ id: n.id, nom: n.nom, path, label: path })
    out.push(...flattenTree(n.children, path))
  }
  return out
}
