import { useEffect, useState } from "react"
import { UserPlus, X } from "lucide-react"
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { AnimatedModal } from "@/components/ui/AnimatedModal"

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  sexe: "M",
  dateNaissance: "",
  groupeSanguin: "",
  adresse: "",
  telephone: "",
  email: "",
  profession: "",
  estActif: true,
  idSociete: "",
  numeroMatricule: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
}

export default function NewPatientModal({ isOpen, onClose, onSave, loading = false }) {
  const { t } = useI18n()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY_FORM)
    setError("")
  }, [isOpen])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.dateNaissance) {
      setError(t("patients.formRequired"))
      return
    }

    setError("")
    try {
      await onSave({ ...form })
    } catch (err) {
      setError(err?.message || t("patients.createError"))
    }
  }

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-3xl">
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {t("patients.modalTitle")}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={loading}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("patients.identitySection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.lastName")}</label>
                  <Input
                    value={form.nom}
                    onChange={(e) => updateField("nom", e.target.value)}
                    placeholder={t("patients.lastNamePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.firstName")}</label>
                  <Input
                    value={form.prenom}
                    onChange={(e) => updateField("prenom", e.target.value)}
                    placeholder={t("patients.firstNamePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.gender")}</label>
                  <Select value={form.sexe} onValueChange={(v) => updateField("sexe", v)} disabled={loading}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">{t("patients.male")}</SelectItem>
                      <SelectItem value="F">{t("patients.female")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.birthDate")}</label>
                  <Input
                    type="date"
                    value={form.dateNaissance}
                    onChange={(e) => updateField("dateNaissance", e.target.value)}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.bloodType")}</label>
                  <Select
                    value={form.groupeSanguin || undefined}
                    onValueChange={(v) => updateField("groupeSanguin", v)}
                    disabled={loading}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder={t("patients.selectBloodType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.profession")}</label>
                  <Input
                    value={form.profession}
                    onChange={(e) => updateField("profession", e.target.value)}
                    placeholder={t("patients.professionPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("patients.contactSection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.address")}</label>
                  <textarea
                    value={form.adresse}
                    onChange={(e) => updateField("adresse", e.target.value)}
                    rows={2}
                    placeholder={t("patients.addressPlaceholder")}
                    className="mt-1 h-auto w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.phone")}</label>
                  <Input
                    value={form.telephone}
                    onChange={(e) => updateField("telephone", e.target.value)}
                    placeholder={t("patients.phonePlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder={t("patients.emailPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("patients.emergencySection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.emergencyName")}</label>
                  <Input
                    value={form.emergencyName}
                    onChange={(e) => updateField("emergencyName", e.target.value)}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.emergencyPhone")}</label>
                  <Input
                    value={form.emergencyPhone}
                    onChange={(e) => updateField("emergencyPhone", e.target.value)}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.relation")}</label>
                  <Input
                    value={form.emergencyRelation}
                    onChange={(e) => updateField("emergencyRelation", e.target.value)}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("patients.adminSection")}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.companyId")}</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.idSociete}
                    onChange={(e) => updateField("idSociete", e.target.value)}
                    placeholder={t("patients.companyIdPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("patients.employeeId")}</label>
                  <Input
                    value={form.numeroMatricule}
                    onChange={(e) => updateField("numeroMatricule", e.target.value)}
                    placeholder={t("patients.employeeIdPlaceholder")}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    id="patient-active"
                    type="checkbox"
                    checked={form.estActif}
                    onChange={(e) => updateField("estActif", e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="patient-active" className="text-sm text-foreground">
                    {t("patients.activeAccount")}
                  </label>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t("patients.autoFieldsHint")}</p>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>

          <div className="flex items-center justify-end gap-2 border-t bg-muted/50 p-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t("common.loading") : t("patients.savePatient")}
            </Button>
          </div>
        </Card>
    </AnimatedModal>
  )
}
