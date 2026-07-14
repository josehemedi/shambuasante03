import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value, locale = "en", currency = "USD") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value, locale = "en") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US").format(value)
}

export function formatDate(date, locale = "en", opts) {
  const d = parseFlexibleDate(date)
  if (!d) return "—"
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(d)
}

/** Parse ISO, SQL timestamp, or dd/MM/yyyy HH:mm from the API. */
export function parseFlexibleDate(value) {
  if (value == null || value === "") return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const raw = String(value).trim()
  if (!raw) return null

  const iso = new Date(raw)
  if (!Number.isNaN(iso.getTime())) return iso

  const frMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (frMatch) {
    const [, day, month, year, hour = "0", minute = "0"] = frMatch
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    )
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function formatDateTime(value, locale = "en") {
  const d = parseFlexibleDate(value)
  if (!d) return "—"
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function initials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
