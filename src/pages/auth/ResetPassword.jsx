import { useState, useMemo } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Lock, ArrowLeft, Loader2, CheckCircle2, KeyRound } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { AuthShell } from "@/components/auth/AuthShell"
import { PasswordField } from "@/components/auth/Field"
import { Button } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"

function scorePassword(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const strength = useMemo(() => scorePassword(password), [password])
  const strengthLabels = [t("auth.strengthWeak"), t("auth.strengthWeak"), t("auth.strengthFair"), t("auth.strengthGood"), t("auth.strengthStrong")]
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-secondary", "bg-success"]

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!token) {
      setError(t("auth.errorInvalidToken"))
      return
    }
    if (password !== confirm) {
      setError(t("auth.errorMismatch"))
      return
    }
    setLoading(true)
    try {
      await resetPassword({ password, token })
      setDone(true)
      setTimeout(() => navigate("/login", { replace: true }), 2200)
    } catch (err) {
      const key = err?.message
      const translated = key?.startsWith("auth.") ? t(key) : null
      setError(translated || err?.payload?.message || err?.message || t("auth.errorResetFailed"))
      setLoading(false)
    }
  }

  if (!token && !done) {
    return (
      <AuthShell>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("auth.errorInvalidToken")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("auth.errorInvalidTokenHint")}</p>
          <Link to="/forgot-password" className="mt-6 inline-block w-full">
            <Button size="lg" className="w-full">{t("auth.sendResetLink")}</Button>
          </Link>
          <Link
            to="/login"
            className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("auth.backToLogin")}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {done ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
              {t("auth.resetDoneTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
              {t("auth.resetDoneBody")}
            </p>
            <Link to="/login" className="mt-6 inline-block w-full">
              <Button size="lg" className="w-full">{t("auth.backToLogin")}</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
              {t("auth.resetTitle")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
              {t("auth.resetSubtitle")}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
              <div>
                <PasswordField
                  id="password"
                  label={t("auth.newPassword")}
                  icon={Lock}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            i < strength ? strengthColors[strength] : "bg-muted",
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {t("auth.passwordStrength")}: <span className="text-foreground">{strengthLabels[strength]}</span>
                    </p>
                  </div>
                )}
              </div>

              <PasswordField
                id="confirm"
                label={t("auth.confirmPassword")}
                icon={Lock}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading || !password || !confirm}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("auth.updatePassword")}
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("auth.backToLogin")}
            </Link>
          </>
        )}
      </motion.div>
    </AuthShell>
  )
}
