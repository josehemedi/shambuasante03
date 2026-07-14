import * as XLSX from "xlsx-js-style"

const COLORS = {
  primary: "1E40AF",
  primaryLight: "DBEAFE",
  header: "1E3A8A",
  headerText: "FFFFFF",
  subtitleText: "1E3A8A",
  metaText: "475569",
  zebra: "EFF6FF",
  white: "FFFFFF",
  border: "CBD5E1",
  active: "059669",
  activeBg: "D1FAE5",
  trial: "D97706",
  trialBg: "FEF3C7",
  suspended: "DC2626",
  suspendedBg: "FEE2E2",
  planStarter: "2563EB",
  planStarterBg: "DBEAFE",
  planGrowth: "0D9488",
  planGrowthBg: "CCFBF1",
  planEnterprise: "7C3AED",
  planEnterpriseBg: "EDE9FE",
  mrr: "047857",
  mrrBg: "ECFDF5",
  summary: "F1F5F9",
  summaryText: "334155",
}

const EXPORT_COLUMNS = [
  { key: "id", label: "Réf. tenant", width: 12 },
  { key: "_backendId", label: "ID hôpital", width: 12 },
  { key: "name", label: "Nom", width: 28 },
  { key: "country", label: "Pays", width: 14 },
  { key: "city", label: "Ville", width: 16 },
  { key: "specialty", label: "Spécialité / Type", width: 18 },
  { key: "plan", label: "Forfait", width: 14 },
  { key: "users", label: "Utilisateurs", width: 12 },
  { key: "mrr", label: "MRR (USD)", width: 14 },
  { key: "status", label: "Statut", width: 12 },
  { key: "contact", label: "Contact", width: 20 },
  { key: "email", label: "Email", width: 28 },
  { key: "phone", label: "Téléphone", width: 16 },
  { key: "joined", label: "Inscrit le", width: 14 },
  { key: "lastActive", label: "Dernière activité", width: 18 },
]

function buildFilename() {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`
  return `Hopitaux_ShambuaSante_${stamp}.xlsx`
}

function formatExportDate(lang = "fr") {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date())
}

function formatStatus(status, lang = "fr") {
  const map = {
    active: lang === "fr" ? "Actif" : "Active",
    trial: lang === "fr" ? "Essai" : "Trial",
    suspended: lang === "fr" ? "Suspendu" : "Suspended",
  }
  return map[status] || status
}

function formatExportValue(hospital, key, lang = "fr") {
  const value = hospital[key]
  if (value == null || value === "") return ""
  if (key === "status") return formatStatus(value, lang)
  if (key === "mrr") return Number(value) || 0
  if (key === "users") return Number(value) || 0
  return value
}

function cellRef(row, col) {
  return XLSX.utils.encode_cell({ r: row, c: col })
}

function setCell(ws, row, col, value, style) {
  const ref = cellRef(row, col)
  const type = typeof value === "number" ? "n" : "s"
  ws[ref] = { v: value, t: type, s: style }
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
    fill: { fgColor: { rgb: "BFDBFE" }, patternType: "solid" },
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

function statusStyle(status, bgColor) {
  const styles = {
    active: { color: COLORS.active, bg: COLORS.activeBg },
    trial: { color: COLORS.trial, bg: COLORS.trialBg },
    suspended: { color: COLORS.suspended, bg: COLORS.suspendedBg },
  }
  const s = styles[status] || { color: COLORS.metaText, bg: bgColor }
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: s.color } },
    fill: { fgColor: { rgb: s.bg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function planStyle(plan, bgColor) {
  const normalized = String(plan || "").toLowerCase()
  let color = COLORS.planStarter
  let bg = COLORS.planStarterBg
  if (normalized.includes("growth") || normalized.includes("croissance")) {
    color = COLORS.planGrowth
    bg = COLORS.planGrowthBg
  } else if (normalized.includes("enterprise")) {
    color = COLORS.planEnterprise
    bg = COLORS.planEnterpriseBg
  }
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: color } },
    fill: { fgColor: { rgb: bg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function mrrStyle(bgColor) {
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.mrr } },
    fill: { fgColor: { rgb: COLORS.mrrBg }, patternType: "solid" },
    alignment: { horizontal: "right", vertical: "center" },
    border: baseBorder(),
    numFmt: '"$"#,##0',
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
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.mrr } },
    fill: { fgColor: { rgb: COLORS.summary }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
    numFmt: '"$"#,##0',
  }
}

function footerStyle() {
  return {
    font: { name: "Calibri", sz: 9, italic: true, color: { rgb: COLORS.metaText } },
    fill: { fgColor: { rgb: COLORS.primaryLight }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
  }
}

/**
 * Exporte la liste des hôpitaux vers un fichier Excel stylisé (Super Admin).
 */
export function exportHospitalsToExcel(hospitals, options = {}) {
  if (!hospitals?.length) {
    throw new Error("EMPTY")
  }

  const {
    exportedBy = "",
    lang = "fr",
    sheetSubtitle,
    platformName = "ShambuaSante",
    filterSummary = "",
  } = options

  const colCount = EXPORT_COLUMNS.length
  const headerRowIndex = 4
  const dataStartRow = 5
  const summaryRowIndex = dataStartRow + hospitals.length
  const footerRowIndex = summaryRowIndex + 1
  const totalRows = footerRowIndex

  const totalUsers = hospitals.reduce((sum, h) => sum + (Number(h.users) || 0), 0)
  const totalMrr = hospitals.reduce((sum, h) => sum + (Number(h.mrr) || 0), 0)

  const ws = {}
  const merges = []
  const rows = []
  const cols = EXPORT_COLUMNS.map((col) => ({ wch: col.width }))

  const mergeFullRow = (row) => {
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  }

  const mergeRange = (row, startCol, endCol) => {
    merges.push({ s: { r: row, c: startCol }, e: { r: row, c: endCol } })
  }

  setCell(ws, 0, 0, "SHAMBUA SANTÉ", titleStyle())
  mergeFullRow(0)
  rows[0] = { hpt: 42 }

  setCell(
    ws,
    1,
    0,
    sheetSubtitle || (lang === "fr" ? "REGISTRE DES HÔPITALS CLIENTS" : "HOSPITAL TENANT REGISTRY"),
    subtitleStyle(),
  )
  mergeFullRow(1)
  rows[1] = { hpt: 28 }

  const metaParts = [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    `${lang === "fr" ? "Total" : "Total"} : ${hospitals.length} ${lang === "fr" ? "hôpital(aux)" : "hospital(s)"}`,
    `${lang === "fr" ? "Utilisateurs" : "Users"} : ${totalUsers}`,
    `${lang === "fr" ? "MRR cumulé" : "Total MRR"} : $${totalMrr.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}`,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    filterSummary || null,
    platformName,
  ].filter(Boolean)
  setCell(ws, 2, 0, metaParts.join("   •   "), metaStyle())
  mergeFullRow(2)
  rows[2] = { hpt: 26 }

  rows[3] = { hpt: 8 }

  EXPORT_COLUMNS.forEach((col, c) => {
    setCell(ws, headerRowIndex, c, col.label, headerStyle())
  })
  rows[headerRowIndex] = { hpt: 28 }

  hospitals.forEach((hospital, index) => {
    const row = dataStartRow + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    EXPORT_COLUMNS.forEach((col, c) => {
      const value = formatExportValue(hospital, col.key, lang)
      if (col.key === "status") {
        setCell(ws, row, c, value, statusStyle(hospital.status, bg))
      } else if (col.key === "plan") {
        setCell(ws, row, c, value, planStyle(hospital.plan, bg))
      } else if (col.key === "mrr") {
        setCell(ws, row, c, value, mrrStyle(bg))
      } else if (col.key === "users") {
        setCell(ws, row, c, value, numberStyle(bg))
      } else {
        setCell(ws, row, c, value, dataStyle(bg))
      }
    })
    rows[row] = { hpt: 22 }
  })

  const usersCol = EXPORT_COLUMNS.findIndex((c) => c.key === "users")
  const mrrCol = EXPORT_COLUMNS.findIndex((c) => c.key === "mrr")
  const summaryLabelCol = Math.max(0, usersCol - 2)

  setCell(
    ws,
    summaryRowIndex,
    summaryLabelCol,
    lang === "fr" ? "TOTAUX (liste filtrée)" : "TOTALS (filtered list)",
    summaryStyle(),
  )
  mergeRange(summaryRowIndex, summaryLabelCol, usersCol - 1)
  setCell(ws, summaryRowIndex, usersCol, totalUsers, numberStyle(COLORS.summary))
  setCell(ws, summaryRowIndex, mrrCol, totalMrr, summaryValueStyle())
  rows[summaryRowIndex] = { hpt: 24 }

  const footerText =
    lang === "fr"
      ? `Document généré par ${platformName} — Plateforme SaaS — Confidentiel`
      : `Document generated by ${platformName} — SaaS Platform — Confidential`
  setCell(ws, footerRowIndex, 0, footerText, footerStyle())
  mergeFullRow(footerRowIndex)
  rows[footerRowIndex] = { hpt: 20 }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows, c: colCount - 1 } })
  ws["!merges"] = merges
  ws["!cols"] = cols
  ws["!rows"] = rows

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, ws, lang === "fr" ? "Hôpitaux" : "Hospitals")

  const filename = buildFilename()
  XLSX.writeFile(workbook, filename)

  return { filename, count: hospitals.length, totalUsers, totalMrr }
}
