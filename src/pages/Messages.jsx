import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  MessageSquare,
  Search,
  Send,
  Check,
  CheckCheck,
  RefreshCw,
  Video,
  Stethoscope,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import {
  Card,
  Button,
  Badge,
  Input,
  Avatar,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { useTeleconsultationChat } from "@/hooks/useTeleconsultationChat"
import { patientPortalService } from "@/services/api"
import { getToken } from "@/services/httpClient"
import { cn } from "@/lib/utils"

function formatConversationTime(value, lang) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  const now = new Date()
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  if (sameDay) {
    return date.toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  })
}

export default function Messages() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [selectedRdvId, setSelectedRdvId] = useState(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  const token = getToken()

  const {
    data: conversations,
    loading,
    error,
    reload,
  } = useAsync(() => patientPortalService.getMessageConversations(), [])

  const activeRdvId = selectedRdvId ?? conversations?.[0]?.idRdv ?? null

  const selectedConversation = useMemo(
    () => (conversations || []).find((c) => c.idRdv === activeRdvId) || null,
    [conversations, activeRdvId],
  )

  const tenantId =
    selectedConversation?.idHopital ??
    user?.idHopital ??
    null

  const {
    messages,
    status: chatStatus,
    error: chatError,
    sendMessage,
    reloadHistory,
  } = useTeleconsultationChat({
    idRdv: activeRdvId,
    tenantId,
    token,
    enabled: Boolean(activeRdvId && tenantId && token),
    isDoctor: false,
  })

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations || []
    return (conversations || []).filter(
      (c) =>
        c.doctorName.toLowerCase().includes(q) ||
        (c.motifVisite || "").toLowerCase().includes(q) ||
        (c.lastMessagePreview || "").toLowerCase().includes(q),
    )
  }, [conversations, query])

  const totalUnread = useMemo(
    () => (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations],
  )

  const handleSend = async (event) => {
    event.preventDefault()
    if (!draft.trim() || !activeRdvId || sending) return
    setSending(true)
    const content = draft.trim()
    setDraft("")
    await sendMessage(content)
    setSending(false)
    reload()
  }

  const chatStatusLabel = useMemo(() => {
    if (!activeRdvId) return null
    if (chatStatus === "connected") return t("tele.chatLive")
    if (chatStatus === "connecting") return t("tele.chatConnecting")
    if (chatStatus === "offline") return t("tele.chatOffline")
    return null
  }, [activeRdvId, chatStatus, t])

  return (
    <div>
      <PageHeader
        title={t("nav.messages")}
        subtitle={t("messages.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <Badge variant="primary">{t("messages.unreadCount", { count: totalUnread })}</Badge>
            )}
            <Button variant="outline" onClick={() => { reload(); reloadHistory() }} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="mb-4 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {t("messages.loadError")}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
        <Card className="flex flex-col lg:col-span-2 xl:col-span-2">
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("messages.searchPlaceholder")}
                className="pl-10"
              />
            </div>
          </div>

          <div className="scrollbar-thin max-h-[32rem] flex-1 overflow-y-auto">
            {loading && (
              <p className="p-6 text-center text-sm text-muted-foreground">{t("common.loading")}…</p>
            )}
            {!loading && filteredConversations.length === 0 && (
              <div className="space-y-3 p-6 text-center">
                <Stethoscope className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{t("messages.noConversations")}</p>
                <Link to="/appointments">
                  <Button variant="outline" size="sm">{t("messages.viewAppointments")}</Button>
                </Link>
              </div>
            )}
            {!loading &&
              filteredConversations.map((conv) => {
                const isActive = conv.idRdv === activeRdvId
                return (
                  <button
                    key={conv.idRdv}
                    type="button"
                    onClick={() => setSelectedRdvId(conv.idRdv)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      isActive && "bg-primary/5",
                    )}
                  >
                    <Avatar name={conv.doctorName} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{conv.doctorName}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatConversationTime(conv.lastMessageAt || conv.dateHeureRdv, lang)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{conv.motifVisite || t("tele.doctor")}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {conv.lastMessagePreview || t("messages.startConversation")}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge variant="primary" className="shrink-0">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </button>
                )
              })}
          </div>
        </Card>

        <Card className="flex h-[32rem] flex-col lg:col-span-3 xl:col-span-3">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={selectedConversation.doctorName} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{selectedConversation.doctorName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedConversation.motifVisite || t("messages.teleconsultationThread")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {chatStatusLabel && (
                    <Badge variant={chatStatus === "connected" ? "default" : "secondary"}>
                      {chatStatusLabel}
                    </Badge>
                  )}
                  <Link to={`/teleconsultation?rdv=${activeRdvId}`}>
                    <Button variant="outline" size="sm">
                      <Video className="mr-1.5 h-3.5 w-3.5" />
                      {t("tele.joinSession")}
                    </Button>
                  </Link>
                </div>
              </div>

              <p className="px-4 pt-2 text-xs text-muted-foreground">{t("tele.chatSecure")}</p>

              {chatError && (
                <p className="px-4 pt-2 text-xs text-destructive">{chatError}</p>
              )}

              <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {t("messages.emptyThread")}
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id || `${m.time}-${m.text}`}
                    className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}
                  >
                    {!m.mine && m.senderName && (
                      <span className="mb-1 text-[10px] font-medium text-muted-foreground">{m.senderName}</span>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                        m.mine
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted text-foreground",
                      )}
                    >
                      {m.text}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>{m.time}</span>
                      {m.mine && (
                        <span title={m.readByRecipient ? t("tele.chatRead") : t("tele.chatSent")}>
                          {m.readByRecipient ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("tele.typeMessage")}
                  className="flex-1"
                  disabled={!activeRdvId || sending}
                />
                <Button type="submit" size="icon" aria-label={t("tele.send")} disabled={!activeRdvId || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t("messages.selectConversation")}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
