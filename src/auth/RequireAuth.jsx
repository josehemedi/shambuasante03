import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/auth/AuthProvider"

// Gate for the authenticated app shell. Redirects unauthenticated users to
// /login, preserving the intended destination so they return after sign-in.
export function RequireAuth({ children }) {
  const { isAuthenticated, bootstrapping } = useAuth()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement de la session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
