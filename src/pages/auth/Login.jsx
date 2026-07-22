import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Mail, Lock, LogIn, Loader2, ChevronRight } from "lucide-react"
import { useAuth, DEMO_PASSWORD } from "@/auth/AuthProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { roleList, ROLE_KEYS } from "@/config/roles"
import { canRoleAccess } from "@/config/navigation"
import { roleHomePath, withRolePath, stripRolePrefix } from "@/config/roleRoutes"
import { AuthShell } from "@/components/auth/AuthShell"
import { Field, PasswordField } from "@/components/auth/Field"
import { Button } from "@/components/ui/primitives"

export default function Login() {
  const { login } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDemos, setShowDemos] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setErrorType("")
    setLoading(true)
    try {
      const { roleKey, tenantAccessRestricted } = await login({ email, password })
      if (roleKey === ROLE_KEYS.HOSPITAL_ADMIN && tenantAccessRestricted) {
        navigate(withRolePath(roleKey, "/my-subscription"), {
          replace: true,
          state: { renewalRequired: true },
        })
        return
      }
      const home = roleHomePath(roleKey)
      let destination = home
      if (from && from !== "/login") {
        const modulePath = stripRolePrefix(from)
        if (canRoleAccess(roleKey, withRolePath(roleKey, modulePath))) {
          destination = withRolePath(roleKey, modulePath)
        }
      }
      navigate(destination, { replace: true })
    } catch (err) {
      const key = err.message
      const translated = t(key)
      const isDisabled = key === "auth.errorAccountDisabled"
      const isSubscriptionLapsed = key === "auth.errorSubscriptionLapsed"
      const isAlreadyLoggedIn = key === "auth.errorAlreadyLoggedIn"
      setErrorType(isDisabled || isSubscriptionLapsed || isAlreadyLoggedIn ? "disabled" : "error")
      setError(translated === key ? (err.message || t("auth.errorBadPassword")) : translated)
      setLoading(false)
    }
  }

  function fillDemo(account) {
    setEmail(account.user.email)
    setPassword(DEMO_PASSWORD)
    setError("")
    setErrorType("")
    setShowDemos(false)
  }

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {t("auth.loginTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("auth.loginSubtitle")}
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

          <div>
            <div className="flex items-center justify-between">
              <span />
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <PasswordField
              id="password"
              label={t("auth.password")}
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            {t("auth.rememberMe")}
          </label>

          {error && (
            <div
              className={
                errorType === "disabled"
                  ? "rounded-xl border border-warning/40 bg-warning/10 px-3 py-3 text-sm text-foreground"
                  : "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
              }
            >
              {errorType === "disabled" && (
                <p className="mb-1 font-semibold text-warning">{t("auth.accountDisabledTitle")}</p>
              )}
              <p>{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {t("auth.signIn")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t("auth.createPatientAccount")}
          </Link>
        </p>

        {/* Demo accounts helper */}
        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-3">
          <button
            type="button"
            onClick={() => setShowDemos((s) => !s)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-xs font-semibold text-foreground">{t("auth.demoAccounts")}</span>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showDemos ? "rotate-90" : ""}`} />
          </button>
          {showDemos && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] text-muted-foreground">
                {t("auth.demoPasswordHint")} <span className="font-mono font-semibold text-foreground">{DEMO_PASSWORD}</span>
              </p>
              {roleList.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => fillDemo(r)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-background"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <r.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">{t(r.labelKey)}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{r.user.email}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AuthShell>
  )
}
