/** Contexte sécurisé requis pour getUserMedia (HTTPS ou localhost). */
export function isSecureMediaContext() {
  if (typeof window === "undefined") return false
  if (window.isSecureContext) return true
  const host = window.location.hostname
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")
}

export function isPrivateLanHost(hostname = typeof window !== "undefined" ? window.location.hostname : "") {
  if (!hostname) return false
  if (/^192\.168\./.test(hostname)) return true
  if (/^10\./.test(hostname)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true
  return false
}

export function isMediaDevicesAvailable() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
}

export function getMediaUnavailableReason() {
  if (isMediaDevicesAvailable()) return null
  if (!isSecureMediaContext()) return "insecure-context"
  return "not-supported"
}

/** URL HTTPS à ouvrir sur mobile (même Wi‑Fi) pour activer caméra/micro. */
export function getSuggestedSecureAppUrl(path) {
  if (typeof window === "undefined") return null
  const targetPath = path ?? `${window.location.pathname}${window.location.search}${window.location.hash}`
  const host = window.location.hostname
  // Serveur HTTPS mobile dédié (npm run dev:mobile) sur le port 5174
  const httpsPort =
    window.location.protocol === "http:" && (isPrivateLanHost(host) || host === "localhost")
      ? "5174"
      : window.location.port || "5173"
  return `https://${host === "localhost" ? window.location.hostname : host}:${httpsPort}${targetPath}`
}

export function needsMobileHttpsForMedia() {
  if (typeof window === "undefined") return false
  return !isSecureMediaContext() && isPrivateLanHost(window.location.hostname)
}
