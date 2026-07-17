const TOKEN_KEY = "shambua.token"
const HOPITAL_KEY = "shambua.hopitalId"
const ROLE_KEY = "shambua.role"
/** Doit rester aligné avec ROLE_KEYS.SUPER_ADMIN (roles.js). */
const SUPER_ADMIN_ROLE = "superadmin"

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

/**
 * SaaS multi-tenant : seul SUPER_ADMIN envoie X-Hopital-Id (impersonation plateforme).
 * Pour le staff établissement, le tenant est exclusivement issu du JWT côté backend.
 */
export function shouldSendHopitalHeader() {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(ROLE_KEY) === SUPER_ADMIN_ROLE
}

/** En-têtes d’auth multi-tenant pour fetch hors httpClient (PDF, multipart…). */
export function authHeaders(extra = {}) {
  const headers = { ...extra }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (shouldSendHopitalHeader()) {
    const hopitalId = getHopitalId()
    if (hopitalId != null) headers["X-Hopital-Id"] = String(hopitalId)
  }
  return headers
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
    let rawMessage =
      (payload && typeof payload === "object" && (payload.message || payload.error || payload.detail)) ||
      (typeof payload === "string" && payload ? payload : null)

    // Ne jamais afficher une page HTML (Cloudflare/nginx 502) à l'utilisateur
    if (typeof rawMessage === "string" && looksLikeHtmlOrGatewayPage(rawMessage)) {
      rawMessage = gatewayStatusMessage(response.status)
    } else if ([502, 503, 504].includes(response.status) && (!rawMessage || looksLikeHtmlOrGatewayPage(String(rawMessage)))) {
      rawMessage = gatewayStatusMessage(response.status)
    }

    const code = payload && typeof payload === "object" ? (payload.code || payload.error) : undefined

    // Ne plus afficher les 403 « rôle / session » à l'utilisateur
    const isAccessDenied403 =
      response.status === 403 &&
      (code === "ACCESS_DENIED" ||
        !rawMessage ||
        /accès refusé/i.test(String(rawMessage)) ||
        /rôle ou votre session/i.test(String(rawMessage)) ||
        /vérifiez votre rôle/i.test(String(rawMessage)) ||
        /^forbidden$/i.test(String(rawMessage)))

    const error = new Error(
      isAccessDenied403
        ? ""
        : rawMessage ||
          (response.status === 401
            ? "Session expirée. Veuillez vous reconnecter."
            : response.status === 403
              ? ""
              : `HTTP ${response.status}`),
    )
    error.status = response.status
    error.payload = typeof payload === "string" && looksLikeHtmlOrGatewayPage(payload) ? null : payload
    error.code = code
    error.silent = Boolean(isAccessDenied403 || (response.status === 403 && !rawMessage))
    throw error
  }

  return payload
}

function looksLikeHtmlOrGatewayPage(text) {
  const sample = String(text).slice(0, 800).toLowerCase()
  return (
    sample.includes("<!doctype html") ||
    sample.includes("<html") ||
    sample.includes("bad gateway") ||
    sample.includes("error code 502") ||
    sample.includes("cloudflare") ||
    sample.includes("cf-error-details")
  )
}

function gatewayStatusMessage(status) {
  if (status === 502) {
    return "Le serveur applicatif est temporairement indisponible (502). Réessayez dans quelques instants."
  }
  if (status === 503) {
    return "Service temporairement indisponible (503). Réessayez dans quelques instants."
  }
  if (status === 504) {
    return "Délai d'attente dépassé (504). Réessayez dans quelques instants."
  }
  return "Le serveur est temporairement inaccessible. Réessayez dans quelques instants."
}

export async function httpClient(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (shouldSendHopitalHeader()) {
    const hopitalId = getHopitalId()
    if (hopitalId != null) {
      headers.set("X-Hopital-Id", String(hopitalId))
    }
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
