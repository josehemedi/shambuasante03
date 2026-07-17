import { useEffect, useState } from "react"
import { Stethoscope, X } from "lucide-react"
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
import { patientService } from "@/services/api"

const CONSULTATION_TYPES = [
  { value: "initial", labelKey: "workspace.types.initial" },
  { value: "followup", labelKey: "workspace.types.followup" },
  { value: "checkup", labelKey: "workspace.types.checkup" },
  { value: "postop", labelKey: "workspace.types.postop" },
]

export default function NewConsultationModal({ isOpen, onClose, onSave, loading = false, appointments = [] }) {
  const { t } = useI18n()
  const { user, roleKey } = useAuth()
  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [consultationType, setConsultationType] = useState("initial")
  const [appointmentId, setAppointmentId] = useState("")
  const [chiefComplaint, setChiefComplaint] = useState("")
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [bloodPressure, setBloodPressure] = useState("")
  const [temperature, setTemperature] = useState("")
  const [heartRate, setHeartRate] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [treatmentPlan, setTreatmentPlan] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return

    setPatientId("")
    setConsultationType("initial")
    setAppointmentId("")
    setChiefComplaint("")
    setWeight("")
    setHeight("")
    setBloodPressure("")
    setTemperature("")
    setHeartRate("")
    setDiagnosis("")
    setTreatmentPlan("")
    setError("")

    if (user?.idHopital == null) {
      setPatients([])
      setPatientsLoading(false)
      setError(t("workspace.noHospital"))
      return undefined
    }

    let active = true
    setPatientsLoading(true)
    patientService
      .listAccessible(user.idHopital, { roleKey, mine: true })
      .then((list) => {
        if (active) {
          setPatients(list || [])
          setError("")
        }
      })
      .catch((err) => {
        if (active) {
          setPatients([])
          setError(err?.message || t("workspace.patientsLoadError"))
        }
      })
      .finally(() => {
        if (active) setPatientsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, user?.idHopital, roleKey, t])

  const handleSave = async () => {
    if (!patientId || !chiefComplaint.trim()) {
      setError(t("workspace.formRequired"))
      return
    }

    const selectedType = CONSULTATION_TYPES.find((item) => item.value === consultationType)

    setError("")
    try {
      await onSave({
        patientId,
        appointmentId: appointmentId || null,
        consultationType,
        typeLabel: selectedType ? t(selectedType.labelKey) : consultationType,
        chiefComplaint: chiefComplaint.trim(),
        weight: weight.trim(),
        height: height.trim(),
        bloodPressure: bloodPressure.trim(),
        temperature: temperature.trim(),
        heartRate: heartRate.trim(),
        diagnosis: diagnosis.trim(),
        treatmentPlan: treatmentPlan.trim(),
      })
    } catch (err) {
      setError(err?.message || t("workspace.createError"))
    }
  }

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-3xl">
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {t("workspace.modalTitle")}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={loading}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("workspace.patient")}</label>
                <Select
                  value={patientId || undefined}
                  onValueChange={setPatientId}
                  disabled={loading || patientsLoading}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue
                      placeholder={
                        patientsLoading
                          ? t("common.loading")
                          : t("workspace.selectPatient")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.length === 0 && !patientsLoading ? (
                      <SelectItem value="__empty__" disabled>
                        {t("appointments.noAssignedPatients")}
                      </SelectItem>
                    ) : (
                      patients.map((p) => (
                        <SelectItem key={p._backendId ?? p.id} value={String(p._backendId ?? p.id)}>
                          {p.name} ({p.id})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("appointments.assignedPatientsOnly")}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("workspace.consultationType")}</label>
                <Select
                  value={consultationType}
                  onValueChange={setConsultationType}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder={t("workspace.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSULTATION_TYPES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {appointments.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("workspace.linkedAppointment")}</label>
                <Select
                  value={appointmentId || undefined}
                  onValueChange={setAppointmentId}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder={t("workspace.selectAppointment")} />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map((appt) => (
                      <SelectItem key={appt.id} value={String(appt.id)}>
                        {appt.time} — {appt.patientName} ({appt.motif})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("workspace.chiefComplaint")}</label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={2}
                placeholder={t("workspace.chiefComplaintPlaceholder")}
                className="mt-1 h-auto w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">{t("workspace.vitalsSection")}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("workspace.weight")}</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={t("workspace.weightPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("workspace.height")}</label>
                  <Input
                    type="number"
                    min="0"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder={t("workspace.heightPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("workspace.bloodPressure")}</label>
                  <Input
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder={t("workspace.bloodPressurePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("workspace.temperature")}</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder={t("workspace.temperaturePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("workspace.heartRate")}</label>
                  <Input
                    type="number"
                    min="0"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder={t("workspace.heartRatePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("workspace.diagnosis")}</label>
              <Input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder={t("workspace.diagnosisPlaceholder")}
                className="mt-1"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("workspace.observations")}</label>
              <textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                rows={4}
                placeholder={t("workspace.treatmentPlanPlaceholder")}
                className="mt-1 h-auto w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                disabled={loading}
              />
            </div>

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
            <Button onClick={handleSave} disabled={loading || patientsLoading}>
              {loading ? t("common.loading") : t("workspace.saveConsultation")}
            </Button>
          </div>
        </Card>
    </AnimatedModal>
  )
}
