import { useMemo, useState } from "react"
import { AlertTriangle, Copy, Check, Smartphone } from "lucide-react"
import { useI18n } from "@/i18n/I18nProvider"
import { Button } from "@/components/ui/primitives"
import {
  getSuggestedSecureAppUrl,
  needsMobileHttpsForMedia,
} from "@/lib/mediaDevices"

export function MediaSecureContextBanner({ className = "" }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const secureUrl = useMemo(() => getSuggestedSecureAppUrl(), [])
  const show = needsMobileHttpsForMedia() && secureUrl

  if (!show) return null

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(secureUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={`rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-amber-500/5 p-4 text-sm text-amber-950 dark:text-amber-50 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-200">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("tele.mobileHttpsTitle")}
          </p>
          <p className="mt-1.5 text-pretty leading-relaxed opacity-90">{t("tele.mobileHttpsBody")}</p>
          <p className="mt-3 break-all rounded-lg border border-amber-500/30 bg-background/60 px-3 py-2 font-mono text-xs text-foreground">
            {secureUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="gap-2" onClick={copyUrl}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("tele.mobileHttpsCopied") : t("tele.mobileHttpsCopy")}
            </Button>
            <a
              href={secureUrl}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              {t("tele.mobileHttpsOpen")}
            </a>
          </div>
          <p className="mt-2 text-xs opacity-75">{t("tele.mobileHttpsHint")}</p>
        </div>
      </div>
    </div>
  )
}
