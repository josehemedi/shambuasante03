import { motion } from "framer-motion"
import { ShieldCheck, Globe2, Activity } from "lucide-react"
import { useTheme } from "@/theme/ThemeProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { BrandMark } from "@/components/Brand"
import { IconButton } from "@/components/ui/primitives"
import { Moon, Sun } from "lucide-react"

export function AuthShell({ children }) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()

  const highlights = [
    { icon: ShieldCheck, key: "auth.featSecure" },
    { icon: Globe2, key: "auth.featMultisite" },
    { icon: Activity, key: "auth.featRealtime" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand / hero panel — toujours Shambua Santé (pas le nom de l'hôpital) */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src="/images/auth-hero.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-secondary/80" />
        <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
          <BrandMark variant="hero" preferTenant={false} />

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl font-bold leading-tight text-balance"
            >
              {t("auth.heroTitle")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-base leading-relaxed text-primary-foreground/85 text-pretty"
            >
              {t("auth.heroSubtitle")}
            </motion.p>

            <div className="mt-8 space-y-3">
              {highlights.map((h, i) => (
                <motion.div
                  key={h.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
                    <h.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-sm font-medium text-primary-foreground/90">{t(h.key)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-primary-foreground/70">
            {t("auth.copyright")}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
          <LanguageSwitcher />
          <IconButton onClick={toggleTheme} aria-label={t("topbar.toggleTheme")}>
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </IconButton>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <BrandMark preferTenant={false} />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
