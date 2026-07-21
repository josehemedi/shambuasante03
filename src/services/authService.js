import { http, setToken, setHopitalId, clearAuthStorage } from "@/services/httpClient"

export async function loginRequest({ email, password }) {
  try {
    const response = await http.post("/auth/login", { email, password })
    setToken(response.token)
    if (response.user?.idHopital != null) {
      setHopitalId(response.user.idHopital)
    } else {
      setHopitalId(null)
    }
    return response
  } catch (error) {
    if (error?.code === "ALREADY_LOGGED_IN" || error?.payload?.code === "ALREADY_LOGGED_IN") {
      throw new Error("auth.errorAlreadyLoggedIn")
    }
    if (error?.code === "ACCOUNT_DISABLED" || error?.status === 401 && error?.payload?.error === "ACCOUNT_DISABLED") {
      throw new Error("auth.errorAccountDisabled")
    }
    if (error?.code === "SUBSCRIPTION_LAPSED" || error?.payload?.error === "SUBSCRIPTION_LAPSED") {
      throw new Error("auth.errorSubscriptionLapsed")
    }
    throw error
  }
}

export async function fetchCurrentUser() {
  return http.get("/auth/me")
}

export async function logoutRequest() {
  try {
    await http.post("/auth/logout")
  } catch {
    // Ignore network errors during logout cleanup.
  }
}

export function logoutSession() {
  clearAuthStorage()
}

export async function requestPasswordReset(email) {
  return http.post("/auth/forgot-password", { email })
}

export async function resetPasswordRequest({ token, password }) {
  return http.post("/auth/reset-password", { token, password })
}

export async function activateAccountRequest({ token, password }) {
  return http.post("/auth/activate", { token, password })
}

export async function resendActivationRequest(email) {
  return http.post("/auth/resend-activation", { email })
}
