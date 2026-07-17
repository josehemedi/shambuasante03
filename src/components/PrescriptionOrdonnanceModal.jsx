import { useEffect, useMemo, useState } from "react"
import {
  FileText,
  Loader2,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { Button, Badge, Input } from "@/components/ui/primitives"
import { useAuth } from "@/auth/AuthProvider"
import { useTenantScope } from "@/hooks/useTenantScope"
import { ordonnanceService } from "@/services/api"
import { cn, formatDateTime } from "@/lib/utils"

const VOIES = ["Orale", "IV", "IM", "SC", "Topique", "Inhalée", "Autre"]

function emptyMed() {
  return {
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    route: "Orale",
  }
}

function formatMedLine(m, index) {
  const parts = [
    m.name.trim(),
    m.dosage.trim() && `${m.dosage.trim()}`,
    m.route.trim() && `voie ${m.route.trim()}`,
    m.frequency.trim() && m.frequency.trim(),
    m.duration.trim() && `pendant ${m.duration.trim()}`,
  ].filter(Boolean)
  return `${index + 1}. ${parts.join(" — ")}`
}

function PrescriptionDocument({
  hospitalName,
  doctorName,
  doctorSpecialty,
  patientName,
  diagnostic,
  medLines,
  observations,
  dateLabel,
  numero,
  labContext,
  className,
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-sm border border-slate-300 bg-[#fbfbf9] text-slate-900 shadow-sm",
        className,
      )}
    >
      <div className="border-b-2 border-slate-800 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-slate-900">
              {hospitalName}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Service de consultation · Ordonnance médicale
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-semibold text-slate-800">ORDONNANCE</p>
            {numero && <p className="mt-0.5 font-mono text-[11px]">{numero}</p>}
            {dateLabel && <p className="mt-0.5">{dateLabel}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-200 px-6 py-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Médecin prescripteur</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{doctorName || "—"}</p>
          {doctorSpecialty && <p className="text-xs text-slate-600">{doctorSpecialty}</p>}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Patient</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{patientName || "—"}</p>
          {labContext && <p className="mt-1 text-xs leading-relaxed text-slate-600">{labContext}</p>}
        </div>
      </div>

      {diagnostic && (
        <div className="border-b border-slate-200 px-6 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Diagnostic</p>
          <p className="mt-1 text-sm text-slate-800">{diagnostic}</p>
        </div>
      )}

      <div className="px-6 py-5">
        <div className="mb-4 flex items-end gap-3">
          <span className="font-display text-4xl font-bold leading-none text-slate-900">Rp/</span>
          <span className="pb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
            Prescription
          </span>
        </div>

        {medLines.length === 0 ? (
          <p className="text-sm italic text-slate-400">Aucun médicament prescrit.</p>
        ) : (
          <ol className="space-y-3">
            {medLines.map((line, i) => (
              <li key={i} className="flex gap-3 border-b border-dotted border-slate-300 pb-3 last:border-0">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-400 text-xs font-semibold">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-900">{line.replace(/^\d+\.\s*/, "")}</p>
              </li>
            ))}
          </ol>
        )}

        {observations && (
          <div className="mt-5 rounded-sm border border-slate-200 bg-white/70 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Conseils & observations
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{observations}</p>
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <div className="w-48 text-center">
            <div className="mb-8 h-12 border-b border-slate-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Signature & cachet
            </p>
            <p className="mt-1 text-xs text-slate-600">{doctorName || "Médecin"}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-6 py-2 text-center text-[10px] text-slate-500">
        Document confidentiel — usage médical uniquement · {hospitalName}
      </div>
    </article>
  )
}

/**
 * Ordonnance médicale professionnelle (prescription + historique PDF).
 */
export default function PrescriptionOrdonnanceModal({
  open,
  onClose,
  patientName,
  idPatient,
  idMedecin,
  diagnosticHint = "",
  labContext = "",
}) {
  const { user } = useAuth()
  const { hospitalName } = useTenantScope()
  const [tab, setTab] = useState("prescribe")
  const [meds, setMeds] = useState([emptyMed()])
  const [observations, setObservations] = useState("")
  const [diagnostic, setDiagnostic] = useState(diagnosticHint || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [ordonnances, setOrdonnances] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedOrdo, setSelectedOrdo] = useState(null)
  const [pdfLoadingId, setPdfLoadingId] = useState(null)

  const doctorName = user?.name || "Médecin"
  const doctorSpecialty = user?.specialty || user?.specialite || ""

  useEffect(() => {
    if (!open) return
    setTab("prescribe")
    setMeds([emptyMed()])
    setObservations("")
    setDiagnostic(diagnosticHint || "")
    setError("")
    setSelectedOrdo(null)
    setPdfLoadingId(null)
    if (idPatient) loadOrdonnances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idPatient, diagnosticHint])

  const loadOrdonnances = async () => {
    if (!idPatient) return
    setLoadingList(true)
    try {
      const list = await ordonnanceService.listByPatient(idPatient)
      setOrdonnances(Array.isArray(list) ? list : [])
    } catch {
      setOrdonnances([])
    } finally {
      setLoadingList(false)
    }
  }

  const filledMeds = useMemo(
    () => meds.filter((m) => m.name.trim()),
    [meds],
  )

  const previewLines = useMemo(
    () => filledMeds.map((m, i) => formatMedLine(m, i)),
    [filledMeds],
  )

  const buildContenu = () => previewLines.join("\n")

  const openJasperPdf = async (idOrdonnance) => {
    if (!idOrdonnance) return
    setPdfLoadingId(idOrdonnance)
    setError("")
    try {
      await ordonnanceService.openPdf(idOrdonnance)
    } catch (err) {
      setError(err?.message || "Impossible d'ouvrir le PDF de l'ordonnance.")
    } finally {
      setPdfLoadingId(null)
    }
  }

  const handleSave = async (e) => {
    e?.preventDefault?.()
    if (!idPatient || !idMedecin) {
      setError("Patient ou médecin manquant (session multi-tenant).")
      return
    }
    const contenu = buildContenu()
    if (!contenu.trim()) {
      setError("Ajoutez au moins un médicament.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const notes = [observations.trim(), labContext ? `Contexte clinique : ${labContext}` : ""]
        .filter(Boolean)
        .join("\n")
      await ordonnanceService.create({
        idPatient: Number(idPatient),
        idMedecin: Number(idMedecin),
        diagnostic: diagnostic.trim() || null,
        contenuOrdonnance: contenu.trim(),
        observations: notes || null,
      })
      const list = await ordonnanceService.listByPatient(idPatient)
      const next = Array.isArray(list) ? list : []
      setOrdonnances(next)
      setMeds([emptyMed()])
      setObservations("")
      setTab("view")
      const newest = next[0]
      if (newest) setSelectedOrdo(newest)
      if (newest?.idOrdonnance) {
        await openJasperPdf(newest.idOrdonnance)
      }
    } catch (err) {
      setError(err?.message || "Impossible d'enregistrer l'ordonnance.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <AnimatedModal open={open} onClose={onClose} contentClassName="max-w-5xl" zIndex={10000}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Prescription médicale
            </p>
            <h2 className="font-display text-lg font-bold text-foreground">
              Ordonnance — {patientName || "Patient"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2 hidden rounded-lg border border-border p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => setTab("prescribe")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  tab === "prescribe"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Rédiger
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("view")
                  loadOrdonnances()
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  tab === "view"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Historique
              </button>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex gap-1 border-b border-border px-4 py-2 sm:hidden">
          <button
            type="button"
            onClick={() => setTab("prescribe")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-xs font-semibold",
              tab === "prescribe" ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
            )}
          >
            Rédiger
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("view")
              loadOrdonnances()
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-xs font-semibold",
              tab === "view" ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
            )}
          >
            Historique
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {tab === "prescribe" ? (
          <form onSubmit={handleSave} className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-2">
            <div className="space-y-4 overflow-y-auto border-b border-border p-5 lg:border-b-0 lg:border-r">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Diagnostic clinique
                </span>
                <Input
                  value={diagnostic}
                  onChange={(e) => setDiagnostic(e.target.value)}
                  placeholder="Ex. Hypertension artérielle essentielle…"
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Lignes de prescription
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMeds((p) => [...p, emptyMed()])}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Médicament
                  </Button>
                </div>

                {meds.map((med, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Ligne {index + 1}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          setMeds((prev) =>
                            prev.length <= 1 ? [emptyMed()] : prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Dénomination du médicament (DCI ou spécialité)"
                      value={med.name}
                      onChange={(e) =>
                        setMeds((prev) =>
                          prev.map((m, i) => (i === index ? { ...m, name: e.target.value } : m)),
                        )
                      }
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Dosage / forme (ex. 500 mg cp)"
                        value={med.dosage}
                        onChange={(e) =>
                          setMeds((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, dosage: e.target.value } : m)),
                          )
                        }
                      />
                      <select
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={med.route}
                        onChange={(e) =>
                          setMeds((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, route: e.target.value } : m)),
                          )
                        }
                      >
                        {VOIES.map((v) => (
                          <option key={v} value={v}>
                            Voie {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Posologie (ex. 1 cp × 3/j)"
                        value={med.frequency}
                        onChange={(e) =>
                          setMeds((prev) =>
                            prev.map((m, i) =>
                              i === index ? { ...m, frequency: e.target.value } : m,
                            ),
                          )
                        }
                      />
                      <Input
                        placeholder="Durée (ex. 7 jours)"
                        value={med.duration}
                        onChange={(e) =>
                          setMeds((prev) =>
                            prev.map((m, i) =>
                              i === index ? { ...m, duration: e.target.value } : m,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Conseils au patient
                </span>
                <textarea
                  className="min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Hydratation, prise pendant les repas, vigilance…"
                />
              </label>
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden bg-slate-100/80 p-4 sm:p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aperçu de l&apos;ordonnance
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <PrescriptionDocument
                  hospitalName={hospitalName}
                  doctorName={doctorName}
                  doctorSpecialty={doctorSpecialty}
                  patientName={patientName}
                  diagnostic={diagnostic}
                  medLines={previewLines}
                  observations={observations}
                  dateLabel={new Date().toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  labContext={labContext}
                />
              </div>
              <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Annuler
                </Button>
                <Button type="submit" className="gap-1.5" disabled={saving || filledMeds.length === 0}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Valider &amp; PDF
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,17rem)_1fr]">
            <aside className="overflow-y-auto border-b border-border p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Historique
                </p>
                <Button type="button" size="sm" variant="outline" onClick={loadOrdonnances} disabled={loadingList}>
                  {loadingList ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Actualiser
                </Button>
              </div>

              {loadingList ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                </div>
              ) : ordonnances.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                  Aucune ordonnance enregistrée pour ce patient.
                </p>
              ) : (
                <ul className="space-y-2">
                  {ordonnances.map((o) => {
                    const id = o.idOrdonnance
                    const active = selectedOrdo?.idOrdonnance === id
                    return (
                      <li key={id || o.numeroOrdonnance || o.datePrescription}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrdo(o)}
                          className={cn(
                            "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                            active
                              ? "border-foreground/30 bg-muted"
                              : "border-border/70 hover:border-foreground/20 hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {o.numeroOrdonnance || `ORD-${id || "—"}`}
                            </span>
                            <Badge variant={o.statut === "ACTIVE" ? "success" : "secondary"} className="text-[10px]">
                              {o.statut || "ACTIVE"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-foreground">
                            {formatDateTime(o.datePrescription)}
                          </p>
                          {o.diagnostic && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                              {o.diagnostic}
                            </p>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setTab("prescribe")}
              >
                <Plus className="h-3.5 w-3.5" />
                Nouvelle ordonnance
              </Button>
            </aside>

            <div className="flex min-h-0 flex-col overflow-hidden bg-slate-100/80 p-4 sm:p-5">
              {selectedOrdo ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Document sélectionné
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={!selectedOrdo.idOrdonnance || pdfLoadingId === selectedOrdo.idOrdonnance}
                      onClick={() => openJasperPdf(selectedOrdo.idOrdonnance)}
                    >
                      {pdfLoadingId === selectedOrdo.idOrdonnance ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                      Imprimer PDF
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <PrescriptionDocument
                      hospitalName={hospitalName}
                      doctorName={doctorName}
                      doctorSpecialty={doctorSpecialty}
                      patientName={patientName}
                      diagnostic={selectedOrdo.diagnostic || ""}
                      medLines={String(selectedOrdo.contenuOrdonnance || "")
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)}
                      observations={selectedOrdo.observations || ""}
                      dateLabel={formatDateTime(selectedOrdo.datePrescription)}
                      numero={selectedOrdo.numeroOrdonnance || `ORD-${selectedOrdo.idOrdonnance || "—"}`}
                      labContext={labContext}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 opacity-40" />
                  <p>Sélectionnez une ordonnance dans l&apos;historique pour l&apos;afficher.</p>
                </div>
              )}
              <div className="mt-4 flex shrink-0 justify-end border-t border-border/60 pt-4">
                <Button type="button" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedModal>
  )
}
