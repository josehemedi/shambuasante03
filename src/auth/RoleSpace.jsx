import { useEffect } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/auth/AuthProvider"
import {
  getPrefixFromPath,
  getRolePrefix,
  pathBelongsToRole,
  roleHomePath,
  stripRolePrefix,
  withRolePath,
} from "@/config/roleRoutes"

/**
 * Si l'URL n'a pas le bon préfixe de rôle, redirige vers
 * /{prefix}/{module} en conservant le sous-chemin.
 */
export function RequireRoleSpace({ children }) {
  const { roleKey, isAuthenticated, bootstrapping } = useAuth()
  const location = useLocation()

  if (bootstrapping || !isAuthenticated) return children

  const prefix = getPrefixFromPath(location.pathname)
  if (!prefix) return children

  if (pathBelongsToRole(roleKey, location.pathname)) return children

  const modulePath = stripRolePrefix(location.pathname)
  const target = withRolePath(roleKey, modulePath)
  return <Navigate to={target} replace state={location.state} />
}

/**
 * Redirige les anciennes URL plates (/patients) vers /{role}/patients.
 * À monter hors du shell rôle, une seule fois.
 */
export function LegacyPathRedirect({ children }) {
  const { roleKey, isAuthenticated, bootstrapping } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return
    const prefix = getPrefixFromPath(location.pathname)
    if (prefix) return
    // Routes publiques / hors espace rôle
    const publicExact = new Set([
      "/login",
      "/forgot-password",
      "/reset-password",
      "/waiting-room-display",
    ])
    if (publicExact.has(location.pathname)) return
    if (location.pathname === "/") {
      navigate(roleHomePath(roleKey), { replace: true })
      return
    }
    navigate(withRolePath(roleKey, location.pathname), {
      replace: true,
      state: location.state,
    })
  }, [bootstrapping, isAuthenticated, location.pathname, location.state, navigate, roleKey])

  return children
}

export function RoleHomeRedirect() {
  const { roleKey } = useAuth()
  return <Navigate to={roleHomePath(roleKey)} replace />
}

export function expectedPrefix(roleKey) {
  return getRolePrefix(roleKey)
}
