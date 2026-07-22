import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Mail, MapPin, Phone, Save, User, UserCog } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Field } from "@/components/auth/Field"
import { Button, Card, CardContent } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { patientPortalService } from "@/services/api"

export default function PatientAccount() {
  const { t, locale } = useI18n()
  const { data: profile, loading, error, reload } = useAsync(() => patientPortalService.getProfile(), [])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [saveError, setSaveError] = useState("")

  const active = form ?? profile

  function startEdit() {
    if (!profile) return
    setForm({
      email: profile.email || "",
      telephone: profile.telephone || "",
      adresse: profile.adresse || "",
      contactUrgence: profile.contactUrgence || "",
      profession: profile.profession || "",
    })
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...(prev || {}), [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveError("")
    setMessage("")
    setSaving(true)
    try {
      await patientPortalService.updateProfile(form)
      setMessage(t("patientPortal.account.saved"))
      setForm(null)
      reload()
    } catch (err) {
      setSaveError(err?.payload?.message || err?.message || t("patientPortal.account.saveError"))
    } finally {
      setSaving(false)
    }
  }

  function formatDate(value) {
    if (!value) return "—"
    const d = new Date(value)
    return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")
  }

  return (
    <div className="min-h-full">
      <PageHeader title={t("patientPortal.account.title")} subtitle={t("patientPortal.account.subtitle")} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("patientPortal.account.loadError")}
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
            <Card className="border-blue-900/10 bg-gradient-to-br from-blue-50/80 to-white">
              <CardContent className="p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-800 text-white shadow-lg">
                  <UserCog className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[#0b1f4a]">
                  {profile?.prenom} {profile?.nom}
                </h2>
                <p className="mt-1 font-mono text-xs text-blue-800/60">{profile?.codePatient}</p>
                <dl className="mt-5 space-y-3 text-sm">
                  <div>
                    <dt className="text-blue-800/50">{t("patientPortal.account.birthDate")}</dt>
                    <dd className="font-medium text-[#0b1f4a]">{formatDate(profile?.dateNaissance)}</dd>
                  </div>
                  <div>
                    <dt className="text-blue-800/50">{t("patientPortal.account.gender")}</dt>
                    <dd className="font-medium text-[#0b1f4a]">{profile?.sexe || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-blue-800/50">{t("patientPortal.account.bloodGroup")}</dt>
                    <dd className="font-medium text-[#0b1f4a]">{profile?.groupeSanguin || "—"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-4">
                  <Field
                    id="email"
                    type="email"
                    label={t("auth.email")}
                    icon={Mail}
                    value={active?.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    onFocus={startEdit}
                    disabled={!form && !profile}
                  />
                  <Field
                    id="telephone"
                    label={t("auth.registerPhone")}
                    icon={Phone}
                    value={active?.telephone || ""}
                    onChange={(e) => updateField("telephone", e.target.value)}
                    onFocus={startEdit}
                  />
                  <Field
                    id="adresse"
                    label={t("auth.registerAddress")}
                    icon={MapPin}
                    value={active?.adresse || ""}
                    onChange={(e) => updateField("adresse", e.target.value)}
                    onFocus={startEdit}
                  />
                  <Field
                    id="contactUrgence"
                    label={t("patientPortal.account.emergencyContact")}
                    icon={User}
                    value={active?.contactUrgence || ""}
                    onChange={(e) => updateField("contactUrgence", e.target.value)}
                    onFocus={startEdit}
                  />
                  <Field
                    id="profession"
                    label={t("patientPortal.account.profession")}
                    icon={User}
                    value={active?.profession || ""}
                    onChange={(e) => updateField("profession", e.target.value)}
                    onFocus={startEdit}
                  />

                  {saveError && (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {saveError}
                    </p>
                  )}
                  {message && (
                    <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                      {message}
                    </p>
                  )}

                  <Button type="submit" disabled={!form || saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t("patientPortal.account.save")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
