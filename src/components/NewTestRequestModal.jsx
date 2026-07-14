import { useEffect, useMemo, useState } from "react"
import {
  X,
  TestTube2,
  User,
  AlertTriangle,
  FileText,
  FlaskConical,
  Send,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { patientService } from "@/services/api"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { cn } from "@/lib/utils"

const TEST_OPTIONS = [
  { value: "CBC", labelKey: "laboratory.tests.cbc" },
  { value: "LIPID", labelKey: "laboratory.tests.lipid" },
  { value: "TSH", labelKey: "laboratory.tests.tsh" },
  { value: "GLU", labelKey: "laboratory.tests.glucose" },
  { value: "UA", labelKey: "laboratory.tests.urinalysis" },
  { value: "BMP", labelKey: "laboratory.tests.bmp" },
]

const PRIORITY_OPTIONS = [
  {
    value: "Routine",
    labelKey: "testRequests.priority.routine",
    descKey: "testRequests.priority.routineDesc",
    tone: "border-border bg-muted/40 hover:border-primary/30 hover:bg-primary/5",
    active: "border-primary bg-primary/10 ring-2 ring-primary/20",
    badge: "secondary",
    icon: FlaskConical,
  },
  {
    value: "Urgent",
    labelKey: "testRequests.priority.urgent",
    descKey: "testRequests.priority.urgentDesc",
    tone: "border-border bg-muted/40 hover:border-warning/40 hover:bg-warning/5",
    active: "border-warning bg-warning/10 ring-2 ring-warning/25",
    badge: "warning",
    icon: AlertTriangle,
  },
  {
    value: "STAT",
    labelKey: "testRequests.priority.stat",
    descKey: "testRequests.priority.statDesc",
    tone: "border-border bg-muted/40 hover:border-destructive/40 hover:bg-destructive/5",
    active: "border-destructive bg-destructive/10 ring-2 ring-destructive/25",
    badge: "destructive",
    icon: Sparkles,
  },
]

const EMPTY_FORM = {
  patientId: "",
  testCode: "",
  priority: "Routine",
  notes: "",
  fastingRequired: false,
}

function patientLabel(p) {
  const name = `${p.prenom || ""} ${p.nom || ""}`.trim() || p.name || "—"
  const code = p.codePatient || `#${p.idPatient ?? p.id}`
  return { name, code, id: String(p._backendId ?? p.idPatient ?? p.id) }
}

export default function NewTestRequestModal({ isOpen, onClose, onSave, saving = false }) {
  const { t } = useI18n()
  const { user, roleKey } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [error, setError] = useState("")

  const selectedPatient = useMemo(
    () => patients.find((p) => patientLabel(p).id === form.patientId),
    [patients, form.patientId],
  )

  const selectedTest = TEST_OPTIONS.find((item) => item.value === form.testCode)

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY_FORM)
    setError("")

    if (user?.idHopital == null) {
      setPatients([])
      setError(t("testRequests.noHospital"))
      return undefined
    }

    let active = true
    setLoadingPatients(true)
    patientService
      .listAccessible(user.idHopital, { roleKey })
      .then((list) => {
        if (!active) return
        setPatients(list || [])
      })
      .catch(() => {
        if (!active) return
        setError(t("testRequests.loadPatientsError"))
      })
      .finally(() => {
        if (active) setLoadingPatients(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, user?.idHopital, roleKey, t])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const validate = () => {
    if (!form.patientId) {
      setError(t("testRequests.errors.patientRequired"))
      return false
    }
    if (!form.testCode) {
      setError(t("testRequests.errors.testRequired"))
      return false
    }
    return true
  }

  const buildPayload = (status) => {
    const pInfo = selectedPatient ? patientLabel(selectedPatient) : null
    return {
      patientNumericId: pInfo?.id || form.patientId,
      patientId: pInfo?.code || form.patientId,
      patientName: pInfo?.name || "—",
      testCode: form.testCode,
      testName: selectedTest ? t(selectedTest.labelKey) : form.testCode,
      priority: form.priority,
      notes: form.notes.trim(),
      fastingRequired: form.fastingRequired,
      status,
    }
  }

  const handleSave = async (sendToLab) => {
    if (!validate()) return
    try {
      await onSave(buildPayload(sendToLab ? "Pending" : "Draft"))
    } catch (err) {
      setError(err?.message || t("testRequests.saveError"))
    }
  }

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-2xl">
      <Card className="overflow-hidden border-0 shadow-2xl shadow-primary/10">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-blue-700 px-6 py-5 text-primary-foreground">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-4 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <TestTube2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  {t("testRequests.modalTitle")}
                </h2>
                <p className="mt-0.5 text-sm text-primary-foreground/80">
                  {t("testRequests.modalSubtitle")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={saving}
              className="h-8 w-8 shrink-0 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="max-h-[min(70vh,640px)] space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("testRequests.sectionPatient")}</p>
                <p className="text-xs text-muted-foreground">{t("testRequests.sectionPatientHint")}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">{t("testRequests.patient")}</label>
                <Select
                  value={form.patientId}
                  onValueChange={(v) => updateField("patientId", v)}
                  disabled={saving || loadingPatients}
                >
                  <SelectTrigger className="mt-1.5 h-11 w-full">
                    <SelectValue placeholder={t("testRequests.selectPatient")} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => {
                      const info = patientLabel(p)
                      return (
                        <SelectItem key={info.id} value={info.id}>
                          {info.name} · {info.code}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {loadingPatients && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t("testRequests.loadingPatients")}
                  </p>
                )}
              </div>

              {selectedPatient && (
                <div className="md:col-span-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
                    {t("testRequests.selectedPatient")}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{patientLabel(selectedPatient).name}</p>
                  <p className="text-xs text-muted-foreground">
                    {patientLabel(selectedPatient).code}
                    {selectedPatient.groupeSanguin ? ` · ${selectedPatient.groupeSanguin}` : ""}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("testRequests.sectionTest")}</p>
                <p className="text-xs text-muted-foreground">{t("testRequests.sectionTestHint")}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("testRequests.testType")}</label>
              <Select
                value={form.testCode}
                onValueChange={(v) => updateField("testCode", v)}
                disabled={saving}
              >
                <SelectTrigger className="mt-1.5 h-11 w-full">
                  <SelectValue placeholder={t("testRequests.selectTest")} />
                </SelectTrigger>
                <SelectContent>
                  {TEST_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50">
              <input
                type="checkbox"
                checked={form.fastingRequired}
                onChange={(e) => updateField("fastingRequired", e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{t("testRequests.fastingRequired")}</p>
                <p className="text-xs text-muted-foreground">{t("testRequests.fastingRequiredHint")}</p>
              </div>
            </label>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("testRequests.sectionPriority")}</p>
                <p className="text-xs text-muted-foreground">{t("testRequests.sectionPriorityHint")}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {PRIORITY_OPTIONS.map((option) => {
                const Icon = option.icon
                const active = form.priority === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={saving}
                    onClick={() => updateField("priority", option.value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all duration-200",
                      active ? option.active : option.tone,
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Icon className={cn("h-4 w-4", active ? "text-foreground" : "text-muted-foreground")} />
                      <Badge variant={option.badge} className="text-[10px]">
                        {t(option.labelKey)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t(option.descKey)}</p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("testRequests.sectionNotes")}</p>
                <p className="text-xs text-muted-foreground">{t("testRequests.sectionNotesHint")}</p>
              </div>
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={4}
              disabled={saving}
              placeholder={t("testRequests.notesPlaceholder")}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </section>
        </CardContent>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/25 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => setForm(EMPTY_FORM)}
            disabled={saving}
            className="text-muted-foreground"
          >
            {t("testRequests.reset")}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("testRequests.saveDraft")}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("testRequests.sendToLab")}
            </Button>
          </div>
        </div>
      </Card>
    </AnimatedModal>
  )
}
