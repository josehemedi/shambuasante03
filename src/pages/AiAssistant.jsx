import { useState, useRef, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Send,
  Brain,
  Activity,
  AlertTriangle,
  FileText,
  Stethoscope,
  TrendingUp,
  Shield,
  Zap,
  Pill,
  ClipboardList,
  BookOpen,
  Loader2,
  Bot,
  UserRound,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Input,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useTenantScope } from "@/hooks/useTenantScope"
import { useRolePath } from "@/hooks/useRolePath"
import { TenantScopeBar } from "@/components/TenantScopeBar"
import { aiService, patientService } from "@/services/api"
import { ROLE_KEYS } from "@/config/roles"
import { cn } from "@/lib/utils"

const INSIGHT_ICONS = { risk: AlertTriangle, trend: TrendingUp, diagnosis: Stethoscope, summary: FileText }

const INSIGHT_ACCENTS = {
  destructive: {
    ring: "ring-destructive/20",
    icon: "bg-destructive/12 text-destructive",
    bar: "bg-destructive",
    glow: "from-destructive/10",
  },
  success: {
    ring: "ring-success/25",
    icon: "bg-success/15 text-success",
    bar: "bg-success",
    glow: "from-success/10",
  },
  warning: {
    ring: "ring-warning/25",
    icon: "bg-warning/18 text-warning",
    bar: "bg-warning",
    glow: "from-warning/12",
  },
}

const CAPABILITY_ICONS = {
  diagnosis: Stethoscope,
  drugInteraction: Pill,
  summarize: ClipboardList,
  protocols: BookOpen,
  allergies: AlertTriangle,
  compare_lab: Activity,
  missing: FileText,
  admin: Shield,
  platform: Zap,
}

function SuggestionCard({ text, onClick, index }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border border-border/70 bg-card/80 p-3 text-left",
        "transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-sm",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-sm leading-snug text-foreground">{text}</span>
    </motion.button>
  )
}

function ChatMessage({ message, t, doctorInitials }) {
  const isAssistant = message.role === "assistant"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", !isAssistant && "flex-row-reverse")}
    >
      <div
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold shadow-sm",
          isAssistant
            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
            : "bg-muted text-muted-foreground ring-1 ring-border",
        )}
      >
        {isAssistant ? (
          <>
            <Bot className="h-4 w-4" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
          </>
        ) : (
          <span>{doctorInitials}</span>
        )}
      </div>

      <div className={cn("flex max-w-[85%] flex-col gap-2", !isAssistant && "items-end")}>
        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isAssistant ? t("ai.aiLabel") : t("ai.youLabel")}
        </p>
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isAssistant
              ? "rounded-tl-md border border-border/60 bg-card text-foreground"
              : "rounded-tr-md bg-gradient-to-br from-primary to-primary/90 text-primary-foreground",
          )}
        >
          {isAssistant && (
            <div className="pointer-events-none absolute -left-px top-4 h-8 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
          )}
          {message.text}
        </div>

        {message.sources?.length > 0 && (
          <div className="w-full space-y-1.5 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("ai.sourcesTitle")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((source) => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  <FileText className="h-2.5 w-2.5 text-primary" />
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {message.warnings?.length > 0 && (
          <div className="w-full space-y-1 px-1">
            {message.warnings.map((w) => (
              <p key={w} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
        {message.missingFields?.length > 0 && (
          <p className="px-1 text-[11px] text-rose-600">
            {t("ai.missingFields")}: {message.missingFields.join(", ")}
          </p>
        )}

        {message.confidence != null && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-muted-foreground">{t("ai.confidenceLabel")}</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                style={{ width: `${message.confidence}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-foreground">{message.confidence}%</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ThinkingIndicator({ label }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-border/60 bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function localizePrompt(prompt, lang) {
  if (typeof prompt === "string") return prompt
  if (prompt && typeof prompt === "object") {
    const localized = prompt[lang] || prompt.fr || prompt.en
    if (typeof localized === "string") return localized
  }
  return ""
}

export default function AiAssistant() {
  const { t, lang } = useI18n()
  const { user, roleKey } = useAuth()
  const { hospitalName, hopitalId, hasTenant, scopedSubtitle } = useTenantScope()
  const { go } = useRolePath()
  const [searchParams] = useSearchParams()
  const scrollRef = useRef(null)
  const [thinking, setThinking] = useState(false)
  const [draft, setDraft] = useState("")
  const [aiOnline, setAiOnline] = useState(true)
  const [patientId, setPatientId] = useState(searchParams.get("patientId") || "")
  const [patients, setPatients] = useState([])
  const [apiPrompts, setApiPrompts] = useState([])

  const isDoctor = roleKey === ROLE_KEYS.DOCTOR
  const isAdmin = roleKey === ROLE_KEYS.HOSPITAL_ADMIN
  const isSuper = roleKey === ROLE_KEYS.SUPER_ADMIN

  const doctorName = user?.name || "Dr."
  const doctorInitials = useMemo(() => {
    const parts = doctorName.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    return doctorName.slice(0, 2).toUpperCase()
  }, [doctorName])

  const initialGreeting = useMemo(
    () => t("ai.greetingNamed", { name: doctorName }),
    [t, doctorName],
  )

  const [messages, setMessages] = useState([{ id: 1, role: "assistant", text: initialGreeting }])

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== "assistant") return prev
      return [{ ...prev[0], text: initialGreeting }]
    })
  }, [initialGreeting])

  useEffect(() => {
    if (!isDoctor) return
    let cancelled = false
    patientService
      .listAccessible(hopitalId, { roleKey })
      .then((list) => {
        if (!cancelled) setPatients(list || [])
      })
      .catch(() => {
        if (!cancelled) setPatients([])
      })
    return () => {
      cancelled = true
    }
  }, [isDoctor, hopitalId, roleKey])

  useEffect(() => {
    let cancelled = false
    aiService
      .getSuggestedPrompts()
      .then((list) => {
        if (!cancelled && Array.isArray(list) && list.length) setApiPrompts(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const suggestions = useMemo(() => {
    const fromApi = apiPrompts
      .map((prompt) => localizePrompt(prompt, lang))
      .filter(Boolean)
    if (fromApi.length > 0) return fromApi
    return [t("ai.suggest1"), t("ai.suggest2"), t("ai.suggest3"), t("ai.suggest4")]
      .map((prompt) => localizePrompt(prompt, lang))
      .filter(Boolean)
  }, [apiPrompts, lang, t])

  const insights = [
    { id: 1, type: "risk", title: t("ai.insightRiskTitle"), desc: t("ai.insightRiskDesc"), tone: "destructive", metric: "3" },
    { id: 2, type: "trend", title: t("ai.insightTrendTitle"), desc: t("ai.insightTrendDesc"), tone: "success", metric: "+12%" },
    { id: 3, type: "diagnosis", title: t("ai.insightDxTitle"), desc: t("ai.insightDxDesc"), tone: "warning", metric: "2" },
  ]

  const capabilities = isDoctor
    ? [
        { key: "summarize", label: t("ai.summarize") },
        { key: "allergies", label: t("ai.allergies") },
        { key: "protocols", label: t("ai.protocols") },
        { key: "compare_lab", label: t("ai.compareLab") },
        { key: "missing", label: t("ai.missingInfo") },
        { key: "drugInteraction", label: t("ai.drugInteraction") },
      ]
    : isAdmin
      ? [
          { key: "admin-docs", analysisType: "admin", label: t("ai.adminDocs") },
          { key: "admin-usage", analysisType: "admin", label: t("ai.adminUsage") },
          { key: "admin-quota", analysisType: "admin", label: t("ai.adminQuota") },
          { key: "admin-errors", analysisType: "admin", label: t("ai.adminErrors") },
        ]
      : [
          { key: "plat-status", analysisType: "platform", label: t("ai.platformStatus") },
          { key: "plat-usage", analysisType: "platform", label: t("ai.platformUsage") },
          { key: "plat-plans", analysisType: "platform", label: t("ai.platformPlans") },
          { key: "plat-errors", analysisType: "platform", label: t("ai.platformErrors") },
        ]

  useEffect(() => {
    let cancelled = false
    aiService
      .getStatus()
      .then((status) => {
        if (!cancelled) setAiOnline(Boolean(status?.available))
      })
      .catch(() => {
        if (!cancelled) setAiOnline(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, thinking])

  async function ask(text, analysisType) {
    const question = (text ?? draft).trim()
    if (!question || thinking) return
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: question }])
    setDraft("")
    setThinking(true)

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.text }))

    try {
      const res = await aiService.sendMessage({
        message: question,
        analysisType,
        history,
        patientId: isDoctor && patientId ? patientId : undefined,
      })
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: res.content || t("ai.errorEmpty"),
          sources: res.sources?.length
            ? res.sources
            : [
                t("ai.sourceTenantRecords", { hospital: hospitalName }),
                t("ai.history"),
                hopitalId != null ? `#T-${hopitalId}` : t("tenant.saasBadge"),
              ],
          confidence: res.confidence ?? 88,
          warnings: res.warnings,
          missingFields: res.missingFields,
        },
      ])
      setAiOnline(true)
    } catch {
      setAiOnline(false)
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: t("ai.errorUnavailable"),
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    if (e.nativeEvent?.isComposing || e.keyCode === 229) return
    ask()
  }

  const showSuggestions = messages.length <= 1 && !thinking

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[oklch(0.42_0.16_252)] via-primary to-accent p-6 text-primary-foreground shadow-xl shadow-primary/25 lg:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-3">
            <Badge className="border-white/20 bg-white/15 text-primary-foreground backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {t("ai.heroBadge")}
            </Badge>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">{t("ai.title")}</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-primary-foreground/85">
                {hasTenant ? scopedSubtitle("ai.subtitleTenant") : t("ai.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">
                <Shield className="h-3.5 w-3.5" />
                {t("ai.secureLabel")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                {t("ai.responseTime")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs backdrop-blur-sm">
                <span className={cn("h-1.5 w-1.5 rounded-full", aiOnline ? "animate-pulse bg-emerald-300" : "bg-muted-foreground")} />
                {aiOnline ? t("ai.online") : t("ai.offline")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-xl lg:grid-cols-3">
            {capabilities.map(({ key, label, analysisType }) => {
              const Icon = CAPABILITY_ICONS[analysisType || key] || Sparkles
              const type = analysisType || key
              return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => ask(label, type)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") ask(label, type)
                    }}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm transition hover:bg-white/20 cursor-pointer"
                  >
                  <Icon className="mb-1.5 h-4 w-4 text-primary-foreground/90" />
                  <p className="text-[11px] font-medium leading-tight text-primary-foreground/95">{label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </motion.section>

      <TenantScopeBar />

      {isDoctor && (
        <Card className="border-primary/15">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <UserRound className="h-4 w-4 text-primary" />
              {t("ai.selectPatient")}
            </div>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm sm:max-w-md"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              <option value="">{t("ai.noPatient")}</option>
              {patients.map((p) => (
                <option key={p.idPatient || p._backendId} value={p.idPatient || p._backendId}>
                  {p.name || `${p.prenom || ""} ${p.nom || ""}`.trim() || p.codePatient || `#${p.idPatient}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t("ai.patientRagHint")}</p>
          </CardContent>
        </Card>
      )}

      {(isAdmin || isSuper) && (
        <Card className="border-amber-200/70 bg-amber-50/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-amber-900">
            <span>{isSuper ? t("ai.superRagHint") : t("ai.adminRagHint")}</span>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white"
              onClick={() => go("/rag-admin")}
            >
              {t("nav.ragAdmin")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card className="flex min-h-[34rem] flex-col overflow-hidden border-border/80 shadow-lg shadow-primary/5 xl:min-h-[calc(100vh-22rem)]">
            <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/50 via-card to-muted/30 pb-4">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md shadow-primary/25">
                    <Brain className="h-5 w-5" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t("ai.chatTitle")}</CardTitle>
                    <CardDescription className="mt-0.5">{t("ai.chatModel")}</CardDescription>
                  </div>
                </div>
                <Badge variant={aiOnline ? "success" : "secondary"} className="w-fit gap-1.5 px-3 py-1">
                  <span className="relative flex h-2 w-2">
                    {aiOnline && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                    )}
                    <span className={cn("relative inline-flex h-2 w-2 rounded-full", aiOnline ? "bg-success" : "bg-muted-foreground")} />
                  </span>
                  {aiOnline ? t("ai.online") : t("ai.offline")}
                </Badge>
              </div>
            </CardHeader>

            <div
              ref={scrollRef}
              className="scrollbar-thin relative flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-background via-background to-muted/20 px-4 py-5 sm:px-6"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    t={t}
                    doctorInitials={doctorInitials}
                  />
                ))}
              </AnimatePresence>

              {thinking && <ThinkingIndicator label={t("ai.thinking")} />}
            </div>

            {showSuggestions && (
              <div className="border-t border-border/60 bg-muted/15 px-4 py-4 sm:px-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("ai.suggested")}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {suggestions.map((s, index) => (
                    <SuggestionCard key={`suggest-${index}`} text={s} index={index} onClick={() => ask(s)} />
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="border-t border-border/60 bg-card/95 p-4 backdrop-blur-sm sm:px-6"
            >
              <div className="flex items-end gap-2 rounded-2xl border border-border/80 bg-background p-2 shadow-inner focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("ai.placeholder")}
                  className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  disabled={thinking}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={thinking || !draft.trim()}
                  className="h-10 w-10 shrink-0 rounded-xl shadow-md shadow-primary/20"
                  aria-label={t("ai.send")}
                >
                  {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                {t("ai.insightsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {insights.map((ins, index) => {
                const Icon = INSIGHT_ICONS[ins.type] || Activity
                const accent = INSIGHT_ACCENTS[ins.tone] || INSIGHT_ACCENTS.warning
                return (
                  <motion.div
                    key={ins.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border border-border/70 p-4 transition-all hover:shadow-md",
                      "ring-1 ring-inset",
                      accent.ring,
                    )}
                  >
                    <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-70", accent.glow)} />
                    <div className={cn("absolute left-0 top-0 h-full w-1", accent.bar)} />
                    <div className="relative flex items-start gap-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", accent.icon)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                          <span className="shrink-0 rounded-lg bg-background/80 px-2 py-0.5 font-display text-sm font-bold text-foreground">
                            {ins.metric}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ins.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/80">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="text-base">{t("ai.capabilitiesTitle")}</CardTitle>
              <CardDescription>{t("ai.capabilitiesSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1">
              {capabilities.map(({ key, label, analysisType }) => {
                const Icon = CAPABILITY_ICONS[analysisType || key] || Sparkles
                const type = analysisType || key
                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => ask(label, type)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") ask(label, type)
                    }}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 cursor-pointer transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-accent/5">
            <CardContent className="space-y-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{t("ai.disclaimerTitle")}</CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("ai.disclaimer")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
