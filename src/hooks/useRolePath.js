import { useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/auth/AuthProvider"
import { withRolePath, roleHomePath } from "@/config/roleRoutes"

/**
 * Navigation et construction d'URL dans l'espace du rôle connecté.
 * path("/patients") → "/medecin/patients" (si médecin)
 */
export function useRolePath() {
  const { roleKey } = useAuth()
  const navigate = useNavigate()

  const path = useCallback(
    (modulePath = "/") => withRolePath(roleKey, modulePath),
    [roleKey],
  )

  const home = useMemo(() => roleHomePath(roleKey), [roleKey])

  const go = useCallback(
    (modulePath = "/", options) => navigate(withRolePath(roleKey, modulePath), options),
    [navigate, roleKey],
  )

  return { path, home, go, roleKey }
}
