import { useState } from "react"
import { Loader2, X } from "lucide-react"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { Button, Card, Input } from "@/components/ui/primitives"

export default function PrescriptionFromConsultationModal({
  open,
  onClose,
  patientName,
  diagnostic = "",
  onSave,
}) {
  const [contenu, setContenu] = useState("")
  const [observations, setObservations] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!contenu.trim()) {
      setError("Le contenu de l'ordonnance est obligatoire.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await onSave?.({
        contenuOrdonnance: contenu.trim(),
        observations: observations.trim(),
        diagnostic,
      })
      setContenu("")
      setObservations("")
      onClose?.()
    } catch (err) {
      setError(err?.message || "Impossible d'enregistrer l'ordonnance.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatedModal open={open} onClose={onClose} contentClassName="max-w-xl" zIndex={10000}>
      <Card as="form" onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-semibold">Nouvelle ordonnance</h2>
            <p className="text-sm text-muted-foreground">{patientName || "Patient"}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 p-4">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <label className="block space-y-1 text-xs font-medium">
            Contenu de l&apos;ordonnance
            <textarea
              className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder={"1) Paracétamol 1g — 1 cp × 3/j × 5 j\n2) ..."}
            />
          </label>
          <label className="block space-y-1 text-xs font-medium">
            Observations
            <Input value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Conseils…" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </div>
      </Card>
    </AnimatedModal>
  )
}
