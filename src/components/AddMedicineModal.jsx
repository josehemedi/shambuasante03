import { useEffect, useMemo, useState } from "react"
import { Pill, X } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { AnimatedModal } from "@/components/ui/AnimatedModal"

const FORME_KEYS = ["comprime", "gelule", "sirop", "injection", "pommade", "inhalateur", "autre"]
const UNITE_KEYS = ["boite", "flacon", "ampoule", "unite", "plaquette"]

const EMPTY_FORM = {
  nomMedicament: "",
  nomGenerique: "",
  categorie: "",
  dosage: "",
  forme: "",
  unite: "",
  quantiteStock: 0,
  stockMinimum: 0,
  prixAchat: "",
  prixVente: "",
  numeroLot: "",
  dateExpiration: "",
  fournisseur: "",
}

export default function AddMedicineModal({ isOpen, onClose, onSave, loading = false }) {
  const { t } = useI18n()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState("")

  const formeOptions = useMemo(
    () => FORME_KEYS.map((key) => ({ value: key, label: t(`pharmacy.modal.formes.${key}`) })),
    [t],
  )

  const uniteOptions = useMemo(
    () => UNITE_KEYS.map((key) => ({ value: key, label: t(`pharmacy.modal.unites.${key}`) })),
    [t],
  )

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY_FORM)
    setError("")
  }, [isOpen])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    updateField(name, type === "number" ? (value === "" ? "" : Number(value)) : value)
  }

  const handleSave = async () => {
    if (!form.nomMedicament.trim()) {
      setError(t("pharmacy.modal.requiredFields"))
      return
    }

    setError("")
    try {
      await onSave({ ...form })
    } catch (err) {
      setError(err?.message || t("pharmacy.createError"))
    }
  }

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-4xl">
        <Card className="max-h-[92vh] overflow-hidden">
          <CardHeader className="flex-row items-center justify-between border-b">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              {t("pharmacy.modal.title")}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={loading}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="max-h-[calc(92vh-8rem)] space-y-5 overflow-y-auto p-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("pharmacy.modal.identitySection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.nomMedicament")} *</label>
                  <Input
                    name="nomMedicament"
                    value={form.nomMedicament}
                    onChange={handleInputChange}
                    placeholder={t("pharmacy.modal.nomMedicamentPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.nomGenerique")}</label>
                  <Input
                    name="nomGenerique"
                    value={form.nomGenerique}
                    onChange={handleInputChange}
                    placeholder={t("pharmacy.modal.nomGeneriquePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.categorie")}</label>
                  <Input
                    name="categorie"
                    value={form.categorie}
                    onChange={handleInputChange}
                    placeholder={t("pharmacy.modal.categoriePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("pharmacy.modal.formulationSection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.dosage")}</label>
                  <Input
                    name="dosage"
                    value={form.dosage}
                    onChange={handleInputChange}
                    placeholder={t("pharmacy.modal.dosagePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.forme")}</label>
                  <Select value={form.forme || undefined} onValueChange={(value) => updateField("forme", value)} disabled={loading}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {formeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.unite")}</label>
                  <Select value={form.unite || undefined} onValueChange={(value) => updateField("unite", value)} disabled={loading}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniteOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("pharmacy.modal.stockSection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.quantiteStock")}</label>
                  <Input
                    name="quantiteStock"
                    type="number"
                    min="0"
                    value={form.quantiteStock}
                    onChange={handleInputChange}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.stockMinimum")}</label>
                  <Input
                    name="stockMinimum"
                    type="number"
                    min="0"
                    value={form.stockMinimum}
                    onChange={handleInputChange}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("pharmacy.modal.pricingSection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.prixAchat")}</label>
                  <Input
                    name="prixAchat"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prixAchat}
                    onChange={handleInputChange}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.prixVente")}</label>
                  <Input
                    name="prixVente"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prixVente}
                    onChange={handleInputChange}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("pharmacy.modal.traceabilitySection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.numeroLot")}</label>
                  <Input
                    name="numeroLot"
                    value={form.numeroLot}
                    onChange={handleInputChange}
                    placeholder={t("pharmacy.modal.numeroLotPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.dateExpiration")}</label>
                  <Input
                    name="dateExpiration"
                    type="date"
                    value={form.dateExpiration}
                    onChange={handleInputChange}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("pharmacy.modal.fournisseur")}</label>
                  <Input
                    name="fournisseur"
                    value={form.fournisseur}
                    onChange={handleInputChange}
                    placeholder={t("pharmacy.modal.fournisseurPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t("pharmacy.modal.autoFieldsHint")}</p>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>

          <div className="flex justify-end border-t p-4">
            <Button variant="outline" onClick={onClose} className="mr-2" disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t("common.saving") : t("pharmacy.modal.save")}
            </Button>
          </div>
        </Card>
    </AnimatedModal>
  )
}
