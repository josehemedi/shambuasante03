import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Check, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { roleList } from "@/config/roles"
import { useAuth } from "@/auth/AuthProvider"
import { roleHomePath } from "@/config/roleRoutes"
import { useI18n } from "@/i18n/I18nProvider"
import { cn } from "@/lib/utils"
import { USE_LIVE_API } from "@/services/httpClient"

export function RoleSwitcher() {
  const { roleKey, role, setRole } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const RoleIcon = role.icon

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  if (USE_LIVE_API) {
    return null
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        aria-label={t("roles.viewAs")}
      >
        <Eye className="h-4 w-4 text-muted-foreground" />
        <RoleIcon className="h-4 w-4 text-primary" />
        <span className="hidden max-w-[7rem] truncate md:inline">{t(role.labelKey)}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border shadow-lg"
          >
            <div className="border-b border-border px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("roles.viewAs")}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t("roles.previewHint")}</p>
            </div>
            <ul className="p-1.5">
              {roleList.map((r) => {
                const Icon = r.icon
                const active = r.key === roleKey
                return (
                  <li key={r.key}>
                    <button
                      onClick={() => {
                        setRole(r.key)
                        setOpen(false)
                        navigate(roleHomePath(r.key), { replace: true })
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate font-medium">{t(r.labelKey)}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{r.user.name}</span>
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
