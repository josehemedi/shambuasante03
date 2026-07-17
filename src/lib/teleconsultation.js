/**
 * Référencement professionnel des téléconsultations.
 * Format : TC-{hôpital}-{n° RDV}  →  ex. TC-01-0009
 */

export function formatTeleconsultationNumero(idRdv, idHopital) {
  const id = Number(idRdv)
  if (!Number.isFinite(id) || id <= 0) return "TC-0000"

  const seq = String(Math.trunc(id)).padStart(4, "0")
  const hop = Number(idHopital)
  if (Number.isFinite(hop) && hop > 0) {
    return `TC-${String(Math.trunc(hop)).padStart(2, "0")}-${seq}`
  }
  return `TC-${seq}`
}

/**
 * Libellé affiché : « Téléconsultation TC-01-0009 — Motif »
 */
export function formatTeleconsultationLabel(idRdv, idHopital, motif, lang = "fr") {
  const numero = formatTeleconsultationNumero(idRdv, idHopital)
  const motifClean =
    motif != null && String(motif).trim() && String(motif).trim() !== "—"
      ? String(motif).trim()
      : ""
  const base = lang === "fr" ? `Téléconsultation ${numero}` : `Teleconsultation ${numero}`
  return motifClean ? `${base} — ${motifClean}` : base
}

export function enrichTeleSession(session, lang = "fr") {
  if (!session) return session
  const idRdv = session.idRdv ?? session.id
  const idHopital = session.idHopital ?? null
  const motif = session.reason || session.motifVisite || session.motif || ""
  const numero = formatTeleconsultationNumero(idRdv, idHopital)
  return {
    ...session,
    idRdv,
    numero,
    label: formatTeleconsultationLabel(idRdv, idHopital, motif, lang),
  }
}
