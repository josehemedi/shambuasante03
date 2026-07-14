import { http } from "@/services/httpClient"
import { apiRoleToFrontendRole, frontendRoleToApiRole } from "@/config/tenantRoles"

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return "—"
  try {
    const date = new Date(lastSeenAt)
    if (Number.isNaN(date.getTime())) return "—"
    const locale = typeof window !== "undefined" && window.localStorage.getItem("shambua-lang") === "fr" ? "fr-FR" : "en-US"
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date)
  } catch {
    return "—"
  }
}

function mapTenantUser(user, fallbackTenantName) {
  const frontendRole = apiRoleToFrontendRole(user.role)
  const tenantName = user.tenantName || fallbackTenantName
  const connected = Boolean(user.active)
  const accountEnabled = user.accountEnabled ?? true
  return {
    id: user.id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: frontendRole,
    apiRole: user.role,
    tenant: tenantName || (user.tenantId != null ? `Tenant #${user.tenantId}` : "—"),
    tenantId: user.tenantId,
    status: connected ? "active" : "inactive",
    connected,
    accountEnabled,
    active: connected,
    telephone: user.telephone || "",
    lastActive: connected ? formatLastSeen(user.lastSeenAt) : "—",
  }
}

export const tenantUserService = {
  getAll: async (fallbackTenantName) => {
    const list = await http.get("/tenant-admin/users")
    return (list || []).map((user) => mapTenantUser(user, fallbackTenantName))
  },

  getById: async (id) => {
    const user = await http.get(`/tenant-admin/users/${id}`)
    return mapTenantUser(user)
  },

  create: async ({ firstName, lastName, email, password, role, telephone, specialite }, fallbackTenantName) => {
    const payload = {
      firstName,
      lastName,
      email,
      password,
      role: frontendRoleToApiRole(role),
      telephone: telephone || undefined,
      specialite: specialite || undefined,
    }
    const created = await http.post("/tenant-admin/users", payload)
    return mapTenantUser(created, fallbackTenantName)
  },

  update: async (id, { firstName, lastName, email, role, telephone }) => {
    const payload = {
      firstName,
      lastName,
      email,
      telephone: telephone || undefined,
    }
    if (role) payload.role = frontendRoleToApiRole(role)
    const updated = await http.put(`/tenant-admin/users/${id}`, payload)
    return mapTenantUser(updated)
  },

  disable: async (id) => {
    const updated = await http.patch(`/tenant-admin/users/${id}/disable`)
    return mapTenantUser(updated)
  },

  enable: async (id) => {
    const updated = await http.patch(`/tenant-admin/users/${id}/enable`)
    return mapTenantUser(updated)
  },
}
