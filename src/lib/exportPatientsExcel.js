import * as XLSX from "xlsx-js-style"

const COLORS = {
  primary: "0D9488",
  primaryLight: "CCFBF1",
  header: "115E59",
  headerText: "FFFFFF",
  subtitleText: "134E4A",
  metaText: "475569",
  zebra: "F0FDFA",
  white: "FFFFFF",
  border: "CBD5E1",
  active: "059669",
  activeBg: "D1FAE5",
  inactive: "DC2626",
  inactiveBg: "FEE2E2",
  accent: "2563EB",
  accentBg: "DBEAFE",
  blood: "B45309",
  bloodBg: "FEF3C7",
  code: "1D4ED8",
  codeBg: "EFF6FF",
  summary: "F1F5F9",
  summaryText: "334155",
  summaryValue: "0F766E",
  ambulatoire: "2563EB",
  ambulatoireBg: "DBEAFE",
  admis: "D97706",
  admisBg: "FEF3C7",
  sortieAutorisee: "7C3AED",
  sortieAutoriseeBg: "EDE9FE",
  sorti: "64748B",
  sortiBg: "F1F5F9",
}

const DEFAULT_COLUMNS = [
  { key: "codePatient", width: 16 },
  { key: "nom", width: 18 },
  { key: "prenom", width: 18 },
  { key: "sexe", width: 10 },
  { key: "age", width: 8 },
  { key: "dateNaissance", width: 14 },
  { key: "groupeSanguin", width: 14 },
  { key: "telephone", width: 16 },
  { key: "email", width: 28 },
  { key: "profession", width: 18 },
  { key: "adresse", width: 30 },
  { key: "contactUrgence", width: 24 },
  { key: "estActif", width: 10 },
  { key: "statutClinique", width: 20 },
  { key: "dateEnregistrement", width: 20 },
  { key: "numeroMatricule", width: 16 },
  { key: "idPatient", width: 12 },
]

function slugify(text) {
  return String(text || "hopital")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40)
}

function buildFilename(hospitalName, hopitalId) {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`
  const slug = slugify(hospitalName) || (hopitalId != null ? `hopital_${hopitalId}` : "patients")
  return `Patients_${slug}_${stamp}.xlsx`
}

function formatExportDate(lang = "fr") {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date())
}

function calcAge(dateNaissance) {
  if (!dateNaissance) return null
  const birth = new Date(String(dateNaissance).split("T")[0])
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

function formatContactUrgence(patient) {
  const parsed = patient.contactUrgenceParsed
  if (parsed) {
    const parts = [parsed.nom, parsed.telephone, parsed.relation].filter(Boolean)
    if (parts.length) return parts.join(" — ")
  }
  if (typeof patient.contactUrgence === "string" && patient.contactUrgence.trim()) {
    try {
      const json = JSON.parse(patient.contactUrgence)
      const parts = [json.nom, json.telephone, json.relation].filter(Boolean)
      if (parts.length) return parts.join(" — ")
    } catch {
      return patient.contactUrgence
    }
  }
  return ""
}

function formatClinicalStatus(status, clinicalLabels = {}) {
  if (!status) return ""
  return clinicalLabels[status] || status
}

function formatExportValue(patient, key, lang = "fr", clinicalLabels = {}) {
  if (key === "age") {
    const age = patient.age ?? calcAge(patient.dateNaissance)
    return age != null ? age : ""
  }
  if (key === "contactUrgence") {
    return formatContactUrgence(patient)
  }

  const value = patient[key]
  if (value == null || value === "") return ""

  if (key === "estActif") return value ? (lang === "fr" ? "Oui" : "Yes") : lang === "fr" ? "Non" : "No"
  if (key === "sexe") {
    if (value === "M") return lang === "fr" ? "Homme" : "Male"
    if (value === "F") return lang === "fr" ? "Femme" : "Female"
    return value
  }
  if (key === "statutClinique") return formatClinicalStatus(value, clinicalLabels)
  if (key === "dateNaissance") return String(value).split("T")[0]
  if (key === "dateEnregistrement") return String(value).replace("T", " ").slice(0, 19)
  return value
}

function filterByTenant(patients, hopitalId) {
  if (hopitalId == null) return []
  return patients.filter((p) => p.idHopital != null && Number(p.idHopital) === Number(hopitalId))
}

function computeSummary(patients) {
  const summary = {
    total: patients.length,
    active: 0,
    inactive: 0,
    ambulatoire: 0,
    admis: 0,
    sortieAutorisee: 0,
    sorti: 0,
  }
  patients.forEach((p) => {
    if (p.estActif) summary.active += 1
    else summary.inactive += 1
    switch (p.statutClinique) {
      case "ADMIS":
        summary.admis += 1
        break
      case "SORTIE_AUTORISEE":
        summary.sortieAutorisee += 1
        break
      case "SORTI":
        summary.sorti += 1
        break
      default:
        summary.ambulatoire += 1
        break
    }
  })
  return summary
}

function cellRef(row, col) {
  return XLSX.utils.encode_cell({ r: row, c: col })
}

function setCell(ws, row, col, value, style) {
  const ref = cellRef(row, col)
  ws[ref] = { v: value, t: typeof value === "number" ? "n" : "s", s: style }
}

function baseBorder() {
  return {
    top: { style: "thin", color: { rgb: COLORS.border } },
    bottom: { style: "thin", color: { rgb: COLORS.border } },
    left: { style: "thin", color: { rgb: COLORS.border } },
    right: { style: "thin", color: { rgb: COLORS.border } },
  }
}

function titleStyle() {
  return {
    font: { name: "Calibri", sz: 20, bold: true, color: { rgb: COLORS.headerText } },
    fill: { fgColor: { rgb: COLORS.primary }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
  }
}

function subtitleStyle() {
  return {
    font: { name: "Calibri", sz: 14, bold: true, color: { rgb: COLORS.subtitleText } },
    fill: { fgColor: { rgb: "99F6E4" }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
  }
}

function metaStyle() {
  return {
    font: { name: "Calibri", sz: 10, italic: true, color: { rgb: COLORS.metaText } },
    fill: { fgColor: { rgb: COLORS.primaryLight }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  }
}

function headerStyle() {
  return {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.headerText } },
    fill: { fgColor: { rgb: COLORS.header }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: baseBorder(),
  }
}

function dataStyle(bgColor) {
  return {
    font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
    fill: { fgColor: { rgb: bgColor }, patternType: "solid" },
    alignment: { vertical: "center", wrapText: true },
    border: baseBorder(),
  }
}

function activeStyle(isActive) {
  return {
    font: {
      name: "Calibri",
      sz: 10,
      bold: true,
      color: { rgb: isActive ? COLORS.active : COLORS.inactive },
    },
    fill: { fgColor: { rgb: isActive ? COLORS.activeBg : COLORS.inactiveBg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function clinicalStyle(status, bgColor) {
  const styles = {
    AMBULATOIRE: { color: COLORS.ambulatoire, bg: COLORS.ambulatoireBg },
    ADMIS: { color: COLORS.admis, bg: COLORS.admisBg },
    SORTIE_AUTORISEE: { color: COLORS.sortieAutorisee, bg: COLORS.sortieAutoriseeBg },
    SORTI: { color: COLORS.sorti, bg: COLORS.sortiBg },
  }
  const s = styles[status] || { color: COLORS.accent, bg: COLORS.accentBg }
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: s.color } },
    fill: { fgColor: { rgb: s.bg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: baseBorder(),
  }
}

function bloodStyle(bgColor) {
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.blood } },
    fill: { fgColor: { rgb: COLORS.bloodBg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function codeStyle(bgColor) {
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.code } },
    fill: { fgColor: { rgb: COLORS.codeBg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function numberStyle(bgColor) {
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
    fill: { fgColor: { rgb: bgColor }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function summaryStyle() {
  return {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.summaryText } },
    fill: { fgColor: { rgb: COLORS.summary }, patternType: "solid" },
    alignment: { horizontal: "right", vertical: "center" },
    border: baseBorder(),
  }
}

function summaryValueStyle() {
  return {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.summaryValue } },
    fill: { fgColor: { rgb: COLORS.summary }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function footerStyle() {
  return {
    font: { name: "Calibri", sz: 9, italic: true, color: { rgb: COLORS.metaText } },
    fill: { fgColor: { rgb: COLORS.primaryLight }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
  }
}

function resolveColumns(columnLabels = {}) {
  return DEFAULT_COLUMNS.map((col) => ({
    ...col,
    label: columnLabels[col.key] || col.key,
  }))
}

function cellStyleForColumn(col, patient, value, bg) {
  if (col.key === "estActif") {
    const isActive = value === "Oui" || value === "Yes"
    return activeStyle(isActive)
  }
  if (col.key === "statutClinique" && value) {
    return clinicalStyle(patient.statutClinique, bg)
  }
  if (col.key === "groupeSanguin" && value) {
    return bloodStyle(bg)
  }
  if (col.key === "codePatient" && value) {
    return codeStyle(bg)
  }
  if (col.key === "age" || col.key === "idPatient") {
    return numberStyle(bg)
  }
  return dataStyle(bg)
}

/**
 * Exporte les patients vers un fichier Excel stylisé (multi-tenant : établissement unique).
 */
export function exportPatientsToExcel(patients, options = {}) {
  const {
    hopitalId,
    hospitalName = "Shambua Santé",
    exportedBy = "",
    lang = "fr",
    sheetSubtitle,
    platformName = "ShambuaSante",
    filterSummary = "",
    columnLabels = {},
    clinicalLabels = {},
    summaryLabels = {},
  } = options

  const scopedPatients = filterByTenant(patients, hopitalId)
  if (!scopedPatients.length) {
    throw new Error("EMPTY")
  }

  const columns = resolveColumns(columnLabels)
  const colCount = columns.length
  const headerRowIndex = 4
  const dataStartRow = 5
  const summaryRowIndex = dataStartRow + scopedPatients.length
  const footerRowIndex = summaryRowIndex + 1
  const totalRows = footerRowIndex

  const stats = computeSummary(scopedPatients)

  const ws = {}
  const merges = []
  const rows = []
  const cols = columns.map((col) => ({ wch: col.width }))

  const mergeFullRow = (row) => {
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  }

  const mergeRange = (row, startCol, endCol) => {
    merges.push({ s: { r: row, c: startCol }, e: { r: row, c: endCol } })
  }

  setCell(ws, 0, 0, hospitalName.toUpperCase(), titleStyle())
  mergeFullRow(0)
  rows[0] = { hpt: 42 }

  setCell(
    ws,
    1,
    0,
    sheetSubtitle || (lang === "fr" ? "REGISTRE DES PATIENTS" : "PATIENT REGISTRY"),
    subtitleStyle(),
  )
  mergeFullRow(1)
  rows[1] = { hpt: 28 }

  const metaParts = [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    `${lang === "fr" ? "Total" : "Total"} : ${stats.total} ${lang === "fr" ? "patient(s)" : "patient(s)"}`,
    hopitalId != null
      ? lang === "fr"
        ? `Établissement n°${hopitalId} — données isolées (multi-tenant)`
        : `Facility #${hopitalId} — isolated tenant data`
      : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    filterSummary || null,
    platformName,
  ].filter(Boolean)
  setCell(ws, 2, 0, metaParts.join("   •   "), metaStyle())
  mergeFullRow(2)
  rows[2] = { hpt: 28 }

  rows[3] = { hpt: 8 }

  columns.forEach((col, c) => {
    setCell(ws, headerRowIndex, c, col.label, headerStyle())
  })
  rows[headerRowIndex] = { hpt: 28 }

  scopedPatients.forEach((patient, index) => {
    const row = dataStartRow + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    columns.forEach((col, c) => {
      const value = formatExportValue(patient, col.key, lang, clinicalLabels)
      setCell(ws, row, c, value, cellStyleForColumn(col, patient, value, bg))
    })
    rows[row] = { hpt: 22 }
  })

  const activeCol = columns.findIndex((c) => c.key === "estActif")
  const statutCol = columns.findIndex((c) => c.key === "statutClinique")
  const summaryLabelCol = Math.max(0, activeCol - 2)

  const summaryTitle =
    summaryLabels.title || (lang === "fr" ? "SYNTHÈSE (liste filtrée)" : "SUMMARY (filtered list)")
  setCell(ws, summaryRowIndex, summaryLabelCol, summaryTitle, summaryStyle())
  mergeRange(summaryRowIndex, summaryLabelCol, activeCol - 1)

  const activeLabel = summaryLabels.active || (lang === "fr" ? "Actifs" : "Active")
  const inactiveLabel = summaryLabels.inactive || (lang === "fr" ? "Inactifs" : "Inactive")
  setCell(ws, summaryRowIndex, activeCol, `${activeLabel}: ${stats.active}`, summaryValueStyle())
  if (statutCol >= 0) {
    const clinicalSummary = [
      `${summaryLabels.ambulatoire || "Amb."}: ${stats.ambulatoire}`,
      `${summaryLabels.admis || "Adm."}: ${stats.admis}`,
      `${summaryLabels.sortieAutorisee || "Sortie auth."}: ${stats.sortieAutorisee}`,
      `${summaryLabels.sorti || "Sorti"}: ${stats.sorti}`,
    ].join("  |  ")
    setCell(ws, summaryRowIndex, statutCol, clinicalSummary, summaryValueStyle())
    if (statutCol < colCount - 1) {
      mergeRange(summaryRowIndex, statutCol, colCount - 1)
    }
  }
  if (activeCol + 1 < statutCol) {
    setCell(ws, summaryRowIndex, activeCol + 1, `${inactiveLabel}: ${stats.inactive}`, summaryValueStyle())
  }
  rows[summaryRowIndex] = { hpt: 26 }

  const footerText =
    lang === "fr"
      ? `Document confidentiel — ${hospitalName} — Généré par ${platformName} — Usage interne uniquement`
      : `Confidential document — ${hospitalName} — Generated by ${platformName} — Internal use only`
  setCell(ws, footerRowIndex, 0, footerText, footerStyle())
  mergeFullRow(footerRowIndex)
  rows[footerRowIndex] = { hpt: 20 }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows, c: colCount - 1 } })
  ws["!merges"] = merges
  ws["!cols"] = cols
  ws["!rows"] = rows

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, ws, lang === "fr" ? "Patients" : "Patients")

  const filename = buildFilename(hospitalName, hopitalId)
  XLSX.writeFile(workbook, filename)

  return { filename, count: scopedPatients.length, summary: stats }
}
