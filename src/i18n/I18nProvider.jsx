import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import { translations } from "./translations"

const I18nContext = createContext(null)

const STORAGE_KEY = "shambua-lang"

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === "undefined") return "fr"
    return window.localStorage.getItem(STORAGE_KEY) || "fr"
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (path, params) => {
      const parts = path.split(".")
      let node = translations[lang]
      for (const p of parts) {
        node = node?.[p]
        if (node === undefined) break
      }
      if (node === undefined) {
        let fallback = translations.en
        for (const p of parts) fallback = fallback?.[p]
        node = fallback ?? path
      }
      if (params && typeof node === "string") {
        return Object.entries(params).reduce(
          (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), String(value ?? "")),
          node,
        )
      }
      return node
    },
    [lang],
  )

  const value = useMemo(
    () => ({ lang, setLang, t, locale: lang }),
    [lang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
