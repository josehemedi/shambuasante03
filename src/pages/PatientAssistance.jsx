import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Loader2, MessageSquare, Send } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Field } from "@/components/auth/Field"
import { Button, Card, CardContent } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { patientPortalService } from "@/services/api"

export default function PatientAssistance() {
  const { t } = useI18n()
  const [form, setForm] = useState({ subject: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!form.subject.trim() || !form.description.trim()) {
      setError(t("patientPortal.assistance.formRequired"))
      return
    }
    setSaving(true)
    try {
      await patientPortalService.requestAssistance({
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: "NORMAL",
      })
      setDone(true)
      setForm({ subject: "", description: "" })
    } catch (err) {
      setError(err?.payload?.message || err?.message || t("patientPortal.assistance.submitError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full">
      <PageHeader title={t("patientPortal.assistance.title")} subtitle={t("patientPortal.assistance.subtitle")} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        {done ? (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="flex items-start gap-4 p-6">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
              <div>
                <p className="font-semibold text-foreground">{t("patientPortal.assistance.successTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("patientPortal.assistance.successBody")}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setDone(false)}>
                  {t("patientPortal.assistance.newRequest")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-blue-900/10">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field
                  id="subject"
                  label={t("patientPortal.assistance.subject")}
                  icon={MessageSquare}
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  placeholder={t("patientPortal.assistance.subjectPlaceholder")}
                  required
                />
                <div>
                  <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("patientPortal.assistance.description")}
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder={t("patientPortal.assistance.descriptionPlaceholder")}
                    className="flex w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    required
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="gap-2" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("patientPortal.assistance.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
