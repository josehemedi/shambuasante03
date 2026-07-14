import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import { Settings, X } from "lucide-react"
import { getNavForRole } from "@/config/navigation"
import { roleHomePath } from "@/config/roleRoutes"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useSubscription } from "@/auth/SubscriptionProvider"
import { ROLE_KEYS } from "@/config/roles"
import { BrandMark } from "@/components/Brand"
import { TenantSidebarBadge } from "@/components/tenant/TenantBrandingUI"
import { cn } from "@/lib/utils"

export function Sidebar({ mobileOpen, onClose }) {
  const { t } = useI18n()
  const { user, role } = useAuth()
  const home = roleHomePath(role.key)
  const { features, loading: subscriptionLoading } = useSubscription()
  const navSections = getNavForRole(
    role.key,
    role.key === ROLE_KEYS.HOSPITAL_ADMIN && !subscriptionLoading && features.length ? features : null,
  )
  const RoleIcon = role.icon

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <BrandMark />
          <button
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-2">
          <TenantSidebarBadge />
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <RoleIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{t(role.labelKey)}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.tenantLabel}</p>
            </div>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.group}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {t(`nav.${section.group}`)}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.key}>
                      <NavLink
                        to={item.path}
                        end={item.modulePath === "/" || item.path === home}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.span
                                layoutId="sidebar-active"
                                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                              />
                            )}
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                            <span className="flex-1 truncate">{t(item.labelKey)}</span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                  item.badge === "Live"
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-accent/20 text-accent-foreground",
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Settings className="h-[18px] w-[18px]" />
            {t("nav.settings")}
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.title}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
