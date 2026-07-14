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
  consultation: "2563EB",
  consultationBg: "DBEAFE",
  history: "0D9488",
  historyBg: "CCFBF1",
  other: "64748B",
  otherBg: "F1F5F9",
  critical: "DC2626",
  criticalBg: "FEE2E2",
  code: "1D4ED8",
  codeBg: "EFF6FF",
  summary: "F1F5F9",
  summaryText: "334155",
  summaryValue: "0F766E",
}

const DEFAULT_COLUMNS = [
  { key: "id", width: 14 },
  { key: "recordType", width: 22 },
  { key: "kind", width: 16 },
  { key: "patientName", width: 22 },
  { key: "patientId", width: 14 },
  { key: "date", width: 18 },
  { key: "doctor", width: 22 },
  { key: "department", width: 18 },
  { key: "summary", width: 36 },
  { key: "motif", width: 28 },
  { key: "diagnostic", width: 28 },
  { key: "observations", width: 32 },
  { key: "critical", width: 12 },
]

function slugify(text) {
  return String(text || "etablissement")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40)
}

function buildFilename(hospitalName) {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`
  const slug = slugify(hospitalName)
  return `Dossiers_Medicaux_${slug}_${stamp}.xlsx`
}

function formatExportDate(lang = "fr") {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date())
}

function formatRecordDate(value, lang) {
  if (!value) return ""
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d)
  } catch {
    return String(value)
  }
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

function kindStyle(kind) {
  const map = {
    consultation: { color: COLORS.consultation, bg: COLORS.consultationBg },
    antecedent: { color: COLORS.history, bg: COLORS.historyBg },
  }
  const s = map[kind] || { color: COLORS.other, bg: COLORS.otherBg }
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: s.color } },
    fill: { fgColor: { rgb: s.bg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
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

function criticalStyle(isCritical, bgColor) {
  if (!isCritical) return dataStyle(bgColor)
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.critical } },
    fill: { fgColor: { rgb: COLORS.criticalBg }, patternType: "solid" },
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

function computeSummary(records) {
  return {
    total: records.length,
    consultations: records.filter((r) => r.kind === "consultation").length,
    history: records.filter((r) => r.kind === "antecedent").length,
    critical: records.filter((r) => r.isCritical).length,
  }
}

function mapRecordRow(record, lang, kindLabels) {
  const detail = record.detail || {}
  const yes = lang === "fr" ? "Oui" : "Yes"
  const no = lang === "fr" ? "Non" : "No"
  return {
    id: record.id || "",
    recordType: record.recordType || "",
    kind: kindLabels[record.kind] || record.kind || "",
    _kindKey: record.kind,
    patientName: record.patientName || "",
    patientId: record.patientId || "",
    date: formatRecordDate(record.date, lang),
    doctor: record.doctor && record.doctor !== "—" ? record.doctor : "",
    department: record.department && record.department !== "—" ? record.department : "",
    summary: record.summary || "",
    motif: detail.motif || detail.motifVisite || "",
    diagnostic: detail.diagnostic || "",
    observations: detail.observations || "",
    critical: record.isCritical ? yes : no,
    _isCritical: Boolean(record.isCritical),
  }
}

function cellStyleForColumn(col, row, value, bg) {
  if (col.key === "id" && value) return codeStyle(bg)
  if (col.key === "kind" && row._kindKey) return kindStyle(row._kindKey)
  if (col.key === "recordType" && row._kindKey) return kindStyle(row._kindKey)
  if (col.key === "critical") return criticalStyle(row._isCritical, bg)
  return dataStyle(bg)
}

/**
 * Exporte les dossiers médicaux filtrés vers Excel (style professionnel).
 */
export function exportRecordsToExcel(records, options = {}) {
  const {
    hospitalName = "Shambua Santé",
    exportedBy = "",
    lang = "fr",
    sheetSubtitle,
    platformName = "ShambuaSante",
    filterSummary = "",
    columnLabels = {},
    kindLabels = {},
    summaryLabels = {},
    hopitalId = null,
  } = options

  if (!records?.length) {
    throw new Error("EMPTY")
  }

  const columns = DEFAULT_COLUMNS.map((col) => ({
    ...col,
    label: columnLabels[col.key] || col.key,
  }))
  const colCount = columns.length
  const headerRowIndex = 4
  const dataStartRow = 5
  const summaryRowIndex = dataStartRow + records.length
  const footerRowIndex = summaryRowIndex + 1
  const totalRows = footerRowIndex

  const stats = computeSummary(records)
  const rows = records.map((r) => mapRecordRow(r, lang, kindLabels))

  const ws = {}
  const merges = []
  const rowHeights = []
  const cols = columns.map((col) => ({ wch: col.width }))

  const mergeFullRow = (row) => {
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  }

  const mergeRange = (row, startCol, endCol) => {
    merges.push({ s: { r: row, c: startCol }, e: { r: row, c: endCol } })
  }

  setCell(ws, 0, 0, hospitalName.toUpperCase(), titleStyle())
  mergeFullRow(0)
  rowHeights[0] = { hpt: 42 }

  setCell(
    ws,
    1,
    0,
    sheetSubtitle || (lang === "fr" ? "REGISTRE DES DOSSIERS MÉDICAUX" : "MEDICAL RECORDS REGISTER"),
    subtitleStyle(),
  )
  mergeFullRow(1)
  rowHeights[1] = { hpt: 28 }

  const metaParts = [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    `${lang === "fr" ? "Total" : "Total"} : ${stats.total} ${lang === "fr" ? "dossier(s)" : "record(s)"}`,
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
  rowHeights[2] = { hpt: 28 }

  rowHeights[3] = { hpt: 8 }

  columns.forEach((col, c) => {
    setCell(ws, headerRowIndex, c, col.label, headerStyle())
  })
  rowHeights[headerRowIndex] = { hpt: 28 }

  rows.forEach((row, index) => {
    const r = dataStartRow + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    columns.forEach((col, c) => {
      const value = row[col.key] ?? ""
      setCell(ws, r, c, value, cellStyleForColumn(col, row, value, bg))
    })
    rowHeights[r] = { hpt: 24 }
  })

  const summaryLabelCol = 0
  const summaryTitle =
    summaryLabels.title || (lang === "fr" ? "SYNTHÈSE (liste filtrée)" : "SUMMARY (filtered list)")
  setCell(ws, summaryRowIndex, summaryLabelCol, summaryTitle, summaryStyle())
  mergeRange(summaryRowIndex, summaryLabelCol, 2)

  const parts = [
    `${summaryLabels.consultations || (lang === "fr" ? "Consultations" : "Consultations")}: ${stats.consultations}`,
    `${summaryLabels.history || (lang === "fr" ? "Antécédents" : "History")}: ${stats.history}`,
    `${summaryLabels.critical || (lang === "fr" ? "Critiques" : "Critical")}: ${stats.critical}`,
  ]
  setCell(ws, summaryRowIndex, 3, parts.join("   |   "), summaryValueStyle())
  mergeRange(summaryRowIndex, 3, colCount - 1)
  rowHeights[summaryRowIndex] = { hpt: 26 }

  const footerText =
    lang === "fr"
      ? `Document confidentiel — ${hospitalName} — Généré par ${platformName} — Usage médical interne uniquement`
      : `Confidential document — ${hospitalName} — Generated by ${platformName} — Internal medical use only`
  setCell(ws, footerRowIndex, 0, footerText, footerStyle())
  mergeFullRow(footerRowIndex)
  rowHeights[footerRowIndex] = { hpt: 20 }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows, c: colCount - 1 } })
  ws["!merges"] = merges
  ws["!cols"] = cols
  ws["!rows"] = rowHeights

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, ws, lang === "fr" ? "Dossiers" : "Records")

  const filename = buildFilename(hospitalName)
  XLSX.writeFile(workbook, filename)

  return { filename, count: records.length, summary: stats }
}
