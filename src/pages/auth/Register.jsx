import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
  UserPlus,
  Lock,
  CheckCircle2,
} from "lucide-react"
import { AuthShell } from "@/components/auth/AuthShell"
import { Field, PasswordField } from "@/components/auth/Field"
import { Button, Input } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { patientPortalService } from "@/services/api"
import { cn } from "@/lib/utils"

export default function Register() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [query, setQuery] = useState("")
  const [hospitals, setHospitals] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    sexe: "",
    dateNaissance: "",
    email: "",
    password: "",
    telephone: "",
    adresse: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (step !== 1) return
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const list = await patientPortalService.searchHospitals(query.trim())
        setHospitals(list)
      } catch {
        setHospitals([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, step])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!selectedHospital?.idHopital) {
      setError(t("auth.registerHospitalRequired"))
      return
    }
    if (!form.nom || !form.prenom || !form.sexe || !form.dateNaissance || !form.email || !form.password) {
      setError(t("auth.registerFormRequired"))
      return
    }
    if (form.password.length < 8) {
      setError(t("auth.errorPasswordTooShort"))
      return
    }
    setLoading(true)
    try {
      const response = await patientPortalService.register({
        idHopital: selectedHospital.idHopital,
        ...form,
      })
      setResult(response)
      setDone(true)
    } catch (err) {
      setError(err?.payload?.message || err?.message || t("auth.registerError"))
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthShell>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
            {t("auth.registerDoneTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {result?.message || t("auth.registerDoneBody")}
          </p>
          {result?.codePatient && (
            <p className="mt-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              {t("auth.registerPatientCode")}:{" "}
              <span className="font-mono font-semibold text-foreground">{result.codePatient}</span>
            </p>
          )}
          <Button className="mt-6 w-full" size="lg" onClick={() => navigate("/login", { replace: true })}>
            {t("auth.signIn")}
          </Button>
        </motion.div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link
          to="/login"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.backToLogin")}
        </Link>

        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {t("auth.registerTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.registerSubtitle")}</p>

        <div className="mt-5 flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                step >= s ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        {step === 1 ? (
          <div className="mt-7 space-y-4">
            <p className="text-sm font-medium text-foreground">{t("auth.registerStepHospital")}</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("auth.registerHospitalSearch")}
                className="h-11 pl-9"
              />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
              {searching ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : hospitals.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("auth.registerNoHospitals")}</p>
              ) : (
                hospitals.map((h) => (
                  <button
                    key={h.idHopital}
                    type="button"
                    onClick={() => setSelectedHospital(h)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                      selectedHospital?.idHopital === h.idHopital
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted/60",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">{h.nom}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {[h.ville, h.pays].filter(Boolean).join(" · ") || h.adresse || "—"}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!selectedHospital}
              onClick={() => setStep(2)}
            >
              {t("auth.registerContinue")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            {selectedHospital && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
                <span className="font-medium text-foreground">{selectedHospital.nom}</span>
                <button
                  type="button"
                  className="ml-2 text-xs font-medium text-primary hover:underline"
                  onClick={() => setStep(1)}
                >
                  {t("auth.registerChangeHospital")}
                </button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="nom"
                label={t("auth.registerLastName")}
                icon={User}
                value={form.nom}
                onChange={(e) => updateField("nom", e.target.value)}
                required
              />
              <Field
                id="prenom"
                label={t("auth.registerFirstName")}
                icon={User}
                value={form.prenom}
                onChange={(e) => updateField("prenom", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sexe" className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("auth.registerGender")}
                </label>
                <select
                  id="sexe"
                  value={form.sexe}
                  onChange={(e) => updateField("sexe", e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  required
                >
                  <option value="">{t("auth.registerGenderSelect")}</option>
                  <option value="M">{t("auth.registerGenderM")}</option>
                  <option value="F">{t("auth.registerGenderF")}</option>
                </select>
              </div>
              <Field
                id="dateNaissance"
                type="date"
                label={t("auth.registerBirthDate")}
                icon={Calendar}
                value={form.dateNaissance}
                onChange={(e) => updateField("dateNaissance", e.target.value)}
                required
              />
            </div>

            <Field
              id="email"
              type="email"
              label={t("auth.email")}
              icon={Mail}
              placeholder={t("auth.emailPlaceholder")}
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              autoComplete="email"
              required
            />

            <PasswordField
              id="password"
              label={t("auth.password")}
              icon={Lock}
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              autoComplete="new-password"
              required
            />

            <Field
              id="telephone"
              type="tel"
              label={t("auth.registerPhone")}
              icon={Phone}
              value={form.telephone}
              onChange={(e) => updateField("telephone", e.target.value)}
            />

            <Field
              id="adresse"
              label={t("auth.registerAddress")}
              icon={MapPin}
              value={form.adresse}
              onChange={(e) => updateField("adresse", e.target.value)}
            />

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                {t("common.back")}
              </Button>
              <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {t("auth.registerSubmit")}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </AuthShell>
  )
}
