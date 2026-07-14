import { useEffect, useState } from "react"
import { FileText, Loader2, Pill, Plus, QrCode, Trash2, X } from "lucide-react"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { Button, Badge, Input } from "@/components/ui/primitives"
import { ordonnanceService } from "@/services/api"
import { formatDateTime } from "@/lib/utils"

function emptyMed() {
  return { name: "", dosage: "", frequency: "" }
}

/**
 * Prescription médicaments + affichage des ordonnances du patient (tenant courant).
 * Icône QR / PDF JasperReports pour chaque ordonnance enregistrée.
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
  const [tab, setTab] = useState("prescribe") // prescribe | view
  const [meds, setMeds] = useState([emptyMed()])
  const [observations, setObservations] = useState("")
  const [diagnostic, setDiagnostic] = useState(diagnosticHint || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [ordonnances, setOrdonnances] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [lastCreated, setLastCreated] = useState(null)
  const [pdfLoadingId, setPdfLoadingId] = useState(null)

  useEffect(() => {
    if (!open) return
    setTab("prescribe")
    setMeds([emptyMed()])
    setObservations("")
    setDiagnostic(diagnosticHint || "")
    setError("")
    setLastCreated(null)
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

  const buildContenu = () =>
    meds
      .filter((m) => m.name.trim())
      .map(
        (m, i) =>
          `${i + 1}) ${m.name.trim()}${m.dosage ? ` — ${m.dosage.trim()}` : ""}${
            m.frequency ? ` — ${m.frequency.trim()}` : ""
          }`,
      )
      .join("\n")

  const openJasperPdf = async (idOrdonnance) => {
    if (!idOrdonnance) return
    setPdfLoadingId(idOrdonnance)
    setError("")
    try {
      await ordonnanceService.openPdf(idOrdonnance)
    } catch (err) {
      setError(err?.message || "Impossible d'ouvrir le PDF Jasper (QR).")
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
      const notes = [observations.trim(), labContext ? `Contexte labo : ${labContext}` : ""]
        .filter(Boolean)
        .join("\n")
      await ordonnanceService.create({
        idPatient: Number(idPatient),
        idMedecin: Number(idMedecin),
        diagnostic: diagnostic.trim() || null,
        contenuOrdonnance: contenu.trim(),
        observations: notes || null,
      })
      const preview = {
        contenuOrdonnance: contenu.trim(),
        diagnostic: diagnostic.trim(),
        observations: notes,
        patientName,
        datePrescription: new Date().toISOString(),
        statut: "ACTIVE",
      }
      setLastCreated(preview)
      const list = await ordonnanceService.listByPatient(idPatient)
      const next = Array.isArray(list) ? list : []
      setOrdonnances(next)
      setTab("view")
      setMeds([emptyMed()])
      setObservations("")
      const newest = next[0]
      if (newest?.idOrdonnance) {
        // Ouvre automatiquement le PDF Jasper + QR après création
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
    <AnimatedModal open={open} onClose={onClose} contentClassName="max-w-2xl" zIndex={10000}>
      <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-sky-800 px-5 py-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  Ordonnance médicale
                </p>
                <h2 className="font-display text-lg font-bold">{patientName || "Patient"}</h2>
                {labContext && <p className="text-xs text-white/75">Liée à : {labContext}</p>}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 border border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("prescribe")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                tab === "prescribe" ? "bg-white text-teal-900" : "bg-white/15 text-white"
              }`}
            >
              Prescrire
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("view")
                loadOrdonnances()
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                tab === "view" ? "bg-white text-teal-900" : "bg-white/15 text-white"
              }`}
            >
              Voir ordonnances
            </button>
          </div>
        </div>

        {tab === "prescribe" ? (
          <form onSubmit={handleSave} className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Diagnostic
              <Input
                className="h-10 normal-case tracking-normal"
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
                placeholder="Diagnostic associé…"
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Médicaments
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMeds((p) => [...p, emptyMed()])}
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </Button>
              </div>
              {meds.map((med, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border border-border/70 bg-muted/10 p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
                >
                  <Input
                    placeholder="Médicament"
                    value={med.name}
                    onChange={(e) =>
                      setMeds((prev) =>
                        prev.map((m, i) => (i === index ? { ...m, name: e.target.value } : m)),
                      )
                    }
                  />
                  <Input
                    placeholder="Posologie"
                    value={med.dosage}
                    onChange={(e) =>
                      setMeds((prev) =>
                        prev.map((m, i) => (i === index ? { ...m, dosage: e.target.value } : m)),
                      )
                    }
                  />
                  <Input
                    placeholder="Fréquence"
                    value={med.frequency}
                    onChange={(e) =>
                      setMeds((prev) =>
                        prev.map((m, i) => (i === index ? { ...m, frequency: e.target.value } : m)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setMeds((prev) => (prev.length <= 1 ? [emptyMed()] : prev.filter((_, i) => i !== index)))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Observations / conseils
              <textarea
                className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Conseils au patient…"
              />
            </label>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Fermer
              </Button>
              <Button type="submit" className="gap-1.5 bg-teal-800 hover:bg-teal-700" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Enregistrer l&apos;ordonnance
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {lastCreated && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="success">Nouvelle ordonnance</Badge>
                </div>
                {lastCreated.diagnostic && (
                  <p className="text-xs text-muted-foreground">Diagnostic : {lastCreated.diagnostic}</p>
                )}
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-foreground">
                  {lastCreated.contenuOrdonnance}
                </pre>
                {lastCreated.observations && (
                  <p className="mt-2 text-xs text-muted-foreground">{lastCreated.observations}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Ordonnances du patient</h3>
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
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Aucune ordonnance pour ce patient dans votre établissement.
              </p>
            ) : (
              <ul className="max-h-[360px] space-y-3 overflow-y-auto">
                {ordonnances.map((o) => {
                  const id = o.idOrdonnance
                  const loadingPdf = pdfLoadingId === id
                  return (
                    <li
                      key={id || o.numeroOrdonnance || o.datePrescription}
                      className="rounded-xl border border-border/70 bg-muted/10 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {o.numeroOrdonnance || `ORD-${id || "—"}`}
                            </span>
                            <Badge variant={o.statut === "ACTIVE" ? "success" : "secondary"}>
                              {o.statut || "ACTIVE"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(o.datePrescription)}
                            {o.diagnostic ? ` · ${o.diagnostic}` : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          title="Ouvrir l'ordonnance PDF JasperReports (avec code QR)"
                          className="h-9 shrink-0 gap-1.5 border-teal-700/30 bg-teal-50 text-teal-900 hover:bg-teal-100"
                          disabled={!id || loadingPdf}
                          onClick={() => openJasperPdf(id)}
                        >
                          {loadingPdf ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <QrCode className="h-4 w-4" />
                          )}
                          PDF
                        </Button>
                      </div>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-foreground">
                        {o.contenuOrdonnance || "—"}
                      </pre>
                      {o.observations && (
                        <p className="mt-2 text-xs text-muted-foreground">{o.observations}</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setTab("prescribe")}>
                Nouvelle prescription
              </Button>
              <Button type="button" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </AnimatedModal>
  )
}
