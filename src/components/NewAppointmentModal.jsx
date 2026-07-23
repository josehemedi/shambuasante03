import { useEffect, useMemo, useState } from "react"
import { CalendarPlus, X } from "lucide-react"
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS } from "@/config/roles"
import { medecinService, patientService, resolveAppointmentError } from "@/services/api"

const APPOINTMENT_TYPES = [
  { value: "initial", canal: "PHYSIQUE", labelKey: "appointments.types.initial" },
  { value: "followup", canal: "PHYSIQUE", labelKey: "appointments.types.followup" },
  { value: "checkup", canal: "PHYSIQUE", labelKey: "appointments.types.checkup" },
  { value: "teleconsultation", canal: "TELECONSULTATION", labelKey: "appointments.types.teleconsultation" },
]

const STATUS_OPTIONS = [
  { value: "PROGRAMME", labelKey: "appointments.statuses.programmed" },
  { value: "CONFIRME", labelKey: "appointments.statuses.confirmed" },
]

export default function NewAppointmentModal({ isOpen, onClose, onSave, loading = false, variant = "doctor" }) {
  const { t } = useI18n()
  const { user, roleKey } = useAuth()
  const isReception = variant === "reception"
  const isDoctor = variant === "doctor" || roleKey === ROLE_KEYS.DOCTOR
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("30")
  const [type, setType] = useState("followup")
  const [status, setStatus] = useState("PROGRAMME")
  const [notes, setNotes] = useState("")
  const [motifVisite, setMotifVisite] = useState("")
  const [inscrireFileAttente, setInscrireFileAttente] = useState(true)
  const [patientAccepted, setPatientAccepted] = useState(false)
  const [error, setError] = useState("")

  const selectedType = APPOINTMENT_TYPES.find((item) => item.value === type) || APPOINTMENT_TYPES[1]
  const isTeleconsultation = selectedType.canal === "TELECONSULTATION"

  const selectedPatient = useMemo(
    () => patients.find((p) => String(p._backendId ?? p.id) === patientId),
    [patients, patientId],
  )

  useEffect(() => {
    if (!isOpen) return

    setPatientId("")
    setDoctorId(user?.idMedecin ? String(user.idMedecin) : "")
    setDate("")
    setTime("")
    setDuration("30")
    setType("followup")
    setStatus("PROGRAMME")
    setNotes("")
    setMotifVisite("")
    setInscrireFileAttente(true)
    setPatientAccepted(false)
    setError("")

    if (user?.idHopital == null) {
      setPatients([])
      setDoctors([])
      setError(t("appointments.noHospital"))
      return undefined
    }

    let active = true
    setOptionsLoading(true)

    Promise.all([
      isDoctor
        ? medecinService.getMyPatients()
        : isReception
          ? patientService.getByHopital(user.idHopital)
          : patientService.listAccessible(user.idHopital, { roleKey }),
      isDoctor ? Promise.resolve([]) : medecinService.getAll(),
    ])
      .then(([patientList, doctorList]) => {
        if (!active) return
        setPatients(patientList || [])
        setDoctors(doctorList || [])
        setError("")
      })
      .catch((err) => {
        if (!active) return
        setPatients([])
        setDoctors([])
        setError(err?.message || t("appointments.optionsLoadError"))
      })
      .finally(() => {
        if (active) setOptionsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, isReception, isDoctor, user?.idMedecin, user?.idHopital, roleKey, t])

  useEffect(() => {
    if (isTeleconsultation) {
      setStatus("CONFIRME")
      setInscrireFileAttente(false)
    } else {
      setStatus("PROGRAMME")
      setPatientAccepted(false)
      setInscrireFileAttente(true)
    }
  }, [isTeleconsultation])

  useEffect(() => {
    if (!isReception) return
    const typeLabel = t(selectedType.labelKey)
    setMotifVisite((prev) => (prev === "" || APPOINTMENT_TYPES.some((item) => prev === t(item.labelKey)) ? typeLabel : prev))
  }, [type, isReception, t, selectedType.labelKey])

  const handleSave = async () => {
    if (!patientId || !doctorId || !date || !time) {
      setError(t("appointments.formRequired"))
      return
    }

    if (isDoctor && !patients.some((p) => String(p._backendId ?? p.idPatient ?? p.id) === patientId)) {
      setError(t("appointments.patientNotInHospital"))
      return
    }

    if (isTeleconsultation && !patientAccepted) {
      setError(t("appointments.teleAcceptRequired"))
      return
    }

    if (isTeleconsultation && !selectedPatient?.email) {
      setError(t("appointments.teleEmailRequired"))
      return
    }

    if (isReception && !motifVisite.trim()) {
      setError(t("appointments.reception.motifRequired"))
      return
    }

    setError("")
    try {
      await onSave({
        patientId,
        doctorId,
        date,
        time,
        duration: Number(duration) || 30,
        type,
        canal: selectedType.canal,
        statutRdv: isTeleconsultation ? "CONFIRME" : status,
        motif: t(selectedType.labelKey),
        motifVisite: isReception ? motifVisite.trim() : undefined,
        inscrireFileAttente: isReception ? (isTeleconsultation ? false : inscrireFileAttente) : undefined,
        notes: notes.trim(),
        patientEmail: selectedPatient?.email || null,
      })
    } catch (err) {
      setError(resolveAppointmentError(err, t))
    }
  }

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-2xl">
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b">
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              {isReception ? t("appointments.reception.modalTitle") : t("appointments.modalTitle")}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={loading}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("appointments.patient")}</label>
                {isDoctor && (
                  <p className="mb-1 text-xs text-muted-foreground">{t("appointments.hospitalPatientsHint")}</p>
                )}
                <Select
                  value={patientId || undefined}
                  onValueChange={setPatientId}
                  disabled={loading || optionsLoading || (isDoctor && patients.length === 0)}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue
                      placeholder={
                        isDoctor && patients.length === 0
                          ? t("appointments.noAssignedPatients")
                          : t("appointments.selectPatient")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p._backendId ?? p.id} value={String(p._backendId ?? p.idPatient ?? p.id)}>
                        {[p.prenom, p.nom].filter(Boolean).join(" ").trim() || p.name} ({p.codePatient || p.idPatient || p.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isDoctor && !optionsLoading && patients.length === 0 && (
                  <p className="mt-1 text-xs text-warning">{t("appointments.noAssignedPatients")}</p>
                )}
                {selectedPatient?.email && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("appointments.patientEmail")}: {selectedPatient.email}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("appointments.doctor")}</label>
                {isDoctor ? (
                  <div className="mt-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {user?.name || t("common.loading")}
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("appointments.doctorLockedHint")}</p>
                  </div>
                ) : (
                  <Select
                    value={doctorId || undefined}
                    onValueChange={setDoctorId}
                    disabled={loading || optionsLoading}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder={t("appointments.selectDoctor")} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => {
                        const id = d.idMedecin ?? d.id
                        const name = [d.prenom, d.nom].filter(Boolean).join(" ").trim() || d.nom || `Dr. ${id}`
                        return (
                          <SelectItem key={id} value={String(id)}>
                            Dr. {name}
                            {d.specialite ? ` — ${d.specialite}` : ""}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("appointments.date")}</label>
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
                <label className="text-sm font-medium text-muted-foreground">{t("appointments.time")}</label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("appointments.duration")}</label>
                <Input
                  type="number"
                  min="5"
                  max="480"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("appointments.type")}</label>
                <Select value={type} onValueChange={setType} disabled={loading}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder={t("appointments.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isTeleconsultation && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("appointments.status")}</label>
                  <Select value={status} onValueChange={setStatus} disabled={loading}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {isReception && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("appointments.reception.motifVisite")}
                </label>
                <Input
                  value={motifVisite}
                  onChange={(e) => setMotifVisite(e.target.value)}
                  placeholder={t("appointments.reception.motifPlaceholder")}
                  className="mt-1"
                  disabled={loading}
                  maxLength={255}
                />
                <p className="mt-1 text-xs text-muted-foreground">{t("appointments.reception.motifHint")}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("appointments.notes")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t("appointments.notesPlaceholder")}
                className="mt-1 h-auto w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                disabled={loading}
              />
            </div>

            {isTeleconsultation && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={patientAccepted}
                    onChange={(e) => setPatientAccepted(e.target.checked)}
                    disabled={loading}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <span>{t("appointments.teleAcceptLabel")}</span>
                </label>
                <p className="mt-2 text-xs text-muted-foreground">{t("appointments.teleAcceptHint")}</p>
              </div>
            )}

            {isReception && !isTeleconsultation && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={inscrireFileAttente}
                    onChange={(e) => setInscrireFileAttente(e.target.checked)}
                    disabled={loading}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <span>{t("appointments.reception.queueLabel")}</span>
                </label>
                <p className="mt-2 text-xs text-muted-foreground">{t("appointments.reception.queueHint")}</p>
              </div>
            )}

            {isReception && patientId && doctorId && date && time && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">{t("appointments.reception.recapTitle")}</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt>{t("appointments.reception.fields.idPatient")}</dt>
                  <dd className="text-foreground">{patientId}</dd>
                  <dt>{t("appointments.reception.fields.idMedecin")}</dt>
                  <dd className="text-foreground">{doctorId}</dd>
                  <dt>{t("appointments.reception.fields.dateHeureRdv")}</dt>
                  <dd className="text-foreground">{date} {time}</dd>
                  <dt>{t("appointments.reception.fields.dureeEstimee")}</dt>
                  <dd className="text-foreground">{duration} min</dd>
                  <dt>{t("appointments.reception.fields.motifVisite")}</dt>
                  <dd className="text-foreground">{motifVisite || "—"}</dd>
                  <dt>{t("appointments.reception.fields.canal")}</dt>
                  <dd className="text-foreground">{selectedType.canal}</dd>
                  <dt>{t("appointments.reception.fields.statutRdv")}</dt>
                  <dd className="text-foreground">{isTeleconsultation ? "CONFIRME" : status}</dd>
                </dl>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>

          <div className="flex items-center justify-end gap-2 border-t bg-muted/50 p-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading || optionsLoading || (isDoctor && patients.length === 0)}>
              {loading
                ? t("common.loading")
                : isReception
                  ? t("appointments.reception.saveConfirm")
                  : t("appointments.scheduleConfirm")}
            </Button>
          </div>
        </Card>
    </AnimatedModal>
  )
}
