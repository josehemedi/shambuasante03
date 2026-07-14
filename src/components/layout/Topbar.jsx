import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { formatDistanceToNow, parseISO } from "date-fns"
import { enUS, fr } from "date-fns/locale"
import { Bell, Menu, Moon, Search, Sun, LogOut, User, Settings as SettingsIcon } from "lucide-react"
import { useTheme } from "@/theme/ThemeProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useNotifications } from "@/auth/NotificationProvider"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { RoleSwitcher } from "./RoleSwitcher"
import { TenantContextStrip } from "@/components/tenant/TenantBrandingUI"
import { IconButton } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"

function formatNotifTime(createdAt, lang) {
  if (!createdAt) return ""
  try {
    const date = typeof createdAt === "string" ? parseISO(createdAt) : new Date(createdAt)
    return formatDistanceToNow(date, { addSuffix: true, locale: lang === "fr" ? fr : enUS })
  } catch {
    return ""
  }
}

export function Topbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const { t, lang } = useI18n()
  const { user, role, logout } = useAuth()
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function handleNotificationClick(notification) {
    markRead(notification.id)
    setNotifOpen(false)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 lg:px-6">
      <button
        className="rounded-xl p-2 text-muted-foreground hover:bg-muted lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("common.searchEverything")}
          className="h-10 w-full max-w-md rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <TenantContextStrip />

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-1.5">
        <RoleSwitcher />

        <LanguageSwitcher />

        <IconButton onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </IconButton>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <IconButton onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications" className="relative">
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
            )}
          </IconButton>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="glass-strong absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="font-display text-sm font-semibold text-foreground">{t("topbar.notifications")}</p>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t("topbar.markAllRead")}
                    </button>
                  )}
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                      {t("topbar.noNotifications")}
                    </li>
                  ) : (
                    notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                            !n.read && "bg-primary/5",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              n.tone === "destructive" && "bg-destructive",
                              n.tone === "primary" && "bg-primary",
                              n.tone === "success" && "bg-emerald-500",
                              n.tone === "warning" && "bg-warning",
                              n.tone === "secondary" && "bg-secondary",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {lang === "fr" ? n.titleFr : n.title}
                            </p>
                            {(n.message || n.messageFr) && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {lang === "fr" ? n.messageFr || n.message : n.message || n.messageFr}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatNotifTime(n.createdAt, lang)}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="ml-1 flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-muted"
            aria-label="Profile menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {user.initials}
            </span>
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="glass-strong absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border shadow-lg"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <role.icon className="h-3 w-3" />
                    {t(role.labelKey)}
                  </span>
                </div>
                <div className="p-1.5">
                  {[
                    { icon: User, label: t("topbar.myAccount") },
                    { icon: SettingsIcon, label: t("topbar.preferences") },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      logout()
                      navigate("/login", { replace: true })
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("topbar.signOut")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
