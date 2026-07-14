import { useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Loader2,
  History,
  Lock,
  FileText,
  Download,
  RefreshCw,
  UserRound,
  ClipboardList,
  FolderLock,
  Shield,
  Upload,
  Trash2,
  Paperclip,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { archiveService } from "@/services/archiveService"
import { ROLE_KEYS } from "@/config/roles"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"

const DETAIL_TABS = [
  { id: "resume", icon: ClipboardList },
  { id: "patient", icon: UserRound },
  { id: "fichiers", icon: FileText },
  { id: "historique", icon: History },
  { id: "acces", icon: Shield },
]

const STATUT_STYLE = {
  A_VERIFIER: "bg-amber-100 text-amber-800 ring-amber-200/80",
  INCOMPLET: "bg-rose-100 text-rose-800 ring-rose-200/80",
  PRET_A_ARCHIVER: "bg-sky-100 text-sky-800 ring-sky-200/80",
  ARCHIVE: "bg-emerald-100 text-emerald-800 ring-emerald-200/80",
  RESTAURE: "bg-slate-100 text-slate-700 ring-slate-200/80",
}

const ACTION_VARIANT = {
  ARCHIVER: "default",
  VERIFIER: "default",
  MARQUER_INCOMPLET: "outline",
  RESTAURER: "outline",
}

export default function ArchiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { roleKey } = useAuth()
  const [activeTab, setActiveTab] = useState("resume")
  const [actionLoading, setActionLoading] = useState(false)
  const fileInputRef = useRef(null)

  const { data: archive, loading, reload } = useAsync(
    () => archiveService.getById(id),
    [id],
  )

  const { data: historique } = useAsync(
    () => (activeTab === "historique" ? archiveService.getHistorique(id) : Promise.resolve([])),
    [id, activeTab],
  )

  const isArchived = archive?.statutArchive === "ARCHIVE"
  const canArchive = roleKey === ROLE_KEYS.ARCHIVIST || roleKey === ROLE_KEYS.HOSPITAL_ADMIN
  const actions = archive?.actionsAutorisees || []
  const snap = archive?.contenuSnapshot
  const patient = snap?.patient || {}

  async function handleUploadFile(file) {
    if (!file) return
    const result = await Swal.fire({
      title: t("archives.pdf.uploadTitle"),
      input: "text",
      inputLabel: t("archives.pdf.uploadLabel"),
      inputValue: file.name.replace(/\.[^.]+$/, ""),
      showCancelButton: true,
      confirmButtonText: t("archives.pdf.uploadConfirm"),
    })
    if (!result.isConfirmed) return
    setActionLoading(true)
    try {
      await archiveService.uploadFichier(id, file, result.value || undefined)
      await reload()
      Swal.fire(t("archives.success"), "", "success")
    } catch (e) {
      Swal.fire(t("common.error"), e.message, "error")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUploadSelected(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    await handleUploadFile(file)
  }

  async function handleAction(action) {
    if (action === "ARCHIVER") {
      const result = await Swal.fire({
        title: t("archives.confirmArchive"),
        input: "textarea",
        inputLabel: t("archives.motif"),
        showCancelButton: true,
        confirmButtonText: t("archives.archiveAction"),
      })
      if (!result.isConfirmed) return
      setActionLoading(true)
      try {
        await archiveService.archiver(id, {
          motif: result.value,
          emplacementPhysique: result.value,
        })
        await reload()
        Swal.fire(t("archives.success"), "", "success")
      } catch (e) {
        Swal.fire(t("common.error"), e.message, "error")
      } finally {
        setActionLoading(false)
      }
    }

    if (action === "RESTAURER") {
      const result = await Swal.fire({
        title: t("archives.confirmRestore"),
        input: "textarea",
        inputLabel: t("archives.motifRequired"),
        inputValidator: (v) => (!v ? t("archives.motifRequired") : undefined),
        showCancelButton: true,
      })
      if (!result.isConfirmed) return
      setActionLoading(true)
      try {
        await archiveService.restaurer(id, { motif: result.value })
        await reload()
      } catch (e) {
        Swal.fire(t("common.error"), e.message, "error")
      } finally {
        setActionLoading(false)
      }
    }

    if (action === "MARQUER_INCOMPLET") {
      const result = await Swal.fire({
        title: t("archives.markIncomplete"),
        input: "textarea",
        showCancelButton: true,
      })
      if (!result.isConfirmed) return
      setActionLoading(true)
      try {
        await archiveService.marquerIncomplet(id, { observation: result.value })
        await reload()
      } finally {
        setActionLoading(false)
      }
    }

    if (action === "VERIFIER") {
      setActionLoading(true)
      try {
        await archiveService.pretAArchiver(id, {})
        await reload()
      } finally {
        setActionLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
        <p className="text-sm text-muted-foreground">{t("archives.detailTitle")}…</p>
      </div>
    )
  }

  if (!archive) {
    return <p className="text-center py-12 text-muted-foreground">{t("archives.notFound")}</p>
  }

  const visibleTabs = DETAIL_TABS.filter((tab) => tab.id !== "acces" || isArchived)

  return (
    <div className="relative space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -top-4 h-48 rounded-3xl bg-[radial-gradient(ellipse_at_top,rgba(59_130_246/0.10),transparent_60%)]"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 shrink-0 rounded-xl border-border/80 bg-card p-0 shadow-sm"
          onClick={() => navigate("/archives")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <FolderLock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <PageHeader
                title={`${t("archives.detailTitle")} #${archive.id}`}
                subtitle={archive.nomPatient || patient.nomComplet}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                  STATUT_STYLE[archive.statutArchive] || STATUT_STYLE.RESTAURE,
                )}
              >
                {archive.statutArchive}
              </span>
              {isArchived && (
                <Badge variant="outline" className="flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-800">
                  <Lock className="h-3 w-3" />
                  {t("archives.readOnly")}
                </Badge>
              )}
              {archive.hasPdf && (
                <Badge variant="outline" className="flex items-center gap-1 border-rose-200 bg-rose-50 text-rose-700">
                  <FileText className="h-3 w-3" />
                  PDF
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {canArchive && actions.length > 0 && (
        <div className="relative flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
          {actions.map((action) => (
            <Button
              key={action}
              size="sm"
              variant={ACTION_VARIANT[action] || "outline"}
              disabled={actionLoading}
              className="shadow-sm"
              onClick={() => handleAction(action)}
            >
              {t(`archives.actions.${action}`, action)}
            </Button>
          ))}
        </div>
      )}

      <div className="relative overflow-x-auto">
        <div className="inline-flex min-w-full gap-1 rounded-2xl border border-border/80 bg-card/80 p-1.5 shadow-sm sm:min-w-0">
          {visibleTabs.map(({ id: tab, icon: Icon }) => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  active ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="archive-detail-tab"
                    className="absolute inset-0 rounded-xl bg-primary shadow-md shadow-primary/25"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{t(`archives.detailTabs.${tab}`)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "resume" && (
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <div className="border-b border-border/60 bg-gradient-to-r from-primary/[0.06] via-card to-emerald-500/[0.04] px-5 py-3">
                <p className="font-display text-sm font-semibold">{t("archives.detailTabs.resume")}</p>
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <Info label={t("archives.columns.type")} value={archive.typeEpisode} />
                <Info label={t("archives.columns.statut")} value={archive.statutArchive} />
                <Info label={t("archives.columns.medecin")} value={archive.nomMedecin} />
                <Info label={t("archives.columns.dateFin")} value={formatDate(archive.dateFinEpisode)} />
                <Info label={t("archives.emplacement")} value={archive.emplacementPhysique} />
                <Info label={t("archives.archiviste")} value={archive.nomArchiviste} />
                <Info label={t("archives.dateArchivage")} value={formatDate(archive.dateArchivage)} />
                <Info label={t("archives.observation")} value={archive.observation} />
                {snap?.captureAt && (
                  <Info label={t("archives.snapshot.capturedAt")} value={formatDate(snap.captureAt)} />
                )}
              </div>
            </Card>
          )}

          {activeTab === "patient" && (
            <div className="space-y-4">
              {!snap ? (
                <Card className="space-y-3 border-border/70 p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">{t("archives.snapshot.pending")}</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Info label={t("archives.columns.patient")} value={archive.nomPatient} />
                    <Info label={t("archives.columns.dossier")} value={archive.numeroDossier} />
                    <Info label="ID patient" value={archive.patientId} />
                  </div>
                </Card>
              ) : (
                <>
                  <Section title={t("archives.snapshot.identity")}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Info label={t("archives.columns.patient")} value={patient.nomComplet || archive.nomPatient} />
                      <Info label={t("archives.columns.dossier")} value={patient.codePatient || archive.numeroDossier} />
                      <Info label={t("archives.snapshot.sexe")} value={patient.sexe} />
                      <Info label={t("archives.snapshot.dateNaissance")} value={formatDateOnly(patient.dateNaissance)} />
                      <Info label={t("archives.snapshot.groupeSanguin")} value={patient.groupeSanguin} />
                      <Info label={t("archives.snapshot.telephone")} value={patient.telephone} />
                      <Info label={t("archives.snapshot.email")} value={patient.email} />
                      <Info label={t("archives.snapshot.adresse")} value={patient.adresse} />
                      <Info label={t("archives.snapshot.profession")} value={patient.profession} />
                      <Info label={t("archives.snapshot.contactUrgence")} value={patient.contactUrgence} />
                      <Info label={t("archives.snapshot.matricule")} value={patient.numeroMatricule} />
                      <Info label={t("archives.snapshot.statutClinique")} value={patient.statutClinique} />
                    </div>
                  </Section>

                  <Section title={`${t("archives.snapshot.consultations")} (${(snap.consultations || []).length})`}>
                    {(snap.consultations || []).length === 0 ? (
                      <Empty />
                    ) : (
                      <ul className="space-y-3">
                        {(snap.consultations || []).map((c, i) => (
                          <li
                            key={c.idConsultation || i}
                            className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm"
                          >
                            <p className="font-medium">
                              {formatDate(c.dateConsultation)}
                              {c.nomMedecin ? ` · ${c.nomMedecin}` : ""}
                            </p>
                            <p className="mt-1 text-muted-foreground">{c.motifVisite || c.motif || "—"}</p>
                            {c.diagnostic && (
                              <p className="mt-1">
                                <span className="text-muted-foreground">{t("archives.snapshot.diagnostic")}: </span>
                                {c.diagnostic}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {c.tensionArterielle && <Chip>TA {c.tensionArterielle}</Chip>}
                              {c.frequenceCardiaque != null && <Chip>FC {c.frequenceCardiaque}</Chip>}
                              {c.temperature != null && <Chip>T° {c.temperature}</Chip>}
                              {c.poids != null && <Chip>{c.poids} kg</Chip>}
                              {c.taille != null && <Chip>{c.taille} cm</Chip>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section title={`${t("archives.snapshot.antecedents")} (${(snap.antecedents || []).length})`}>
                    {(snap.antecedents || []).length === 0 ? (
                      <Empty />
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {(snap.antecedents || []).map((a, i) => (
                          <li key={a.id || i} className="rounded-xl border border-border/60 px-3 py-2.5">
                            <p className="font-medium">{a.libelle || a.type || "—"}</p>
                            <p className="text-muted-foreground">{a.description}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[a.type, a.date ? formatDateOnly(a.date) : null, a.critique ? t("archives.snapshot.critique") : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section title={`${t("archives.snapshot.ordonnances")} (${(snap.ordonnances || []).length})`}>
                    {(snap.ordonnances || []).length === 0 ? (
                      <Empty />
                    ) : (
                      <ul className="space-y-3 text-sm">
                        {(snap.ordonnances || []).map((o, i) => (
                          <li key={o.idOrdonnance || i} className="rounded-xl border border-border/60 p-3">
                            <p className="font-medium">
                              {o.numeroOrdonnance || `#${o.idOrdonnance || i + 1}`} · {formatDate(o.dateOrdonnance)}
                            </p>
                            {o.diagnostic && <p className="text-muted-foreground">{o.diagnostic}</p>}
                            {o.contenuOrdonnance && (
                              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-2.5 font-sans text-xs">
                                {o.contenuOrdonnance}
                              </pre>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section title={`${t("archives.snapshot.bonsSortie")} (${(snap.bonsSortie || []).length})`}>
                    {(snap.bonsSortie || []).length === 0 ? (
                      <Empty />
                    ) : (
                      <ul className="space-y-3 text-sm">
                        {(snap.bonsSortie || []).map((b, i) => (
                          <li key={b.idBonSortie || i} className="space-y-1 rounded-xl border border-border/60 p-3">
                            <p className="font-medium">
                              {b.numeroBon || `#${b.idBonSortie}`} · {formatDate(b.dateSortie)}
                            </p>
                            <Info label={t("archives.snapshot.diagnostic")} value={b.diagnosticFinal} />
                            <Info label={t("archives.snapshot.etatSortie")} value={b.etatSortie} />
                            {b.recommandations && <p className="text-muted-foreground">{b.recommandations}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section title={`${t("archives.snapshot.rendezVous")} (${(snap.rendezVous || []).length})`}>
                    {(snap.rendezVous || []).length === 0 ? (
                      <Empty />
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {(snap.rendezVous || []).map((r, i) => (
                          <li key={r.idRendezVous || i} className="rounded-xl border border-border/60 px-3 py-2.5">
                            <p className="font-medium">{formatDate(r.dateHeure)}</p>
                            <p className="text-muted-foreground">
                              {r.motif || "—"} · {r.statut || "—"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section title={`${t("archives.snapshot.admissions")} (${(snap.admissions || []).length})`}>
                    {(snap.admissions || []).length === 0 ? (
                      <Empty />
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {(snap.admissions || []).map((a, i) => (
                          <li key={a.idAdmission || i} className="rounded-xl border border-border/60 px-3 py-2.5">
                            <p className="font-medium">
                              #{a.idAdmission} · {formatDate(a.tempsArrivee)}
                            </p>
                            <p className="text-muted-foreground">
                              {[a.statut, a.salle, a.niveauPriorite != null ? `P${a.niveauPriorite}` : null]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>
                </>
              )}
            </div>
          )}

          {activeTab === "fichiers" && (
            <Card className="space-y-4 overflow-hidden border-border/70 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-rose-500/[0.06] via-card to-transparent px-5 py-4">
                <div>
                  <h3 className="font-display text-sm font-semibold">{t("archives.pdf.title")}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t("archives.pdf.hint")}</p>
                </div>
                {canArchive && (
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt,.zip,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip"
                      onChange={handleUploadSelected}
                    />
                    <Button
                      size="sm"
                      className="gap-1.5 shadow-sm"
                      disabled={actionLoading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {t("archives.pdf.upload")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading}
                      className="gap-1.5"
                      onClick={async () => {
                        setActionLoading(true)
                        try {
                          await archiveService.regenererPdf(id)
                          await reload()
                          Swal.fire(t("archives.success"), "", "success")
                        } catch (e) {
                          Swal.fire(t("common.error"), e.message, "error")
                        } finally {
                          setActionLoading(false)
                        }
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t("archives.pdf.regenerate")}
                    </Button>
                  </div>
                )}
              </div>
              <div className="px-5 pb-5">
                {canArchive && (
                  <div
                    className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] px-4 py-8 text-center transition hover:border-primary/50 hover:bg-primary/[0.05]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files?.[0]
                      if (file) await handleUploadFile(file)
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-6 w-6 text-primary/70" />
                    <p className="text-sm font-medium text-foreground">{t("archives.pdf.dropHint")}</p>
                    <p className="text-xs text-muted-foreground">{t("archives.pdf.formats")}</p>
                  </div>
                )}
                {(archive.fichiers || []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t("archives.pdf.empty")}</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {(archive.fichiers || []).map((f) => {
                      const isUpload = String(f.typeFichier || "").startsWith("UPLOAD_")
                      return (
                        <li
                          key={f.id}
                          className={cn(
                            "flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 p-4 text-sm shadow-sm",
                            isUpload
                              ? "bg-gradient-to-r from-sky-50/90 via-white to-white"
                              : "bg-gradient-to-r from-rose-50/80 via-white to-white",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
                              isUpload ? "bg-sky-600" : "bg-rose-600",
                            )}
                          >
                            {isUpload ? <Paperclip className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-foreground">{f.nomFichier}</p>
                            <p className="text-xs text-muted-foreground">
                              {isUpload ? t("archives.pdf.uploaded") : f.typeFichier}
                              {" · "}
                              {formatBytes(f.tailleOctets)} · {formatDate(f.genereAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="gap-1.5 shadow-sm"
                              onClick={async () => {
                                try {
                                  const blob = await archiveService.downloadFichierBlob(id, f.id)
                                  const url = URL.createObjectURL(blob)
                                  if ((f.mimeType || "").includes("pdf") || (f.nomFichier || "").toLowerCase().endsWith(".pdf")) {
                                    window.open(url, "_blank", "noopener,noreferrer")
                                  } else {
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = f.nomFichier || "fichier"
                                    a.click()
                                  }
                                  setTimeout(() => URL.revokeObjectURL(url), 60_000)
                                } catch (e) {
                                  Swal.fire(t("common.error"), e.message, "error")
                                }
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                              {t("archives.pdf.open")}
                            </Button>
                            {canArchive && isUpload && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-destructive hover:bg-destructive/10"
                                disabled={actionLoading}
                                onClick={async () => {
                                  const result = await Swal.fire({
                                    title: t("archives.pdf.deleteTitle"),
                                    text: f.nomFichier,
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonText: t("archives.pdf.deleteConfirm"),
                                  })
                                  if (!result.isConfirmed) return
                                  setActionLoading(true)
                                  try {
                                    await archiveService.supprimerFichier(id, f.id)
                                    await reload()
                                  } catch (e) {
                                    Swal.fire(t("common.error"), e.message, "error")
                                  } finally {
                                    setActionLoading(false)
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </Card>
          )}

          {activeTab === "historique" && (
            <Card className="overflow-hidden border-border/70 p-0 shadow-sm">
              <div className="border-b border-border/60 px-5 py-3">
                <p className="font-display text-sm font-semibold">{t("archives.detailTabs.historique")}</p>
              </div>
              <div className="p-4">
                {(historique || []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("archives.noHistory")}</p>
                ) : (
                  <ul className="relative space-y-0 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-px before:bg-border">
                    {historique.map((h) => (
                      <li key={h.id} className="relative flex gap-3 py-3 pl-1 text-sm">
                        <div className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                          <History className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                          <p className="font-medium">{h.action}</p>
                          <p className="text-muted-foreground">
                            {h.ancienStatut} → {h.nouveauStatut} · {formatDate(h.dateAction)}
                          </p>
                          {h.motif && <p className="mt-1 text-xs text-foreground/80">{h.motif}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}

          {activeTab === "acces" && isArchived && (
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <div className="border-b border-border/60 bg-gradient-to-r from-primary/[0.05] to-transparent px-5 py-4">
                <p className="font-display text-sm font-semibold">{t("archives.requestAccess")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("archives.accessHint")}</p>
              </div>
              <div className="p-5">
                <Button
                  size="sm"
                  className="gap-1.5 shadow-sm"
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: t("archives.requestAccess"),
                      input: "textarea",
                      inputLabel: t("archives.motif"),
                      showCancelButton: true,
                    })
                    if (result.isConfirmed) {
                      await archiveService.creerDemandeAcces(id, { motif: result.value })
                      Swal.fire(t("archives.success"), "", "success")
                    }
                  }}
                >
                  <Shield className="h-3.5 w-3.5" />
                  {t("archives.requestAccess")}
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <div className="border-b border-border/50 bg-muted/30 px-5 py-3">
        <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

function Chip({ children }) {
  return (
    <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/15">
      {children}
    </span>
  )
}

function Empty() {
  return <p className="text-sm text-muted-foreground">—</p>
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/25 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words font-medium text-foreground">
        {value != null && value !== "" ? String(value) : "—"}
      </p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

function formatDateOnly(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString()
}

function formatBytes(value) {
  if (value == null || Number.isNaN(Number(value))) return "—"
  const n = Number(value)
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}
