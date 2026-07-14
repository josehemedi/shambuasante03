import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Mail, ArrowLeft, Loader2, MailCheck, Send } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { AuthShell } from "@/components/auth/AuthShell"
import { Field } from "@/components/auth/Field"
import { Button } from "@/components/ui/primitives"

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const { t } = useI18n()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      const key = err?.message
      const translated = key?.startsWith("auth.") ? t(key) : null
      setError(translated || err?.payload?.message || err?.message || t("auth.errorResetRequest"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 text-success">
              <MailCheck className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
              {t("auth.checkEmailTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
              {t("auth.checkEmailBody")} <span className="font-medium text-foreground">{email}</span>.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{t("auth.checkEmailHint")}</p>

            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 text-sm font-medium text-primary hover:underline"
            >
              {t("auth.resendEmail")}
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {t("auth.forgotTitle")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
              {t("auth.forgotSubtitle")}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
              <Field
                id="email"
                type="email"
                label={t("auth.email")}
                icon={Mail}
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading || !email}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("auth.sendResetLink")}
              </Button>
            </form>
          </>
        )}

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.backToLogin")}
        </Link>
      </motion.div>
    </AuthShell>
  )
}
