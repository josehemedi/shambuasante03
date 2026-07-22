/** Ouvre une fiche d'accueil / ticket de passage imprimable. */
export function printReceptionTicket({
  hospitalName = "Shambua Santé",
  patientName = "—",
  codePatient = "",
  doctorName = "—",
  specialty = "",
  motif = "—",
  service = "",
  numeroPassage = null,
  dateLabel = new Date().toLocaleString("fr-FR"),
} = {}) {
  const ticket =
    numeroPassage != null ? String(numeroPassage).padStart(3, "0") : "—"
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Ticket ${ticket}</title>
<style>
  body { font-family: Georgia, serif; margin: 24px; color: #111; }
  .card { max-width: 420px; margin: 0 auto; border: 2px solid #1E56A0; padding: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; color: #1E56A0; }
  .sub { color: #555; font-size: 12px; margin-bottom: 16px; }
  .ticket { font-size: 48px; font-weight: bold; text-align: center; letter-spacing: 4px; margin: 16px 0; }
  .label { font-size: 11px; text-transform: uppercase; color: #666; margin-top: 10px; }
  .value { font-size: 15px; font-weight: 600; }
  @media print { body { margin: 0; } .noprint { display: none; } }
</style></head><body>
  <div class="card">
    <h1>${escapeHtml(hospitalName)}</h1>
    <div class="sub">Fiche d'accueil / numéro de passage</div>
    <div class="ticket">#${escapeHtml(ticket)}</div>
    <div class="label">Patient</div>
    <div class="value">${escapeHtml(patientName)}${codePatient ? ` (${escapeHtml(codePatient)})` : ""}</div>
    <div class="label">Médecin / service</div>
    <div class="value">${escapeHtml(doctorName)}${specialty ? ` — ${escapeHtml(specialty)}` : ""}${service ? ` · ${escapeHtml(service)}` : ""}</div>
    <div class="label">Motif de visite</div>
    <div class="value">${escapeHtml(motif)}</div>
    <div class="label">Date</div>
    <div class="value">${escapeHtml(dateLabel)}</div>
  </div>
  <p class="noprint" style="text-align:center;margin-top:16px">
    <button onclick="window.print()">Imprimer</button>
  </p>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`
  const w = window.open("", "_blank", "width=480,height=640")
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
