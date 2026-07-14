import { useMemo, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { UserPlus, Search, Ban, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, Badge, Button, Input, Avatar } from "@/components/ui/primitives"
import { useAsync } from "@/hooks/useAsync"
import { userService } from "@/services/api"
import { tenantUserService } from "@/services/tenantUserService"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS, roles } from "@/config/roles"
import { TENANT_CREATABLE_ROLE_KEYS } from "@/config/tenantRoles"
import { cn } from "@/lib/utils"
import InviteUserModal from "@/components/InviteUserModal"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)

const STATUS_TONE = {
  active: "success",
  inactive: "secondary",
  invited: "secondary",
  suspended: "destructive",
}

export default function UserManagement() {
  const { t } = useI18n()
  const { roleKey, user: currentUser } = useAuth()
  const isTenantAdmin = roleKey === ROLE_KEYS.HOSPITAL_ADMIN
  const adminHospitalName = currentUser?.tenantLabel

  const { data: users, loading, error, reload, setData } = useAsync(
    () => (isTenantAdmin ? tenantUserService.getAll(adminHospitalName) : userService.getAll()),
    [isTenantAdmin, adminHospitalName],
  )

  useEffect(() => {
    if (!isTenantAdmin) return undefined
    const intervalId = window.setInterval(() => reload(), 30000)
    return () => window.clearInterval(intervalId)
  }, [isTenantAdmin, reload])

  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionUserId, setActionUserId] = useState(null)

  const handleCreateUser = async (payload) => {
    setSubmitting(true)
    try {
      const created = await tenantUserService.create(payload, adminHospitalName)
      setIsModalOpen(false)
      setRoleFilter("all")
      setQuery("")
      setData((prev) => {
        const list = prev || []
        if (list.some((u) => u.id === created.id)) return list
        return [created, ...list]
      })
      reload()

      const roleMeta = roles[created.role]
      const roleLabel = roleMeta ? t(roleMeta.labelKey) : created.role

      MySwal.fire({
        title: t("userMgmt.createSuccessTitle"),
        text: t("userMgmt.createSuccessMsg", {
          name: created.name,
          role: roleLabel,
          hospital: created.tenant,
        }),
        icon: "success",
        timer: 4000,
        showConfirmButton: false,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (user) => {
    setActionUserId(user.id)
    try {
      if (user.accountEnabled) {
        const result = await MySwal.fire({
          title: t("userMgmt.disableConfirmTitle"),
          text: t("userMgmt.disableConfirmMsg", { name: user.name }),
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: t("userMgmt.disable"),
          cancelButtonText: t("common.cancel"),
        })
        if (!result.isConfirmed) return
        await tenantUserService.disable(user.id)
      } else {
        await tenantUserService.enable(user.id)
      }
      reload()
    } catch (err) {
      MySwal.fire({
        title: t("common.error"),
        text: err?.message || t("userMgmt.actionError"),
        icon: "error",
      })
    } finally {
      setActionUserId(null)
    }
  }

  const list = users || []

  const roleFilterOptions = useMemo(() => {
    if (isTenantAdmin) {
      return TENANT_CREATABLE_ROLE_KEYS.concat(ROLE_KEYS.HOSPITAL_ADMIN)
        .map((key) => roles[key])
        .filter(Boolean)
    }
    return Object.values(roles)
  }, [isTenantAdmin])

  const filtered = useMemo(() => {
    return list.filter((u) => {
      const matchesQuery =
        !query ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      const matchesRole = roleFilter === "all" || u.role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [list, query, roleFilter])

  const stats = useMemo(
    () => ({
      total: list.length,
      active: list.filter((u) => u.connected).length,
      pending: list.filter((u) => u.status === "invited").length,
      suspended: list.filter((u) => !u.accountEnabled).length,
    }),
    [list],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("userMgmt.title")}
        subtitle={t("userMgmt.subtitle")}
        actions={
          isTenantAdmin ? (
            <Button onClick={() => setIsModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              {t("userMgmt.createUser")}
            </Button>
          ) : null
        }
      />

      {!isTenantAdmin && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            {t("userMgmt.platformViewHint")}
          </CardContent>
        </Card>
      )}

      {isTenantAdmin && (
        <InviteUserModal
          isOpen={isModalOpen}
          onClose={() => !submitting && setIsModalOpen(false)}
          onSubmit={handleCreateUser}
          loading={submitting}
        />
      )}

      {error && (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">
            {error.message || t("userMgmt.loadError")}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: t("userMgmt.total"), value: stats.total },
          { label: t("userMgmt.activeNow"), value: stats.active },
          { label: t("userMgmt.pendingInvites"), value: stats.pending },
          { label: t("userMgmt.suspended"), value: stats.suspended },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-semibold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("userMgmt.searchPlaceholder")}
                className="pl-9"
                aria-label={t("userMgmt.searchPlaceholder")}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <RoleChip active={roleFilter === "all"} onClick={() => setRoleFilter("all")}>
                {t("userMgmt.allRoles")}
              </RoleChip>
              {roleFilterOptions.map((r) => (
                <RoleChip key={r.key} active={roleFilter === r.key} onClick={() => setRoleFilter(r.key)}>
                  {t(r.labelKey)}
                </RoleChip>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">{t("userMgmt.colUser")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("userMgmt.colRole")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("userMgmt.colTenant")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("userMgmt.colStatus")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("userMgmt.colLastActive")}</th>
                  {isTenantAdmin && <th className="px-3 py-2.5 font-medium">{t("userMgmt.colActions")}</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isTenantAdmin ? 6 : 5} className="px-3 py-10 text-center text-muted-foreground">
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => {
                    const role = roles[u.role]
                    const RoleIcon = role?.icon
                    const isTenantAdminUser = u.role === ROLE_KEYS.HOSPITAL_ADMIN
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/70 transition-colors hover:bg-muted/40"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{u.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                            {RoleIcon && <RoleIcon className="h-3.5 w-3.5 text-primary" />}
                            {role ? t(role.labelKey) : u.role}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{u.tenant}</td>
                        <td className="px-3 py-3">
                          <Badge variant={STATUS_TONE[u.status] || "default"}>
                            {u.connected ? t("statuses.active") : t("statuses.inactive")}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{u.lastActive}</td>
                        {isTenantAdmin && (
                          <td className="px-3 py-3">
                            {!isTenantAdminUser && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionUserId === u.id}
                                onClick={() => handleToggleActive(u)}
                              >
                                {u.accountEnabled ? (
                                  <>
                                    <Ban className="mr-1.5 h-3.5 w-3.5" />
                                    {t("userMgmt.disable")}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                    {t("userMgmt.enable")}
                                  </>
                                )}
                              </Button>
                            )}
                          </td>
                        )}
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("userMgmt.noResults")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RoleChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
