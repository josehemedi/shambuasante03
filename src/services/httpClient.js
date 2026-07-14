const TOKEN_KEY = "shambua.token"
const HOPITAL_KEY = "shambua.hopitalId"

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || ""
export const USE_LIVE_API = import.meta.env.VITE_USE_LIVE_API !== "false"

export function getToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (typeof window === "undefined") return
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export function getHopitalId() {
  if (typeof window === "undefined") return null
  const stored = window.localStorage.getItem(HOPITAL_KEY)
  return stored ? Number(stored) : null
}

export function setHopitalId(id) {
  if (typeof window === "undefined") return
  if (id != null) {
    window.localStorage.setItem(HOPITAL_KEY, String(id))
  } else {
    window.localStorage.removeItem(HOPITAL_KEY)
  }
}

export function clearAuthStorage() {
  setToken(null)
  setHopitalId(null)
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")
  let payload = null

  if (isJson) {
    const text = await response.text()
    payload = text ? JSON.parse(text) : null
  } else {
    payload = await response.text()
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload ? payload : null)
    const error = new Error(
      message ||
        (response.status === 401
          ? "Session expirée. Veuillez vous reconnecter."
          : response.status === 403
            ? "Accès refusé. Vérifiez votre rôle ou reconnectez-vous."
            : `HTTP ${response.status}`),
    )
    error.status = response.status
    error.payload = payload
    error.code = payload && typeof payload === "object" ? (payload.code || payload.error) : undefined
    throw error
  }

  return payload
}

export async function httpClient(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const hopitalId = getHopitalId()
  // X-Hopital-Id : utilisé uniquement par SUPER_ADMIN (TenantResolverFilter).
  // Pour les rôles établissement, le tenant est toujours issu du JWT, jamais de ce header.
  if (hopitalId != null) {
    headers.set("X-Hopital-Id", String(hopitalId))
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  return parseResponse(response)
}

export const http = {
  get: (path, options) => httpClient(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    httpClient(path, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (path, body, options) =>
    httpClient(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body, options) =>
    httpClient(path, {
      ...options,
      method: "PATCH",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
  delete: (path, options) => httpClient(path, { ...options, method: "DELETE" }),
}
