import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown, Globe } from "lucide-react"
import { useI18n } from "@/i18n/I18nProvider"
import { cn } from "@/lib/utils"

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = languages.find((l) => l.code === lang) || languages.find((l) => l.code === "fr") || languages[0]

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline">{current.flag}</span>
        <span className="hidden uppercase md:inline">{current.code}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border shadow-lg"
          >
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="text-base">{l.flag}</span>
                <span className="flex-1 text-left font-medium text-foreground">{l.label}</span>
                {lang === l.code && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
