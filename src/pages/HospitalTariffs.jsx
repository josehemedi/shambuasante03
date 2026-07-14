import { useState } from "react"
import { Calculator, RefreshCw, Save } from "lucide-react"
import Swal from "sweetalert2"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { tariffService } from "@/services/api"
import { cn, formatCurrency } from "@/lib/utils"

const CATEGORY_ORDER = [
  "CONSULTATION",
  "EXAMEN",
  "MEDICAMENT",
  "HOSPITALISATION",
  "ACTE_MEDICAL",
  "AUTRE",
]

export default function HospitalTariffs() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)

  const { data: tariffs, loading, error, reload } = useAsync(
    async () => {
      if (user?.idHopital == null) return []
      const list = await tariffService.list()
      return list || []
    },
    [user?.idHopital],
  )

  const rows = (tariffs || []).slice().sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.categorie)
    const cb = CATEGORY_ORDER.indexOf(b.categorie)
    return (ca < 0 ? 99 : ca) - (cb < 0 ? 99 : cb) || String(a.libelle).localeCompare(String(b.libelle))
  })

  const getDraftPrice = (row) => {
    if (drafts[row.idTarif] != null) return drafts[row.idTarif]
    return row.prixUnitaire ?? 0
  }

  const handleSave = async (row) => {
    const price = Number(getDraftPrice(row))
    if (Number.isNaN(price) || price < 0) {
      await Swal.fire({ icon: "warning", title: t("tariffs.invalidPrice") })
      return
    }
    setSavingId(row.idTarif)
    try {
      await tariffService.upsert({
        idTarif: row.idTarif,
        code: row.code,
        libelle: row.libelle,
        categorie: row.categorie,
        prixUnitaire: price,
        actif: row.actif !== false,
      })
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[row.idTarif]
        return next
      })
      reload()
      await Swal.fire({
        icon: "success",
        title: t("tariffs.saved"),
        text: t("tariffs.savedHint"),
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("tariffs.saveError"),
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("tariffs.title")}
        subtitle={t("tariffs.subtitle")}
        actions={
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {t("common.refresh")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            {t("tariffs.gridTitle")}
          </CardTitle>
          <CardDescription>{t("tariffs.gridHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-center text-sm text-destructive">{error.message || t("common.error")}</p>
          ) : loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("tariffs.empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t("tariffs.colLabel")}</th>
                    <th className="px-4 py-3 font-semibold">{t("tariffs.colCategory")}</th>
                    <th className="px-4 py-3 font-semibold">{t("tariffs.colPrice")}</th>
                    <th className="px-4 py-3 font-semibold">{t("tariffs.colStatus")}</th>
                    <th className="px-4 py-3 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const dirty = drafts[row.idTarif] != null
                      && Number(drafts[row.idTarif]) !== Number(row.prixUnitaire)
                    return (
                      <tr key={row.idTarif} className="border-t border-border">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{row.libelle}</p>
                          <p className="text-xs text-muted-foreground">{row.code}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">
                            {t(`tariffs.categories.${row.categorie}`)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex max-w-[160px] items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={getDraftPrice(row)}
                              onChange={(e) =>
                                setDrafts((prev) => ({ ...prev, [row.idTarif]: e.target.value }))
                              }
                            />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatCurrency(Number(getDraftPrice(row)) || 0, lang)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={row.actif === false ? "outline" : "success"}>
                            {row.actif === false ? t("tariffs.inactive") : t("common.active")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            disabled={!dirty || savingId === row.idTarif}
                            onClick={() => handleSave(row)}
                          >
                            <Save className="h-4 w-4" />
                            {t("common.save")}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
