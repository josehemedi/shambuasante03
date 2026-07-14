import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react"
import { roles, DEFAULT_ROLE, ROLE_KEYS } from "@/config/roles"
import { canRoleAccess } from "@/config/navigation"
import { loginRequest, fetchCurrentUser, logoutRequest, logoutSession, requestPasswordReset as requestPasswordResetApi, resetPasswordRequest } from "@/services/authService"
import { getToken, USE_LIVE_API, setHopitalId } from "@/services/httpClient"

const AuthContext = createContext(null)

const ROLE_KEY = "shambua.role"
const AUTH_KEY = "shambua.auth"

export const DEMO_PASSWORD = "shambua123"

function readStoredRole() {
  if (typeof window === "undefined") return DEFAULT_ROLE
  const stored = window.localStorage.getItem(ROLE_KEY)
  return stored && roles[stored] ? stored : DEFAULT_ROLE
}

function readStoredAuth() {
  if (typeof window === "undefined") return false
  return Boolean(getToken()) || window.localStorage.getItem(AUTH_KEY) === "true"
}

const BACKEND_ROLE_MAP = {
  SUPER_ADMIN: ROLE_KEYS.SUPER_ADMIN,
  TENANT_ADMIN: ROLE_KEYS.HOSPITAL_ADMIN,
  MEDECIN: ROLE_KEYS.DOCTOR,
  RECEPTION: ROLE_KEYS.RECEPTIONIST,
  RECEPTIONNISTE: ROLE_KEYS.RECEPTIONIST,
  RECEPTIONIST: ROLE_KEYS.RECEPTIONIST,
  PATIENT: ROLE_KEYS.PATIENT,
  LABORANTIN: ROLE_KEYS.LAB_TECH,
  CAISSIER: ROLE_KEYS.CASHIER,
  ARCHIVISTE: ROLE_KEYS.ARCHIVIST,
  USER: ROLE_KEYS.USER,
}

function resolveRoleKey(apiUser) {
  if (apiUser.frontendRole && roles[apiUser.frontendRole]) {
    return apiUser.frontendRole
  }
  const backendRole = apiUser.role?.trim?.()?.toUpperCase?.()
  if (backendRole && BACKEND_ROLE_MAP[backendRole] && roles[BACKEND_ROLE_MAP[backendRole]]) {
    return BACKEND_ROLE_MAP[backendRole]
  }
  return DEFAULT_ROLE
}

function buildUserFromApi(apiUser, roleKey) {
  const roleMeta = roles[roleKey] || roles[DEFAULT_ROLE]
  const fullName = [apiUser.prenom, apiUser.nom].filter(Boolean).join(" ").trim()
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return {
    name: fullName || roleMeta.user.name,
    email: apiUser.email || roleMeta.user.email,
    title: roleMeta.user.title,
    initials: initials || roleMeta.user.initials,
    tenant: apiUser.idHopital != null ? String(apiUser.idHopital) : null,
    tenantLabel: apiUser.tenantLabel || roleMeta.user.tenantLabel,
    idHopital: apiUser.idHopital,
    idUtilisateur: apiUser.idUtilisateur,
    idMedecin: apiUser.idMedecin,
    idPatient: apiUser.idPatient,
    tenantAccessRestricted: Boolean(apiUser.tenantAccessRestricted),
  }
}

export function AuthProvider({ children }) {
  const [roleKey, setRoleKey] = useState(readStoredRole)
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredAuth)
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(USE_LIVE_API && readStoredAuth())

  const applySession = useCallback((apiUser) => {
    const nextRole = resolveRoleKey(apiUser)
    if (!roles[nextRole]) {
      throw new Error("auth.errorUnknownEmail")
    }
    setRoleKey(nextRole)
    setUser(buildUserFromApi(apiUser, nextRole))
    setIsAuthenticated(true)
    if (apiUser.idHopital != null) {
      setHopitalId(apiUser.idHopital)
    } else {
      setHopitalId(null)
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ROLE_KEY, nextRole)
      window.localStorage.setItem(AUTH_KEY, "true")
    }
    return nextRole
  }, [])

  useEffect(() => {
    if (!USE_LIVE_API || !getToken()) {
      setBootstrapping(false)
      return
    }

    fetchCurrentUser()
      .then((apiUser) => applySession(apiUser))
      .catch(() => {
        logoutSession()
        setIsAuthenticated(false)
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(AUTH_KEY)
        }
      })
      .finally(() => setBootstrapping(false))
  }, [applySession])

  const setRole = useCallback((next) => {
    if (USE_LIVE_API) return
    if (!roles[next]) return
    setRoleKey(next)
    if (typeof window !== "undefined") window.localStorage.setItem(ROLE_KEY, next)
  }, [])

  const login = useCallback(async ({ email, password }) => {
    if (!USE_LIVE_API) {
      await new Promise((res) => setTimeout(res, 700))
      const key = Object.values(roles).find((r) => r.user.email.toLowerCase() === email.trim().toLowerCase())?.key
      if (!key) throw new Error("auth.errorUnknownEmail")
      if (password !== DEMO_PASSWORD) throw new Error("auth.errorBadPassword")
      setRoleKey(key)
      setUser(roles[key].user)
      setIsAuthenticated(true)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ROLE_KEY, key)
        window.localStorage.setItem(AUTH_KEY, "true")
      }
      return { roleKey: key, tenantAccessRestricted: false }
    }

    const response = await loginRequest({ email, password })
    const nextRole = applySession(response.user)
    return {
      roleKey: nextRole,
      tenantAccessRestricted: Boolean(response.user?.tenantAccessRestricted),
    }
  }, [applySession])

  const refreshSession = useCallback(async () => {
    if (!USE_LIVE_API || !getToken()) return null
    const apiUser = await fetchCurrentUser()
    applySession(apiUser)
    return apiUser
  }, [applySession])

  const logout = useCallback(async () => {
    await logoutRequest()
    logoutSession()
    setRoleKey(DEFAULT_ROLE)
    setIsAuthenticated(false)
    setUser(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_KEY)
      window.localStorage.removeItem(ROLE_KEY)
    }
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    if (!email?.trim()) {
      throw new Error("auth.errorEmailRequired")
    }
    if (USE_LIVE_API) {
      await requestPasswordResetApi(email.trim())
      return true
    }
    await new Promise((res) => setTimeout(res, 700))
    return Boolean(email)
  }, [])

  const resetPassword = useCallback(async ({ password, token }) => {
    if (!password || password.length < 8) throw new Error("auth.errorWeakPassword")
    if (USE_LIVE_API) {
      if (!token) throw new Error("auth.errorInvalidToken")
      await resetPasswordRequest({ token, password })
      return true
    }
    await new Promise((res) => setTimeout(res, 700))
    return true
  }, [])

  const role = roles[roleKey]
  const resolvedUser = user || role.user

  const canAccess = useCallback((path) => canRoleAccess(roleKey, path), [roleKey])

  const value = useMemo(
    () => ({
      roleKey,
      role,
      user: resolvedUser,
      isAuthenticated,
      bootstrapping,
      setRole,
      login,
      logout,
      refreshSession,
      requestPasswordReset,
      resetPassword,
      canAccess,
    }),
    [roleKey, role, resolvedUser, isAuthenticated, bootstrapping, setRole, login, logout, refreshSession, requestPasswordReset, resetPassword, canAccess],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
