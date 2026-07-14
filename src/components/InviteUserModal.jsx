import { useEffect, useState } from "react"
import { X, UserPlus } from "lucide-react"
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import { roles, ROLE_KEYS } from "@/config/roles"
import { TENANT_CREATABLE_ROLE_KEYS } from "@/config/tenantRoles"

const DEFAULT_PASSWORD = "shambua123"

export default function InviteUserModal({ isOpen, onClose, onSubmit, loading = false }) {
  const { t } = useI18n()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState(DEFAULT_PASSWORD)
  const [role, setRole] = useState("")
  const [telephone, setTelephone] = useState("")
  const [specialite, setSpecialite] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setFirstName("")
    setLastName("")
    setEmail("")
    setPassword(DEFAULT_PASSWORD)
    setRole("")
    setTelephone("")
    setSpecialite("")
    setError("")
  }, [isOpen])

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !role) {
      setError(t("userMgmt.formRequired"))
      return
    }
    if (password.length < 8) {
      setError(t("userMgmt.passwordTooShort"))
      return
    }
    setError("")
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
        telephone: telephone.trim() || undefined,
        specialite: role === ROLE_KEYS.DOCTOR ? specialite.trim() || undefined : undefined,
      })
    } catch (err) {
      setError(err?.message || t("userMgmt.createError"))
    }
  }

  const roleItems = TENANT_CREATABLE_ROLE_KEYS.map((key) => ({
    value: key,
    label: roles[key] ? t(roles[key].labelKey) : key,
  }))

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-lg">
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">{t("userMgmt.createUser")}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={loading}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("userMgmt.firstName")}</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("userMgmt.lastName")}</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("userMgmt.email")}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("userMgmt.password")}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("userMgmt.colRole")}</label>
            <Select value={role || undefined} onValueChange={setRole} disabled={loading}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder={t("userMgmt.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {roleItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === ROLE_KEYS.DOCTOR && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("userMgmt.specialty")}</label>
              <Input
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value)}
                placeholder={t("userMgmt.specialtyPlaceholder")}
                className="mt-1"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("userMgmt.phone")}</label>
            <Input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="mt-1"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end border-t p-4">
          <Button variant="outline" onClick={onClose} className="mr-2" disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <UserPlus className="mr-2 h-4 w-4" />
            {loading ? t("common.loading") : t("userMgmt.createUser")}
          </Button>
        </div>
      </div>
    </AnimatedModal>
  )
}
