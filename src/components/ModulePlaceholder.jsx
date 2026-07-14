import { Construction } from "lucide-react"
import { PageHeader } from "./PageHeader"
import { useI18n } from "@/i18n/I18nProvider"
import { Card } from "@/components/ui/primitives"

export function ModulePlaceholder({ titleKey, subtitle, icon: Icon = Construction, features = [] }) {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t(titleKey)} subtitle={subtitle} />
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-8 w-8" />
          </div>
          <div className="max-w-md">
            <h3 className="font-display text-lg font-semibold text-foreground">{t("common.comingSoon")}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{t("common.moduleInProgress")}</p>
          </div>
          {features.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {features.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
