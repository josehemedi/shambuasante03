import { useEffect, useState } from "react"
import { Video } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { patientService } from "@/services/api"

const DURATION_OPTIONS = [15, 20, 30, 45, 60]

export default function ScheduleTeleconsultationModal({ isOpen, onClose, onSave, loading = false }) {
  const { t } = useI18n()
  const { user, roleKey } = useAuth()
  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("30")
  const [motif, setMotif] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setPatientId("")
    setDate("")
    setTime("")
    setDuration("30")
    setMotif("")
    setNotes("")
    setError("")

    let active = true
    setPatientsLoading(true)
    const hopitalId = user?.idHopital
    if (hopitalId == null) {
      setPatients([])
      setPatientsLoading(false)
      return () => {
        active = false
      }
    }

    const loadPatients = patientService.listAccessible(hopitalId, { roleKey })

    loadPatients
      .then((list) => {
        if (active) setPatients(list || [])
      })
      .catch(() => {
        if (active) setPatients([])
      })
      .finally(() => {
        if (active) setPatientsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, user?.idHopital, roleKey])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!patientId || !date || !time || !motif.trim()) {
      setError(t("tele.scheduleRequired"))
      return
    }
    setError("")
    try {
      await onSave({
        patientId,
        date,
        time,
        duration: Number(duration) || 30,
        motif: motif.trim(),
        notes: notes.trim(),
      })
    } catch (err) {
      setError(err?.message || t("tele.scheduleError"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            {t("tele.scheduleModalTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("tele.schedulePatient")}</label>
            <Select value={patientId} onValueChange={setPatientId} disabled={loading || patientsLoading}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("tele.scheduleSelectPatient")} />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p._backendId ?? p.id} value={String(p._backendId ?? p.id)}>
                    {p.name} ({p.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("tele.scheduleDate")}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("tele.scheduleTime")}</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("tele.scheduleDuration")}</label>
            <Select value={duration} onValueChange={setDuration} disabled={loading}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((min) => (
                  <SelectItem key={min} value={String(min)}>
                    {min} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("tele.scheduleMotif")}</label>
            <Input
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={t("tele.scheduleMotifPlaceholder")}
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("tele.scheduleNotes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("tele.scheduleNotesPlaceholder")}
              className="mt-1 h-auto w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || patientsLoading}>
              {loading ? t("common.loading") : t("tele.scheduleConfirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
