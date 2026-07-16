import { useMemo, useState } from "react"
import { Search, Plus, MoreHorizontal, Mail, Phone, UserCheck, UserX, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import {
  Card,
  Button,
  Badge,
  Input,
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { tenantUserService } from "@/services/tenantUserService"
import InviteUserModal from "@/components/InviteUserModal"
import { ROLE_KEYS, roles } from "@/config/roles"
import { TENANT_CREATABLE_ROLE_KEYS } from "@/config/tenantRoles"
import {
  getDepartmentKey,
  getStaffStatus,
  getStaffStatusKey,
  isStaffMember,
  ROLE_BADGE_VARIANT,
  STAFF_STATUS_VARIANT,
} from "@/lib/staffUtils"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)

export default function Staff() {
  const { t } = useI18n()
  const { user: currentUser } = useAuth()
  const hospitalName = currentUser?.tenantLabel

  const { data: users, loading, error, reload, setData } = useAsync(
    () => tenantUserService.getAll(hospitalName),
    [hospitalName],
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionUserId, setActionUserId] = useState(null)

  const staffMembers = useMemo(() => (users || []).filter(isStaffMember), [users])

  const roleFilterOptions = useMemo(
    () =>
      TENANT_CREATABLE_ROLE_KEYS.concat(ROLE_KEYS.HOSPITAL_ADMIN)
        .map((key) => roles[key])
        .filter(Boolean),
    [],
  )

  const filteredStaff = useMemo(() => {
    return staffMembers.filter((member) => {
      const department = t(getDepartmentKey(member.role))
      const matchesSearch =
        !searchTerm ||
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(member.id).includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || member.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [staffMembers, searchTerm, roleFilter, t])

  const stats = useMemo(
    () => ({
      total: staffMembers.length,
      active: staffMembers.filter((m) => getStaffStatus(m) === "active").length,
      offline: staffMembers.filter((m) => getStaffStatus(m) === "offline").length,
      disabled: staffMembers.filter((m) => getStaffStatus(m) === "disabled").length,
    }),
    [staffMembers],
  )

  const handleCreateStaff = async (payload) => {
    setSubmitting(true)
    try {
      const created = await tenantUserService.create(payload, hospitalName)
      setIsModalOpen(false)
      setRoleFilter("all")
      setSearchTerm("")
      setData((prev) => {
        const list = prev || []
        if (list.some((u) => u.id === created.id)) return list
        return [created, ...list]
      })
      reload()

      const roleMeta = roles[created.role]
      const roleLabel = roleMeta ? t(roleMeta.labelKey) : created.role

      await MySwal.fire({
        title: t("staffPage.createSuccessTitle"),
        text: t("staffPage.createSuccessMsg", { name: created.name, role: roleLabel }),
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (member) => {
    setActionUserId(member.id)
    try {
      if (member.accountEnabled) {
        const result = await MySwal.fire({
          title: t("staffPage.disableConfirmTitle"),
          text: t("staffPage.disableConfirmMsg", { name: member.name }),
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: t("staffPage.disable"),
          cancelButtonText: t("common.cancel"),
        })
        if (!result.isConfirmed) return
        await tenantUserService.disable(member.id)
      } else {
        await tenantUserService.enable(member.id)
      }
      reload()
    } catch (err) {
      await MySwal.fire({
        title: t("common.error"),
        text: err?.message || t("staffPage.actionError"),
        icon: "error",
      })
    } finally {
      setActionUserId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title={t("nav.staff")}
        subtitle={t("staffPage.subtitle")}
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("staffPage.addStaff")}
          </Button>
        }
      />

      <InviteUserModal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        onSubmit={handleCreateStaff}
        loading={submitting}
      />

      {error && (
        <Card className="mb-4 p-4 text-sm text-destructive">
          {error.message || t("staffPage.loadError")}
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("staffPage.totalStaff"), value: stats.total, tone: "text-foreground" },
          { label: t("staffPage.activeNow"), value: stats.active, tone: "text-emerald-600" },
          { label: t("staffPage.offline"), value: stats.offline, tone: "text-muted-foreground" },
          { label: t("staffPage.disabled"), value: stats.disabled, tone: "text-destructive" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold ${kpi.tone}`}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("staffPage.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">{t("staffPage.allRoles")}</option>
              {roleFilterOptions.map((role) => (
                <option key={role.key} value={role.key}>
                  {t(role.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("staffPage.colName")}</th>
                <th className="px-4 py-3 font-medium">{t("staffPage.colRole")}</th>
                <th className="px-4 py-3 font-medium">{t("staffPage.colDepartment")}</th>
                <th className="px-4 py-3 font-medium">{t("staffPage.colContact")}</th>
                <th className="px-4 py-3 font-medium">{t("staffPage.colStatus")}</th>
                <th className="px-4 py-3 font-medium text-right">{t("staffPage.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const roleMeta = roles[member.role]
                  const status = getStaffStatus(member)
                  const isAdmin = member.role === ROLE_KEYS.HOSPITAL_ADMIN
                  return (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} />
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">#{member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_BADGE_VARIANT[member.role] || "default"}>
                          {roleMeta ? t(roleMeta.labelKey) : member.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t(getDepartmentKey(member.role))}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{member.telephone || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STAFF_STATUS_VARIANT[status]}>
                          {t(getStaffStatusKey(status))}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={actionUserId === member.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled>
                                {t("staffPage.viewProfile")}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                {t("staffPage.editDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(member)}>
                                {member.accountEnabled ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    {t("staffPage.disable")}
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    {t("staffPage.enable")}
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredStaff.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t("staffPage.noResults")}
          </div>
        )}
      </Card>
    </div>
  )
}
