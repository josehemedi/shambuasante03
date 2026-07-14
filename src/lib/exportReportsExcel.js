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
  chart1: "0EA5E9",
  chart1Bg: "E0F2FE",
  chart2: "8B5CF6",
  chart2Bg: "EDE9FE",
  chart3: "10B981",
  chart3Bg: "D1FAE5",
  chart4: "F97316",
  chart4Bg: "FFEDD5",
  success: "059669",
  successBg: "D1FAE5",
  summary: "F1F5F9",
  summaryValue: "0F766E",
  chartHeader: "7C3AED",
}

const PIE_COLORS = ["0EA5E9", "8B5CF6", "10B981", "F97316"]

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
  const slug = slugify(hospitalName) || (hopitalId != null ? `hopital_${hopitalId}` : "rapports")
  return `Rapports_${slug}_${stamp}.xlsx`
}

function formatExportDate(lang = "fr") {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date())
}

function formatCurrency(value, lang = "fr") {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function cellRef(row, col) {
  return XLSX.utils.encode_cell({ r: row, c: col })
}

function setCell(ws, row, col, value, style) {
  const ref = cellRef(row, col)
  const isNumber = typeof value === "number" && !Number.isNaN(value)
  ws[ref] = { v: value, t: isNumber ? "n" : "s", s: style }
}

function baseBorder() {
  return {
    top: { style: "thin", color: { rgb: COLORS.border } },
    bottom: { style: "thin", color: { rgb: COLORS.border } },
    left: { style: "thin", color: { rgb: COLORS.border } },
    right: { style: "thin", color: { rgb: COLORS.border } },
  }
}

function titleStyle(bg = COLORS.primary) {
  return {
    font: { name: "Calibri", sz: 20, bold: true, color: { rgb: COLORS.headerText } },
    fill: { fgColor: { rgb: bg }, patternType: "solid" },
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

function headerStyle(bg = COLORS.header) {
  return {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.headerText } },
    fill: { fgColor: { rgb: bg }, patternType: "solid" },
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

function metricStyle(color, bg) {
  return {
    font: { name: "Calibri", sz: 14, bold: true, color: { rgb: color } },
    fill: { fgColor: { rgb: bg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function metricLabelStyle(bg) {
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.subtitleText } },
    fill: { fgColor: { rgb: bg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: baseBorder(),
  }
}

function chartValueStyle(color, bg) {
  return {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: color } },
    fill: { fgColor: { rgb: bg }, patternType: "solid" },
    alignment: { horizontal: "right", vertical: "center" },
    border: baseBorder(),
  }
}

function barVisualStyle(color) {
  return {
    font: { name: "Consolas", sz: 10, color: { rgb: color } },
    fill: { fgColor: { rgb: COLORS.white }, patternType: "solid" },
    alignment: { horizontal: "left", vertical: "center" },
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

function visualBar(value, max, segments = 16) {
  const ratio = Math.min(1, Math.max(0, (Number(value) || 0) / (max || 1)))
  const filled = Math.round(ratio * segments)
  return `${"█".repeat(filled)}${"░".repeat(segments - filled)}`
}

function buildSheetHeader(ws, merges, rows, colCount, hospitalName, sheetSubtitle, metaParts) {
  const mergeFullRow = (row) => merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  setCell(ws, 0, 0, hospitalName.toUpperCase(), titleStyle())
  mergeFullRow(0)
  rows[0] = { hpt: 42 }
  setCell(ws, 1, 0, sheetSubtitle, subtitleStyle())
  mergeFullRow(1)
  rows[1] = { hpt: 28 }
  setCell(ws, 2, 0, metaParts.filter(Boolean).join("   •   "), metaStyle())
  mergeFullRow(2)
  rows[2] = { hpt: 28 }
  rows[3] = { hpt: 8 }
  return 4
}

function finalizeSheet(ws, merges, rows, cols, totalRows, colCount) {
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows, c: colCount - 1 } })
  ws["!merges"] = merges
  ws["!cols"] = cols
  ws["!rows"] = rows
  return ws
}

function buildSummarySheet(data, labels, options) {
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 4
  const ws = {}
  const merges = []
  const rows = []
  const cols = [{ wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]

  buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.summarySubtitle, [
    `${labels.period} : ${data.dateFrom} → ${data.dateTo}`,
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  const kpis = [
    { label: labels.totalPatients, value: data.totalPatients, color: COLORS.chart1, bg: COLORS.chart1Bg },
    { label: labels.totalAppointments, value: data.totalAppointments, color: COLORS.chart2, bg: COLORS.chart2Bg },
    { label: labels.totalRevenue, value: formatCurrency(data.totalRevenue, lang), color: COLORS.chart3, bg: COLORS.chart3Bg, text: true },
    { label: labels.totalInvoices, value: data.totalInvoices, color: COLORS.chart4, bg: COLORS.chart4Bg },
  ]

  let row = 4
  merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  setCell(ws, row, 0, labels.kpiSection, headerStyle(COLORS.chartHeader))
  rows[row] = { hpt: 26 }
  row += 1

  for (let i = 0; i < kpis.length; i += 2) {
    const left = kpis[i]
    const right = kpis[i + 1]
    setCell(ws, row, 0, left.label, metricLabelStyle(left.bg))
    setCell(ws, row, 1, right?.label || "", right ? metricLabelStyle(right.bg) : dataStyle(COLORS.white))
    rows[row] = { hpt: 22 }
    row += 1
    setCell(ws, row, 0, left.text ? left.value : left.value, metricStyle(left.color, left.bg))
    if (right) {
      setCell(ws, row, 1, right.text ? right.value : right.value, metricStyle(right.color, right.bg))
    }
    rows[row] = { hpt: 30 }
    row += 2
  }

  setCell(ws, row, 0, labels.summaryNote, footerStyle())
  merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  rows[row] = { hpt: 20 }
  return finalizeSheet(ws, merges, rows, cols, row, colCount)
}

function buildAppointmentsSheet(data, labels, options) {
  const series = data.monthlyAppointments || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 6
  const cols = [{ wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 22 }]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.appointmentsSubtitle, [
    `${labels.period} : ${data.dateFrom} → ${data.dateTo}`,
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  ;[labels.month, labels.consultation, labels.followUp, labels.total, labels.share, labels.visual].forEach((h, c) => {
    const bg = c === 1 ? COLORS.chart1 : c === 2 ? COLORS.chart2 : COLORS.header
    setCell(ws, headerRow, c, h, headerStyle(c === 1 || c === 2 ? bg : COLORS.header))
  })
  rows[headerRow] = { hpt: 28 }

  const maxTotal = Math.max(...series.map((p) => Number(p.total) || 0), 1)
  series.forEach((point, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const total = Number(point.total) || 0
    const consultation = Number(point.consultation) || 0
    const followUp = Number(point.followUp) || 0
    const share = total > 0 ? `${Math.round((consultation / total) * 100)}%` : "0%"

    setCell(ws, row, 0, point.name || "", dataStyle(bg))
    setCell(ws, row, 1, consultation, chartValueStyle(COLORS.chart1, COLORS.chart1Bg))
    setCell(ws, row, 2, followUp, chartValueStyle(COLORS.chart2, COLORS.chart2Bg))
    setCell(ws, row, 3, total, chartValueStyle(COLORS.summaryValue, COLORS.summary))
    setCell(ws, row, 4, share, dataStyle(bg))
    setCell(ws, row, 5, visualBar(total, maxTotal), barVisualStyle(COLORS.chart1))
    rows[row] = { hpt: 24 }
  })

  const footerRow = headerRow + 1 + series.length
  setCell(ws, footerRow, 0, labels.appointmentsNote, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }
  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

function buildRevenueSheet(data, labels, options) {
  const series = data.revenueSeries || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 4
  const cols = [{ wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 22 }]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.revenueSubtitle, [
    `${labels.period} : ${data.dateFrom} → ${data.dateTo}`,
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  ;[labels.month, labels.revenue, labels.share, labels.visual].forEach((h, c) => {
    setCell(ws, headerRow, c, h, headerStyle(c === 1 ? COLORS.chart3 : COLORS.header))
  })
  rows[headerRow] = { hpt: 28 }

  const maxRevenue = Math.max(...series.map((p) => Number(p.revenue) || 0), 1)
  let periodTotal = 0
  series.forEach((point, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const revenue = Number(point.revenue) || 0
    periodTotal += revenue
    setCell(ws, row, 0, point.name || "", dataStyle(bg))
    setCell(ws, row, 1, revenue, chartValueStyle(COLORS.chart3, COLORS.chart3Bg))
    setCell(ws, row, 2, formatCurrency(revenue, lang), dataStyle(bg))
    setCell(ws, row, 3, visualBar(revenue, maxRevenue), barVisualStyle(COLORS.chart3))
    rows[row] = { hpt: 24 }
  })

  const footerRow = headerRow + 1 + series.length
  setCell(ws, footerRow, 0, `${labels.periodTotal} : ${formatCurrency(periodTotal, lang)}`, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }
  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

function buildDemographicsSheet(data, labels, options) {
  const demographics = data.patientDemographics || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 5
  const cols = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 10 }]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.demographicsSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  ;[labels.ageGroup, labels.patients, labels.share, labels.visual, labels.color].forEach((h, c) => {
    setCell(ws, headerRow, c, h, headerStyle(COLORS.chartHeader))
  })
  rows[headerRow] = { hpt: 28 }

  const total = demographics.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 1
  demographics.forEach((entry, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const value = Number(entry.value) || 0
    const color = (entry.color || PIE_COLORS[index % PIE_COLORS.length]).replace("#", "")
    const label = lang === "fr" ? entry.nameFr || entry.name : entry.name
    const share = `${Math.round((value / total) * 100)}%`

    setCell(ws, row, 0, label, dataStyle(bg))
    setCell(ws, row, 1, value, chartValueStyle(color, COLORS.chart1Bg))
    setCell(ws, row, 2, share, dataStyle(bg))
    setCell(ws, row, 3, visualBar(value, total), barVisualStyle(color))
    setCell(ws, row, 4, `#${color}`, metricLabelStyle(COLORS.white))
    rows[row] = { hpt: 24 }
  })

  const footerRow = headerRow + 1 + demographics.length
  setCell(ws, footerRow, 0, `${labels.totalPatients} : ${total}`, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }
  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

export function exportReportsToExcel(data, options = {}) {
  const {
    hopitalId,
    hospitalName = "Shambua Santé",
    exportedBy = "",
    lang = "fr",
    platformName = "ShambuaSante",
    labels = {},
  } = options

  if (!data) throw new Error("EMPTY")

  const workbook = XLSX.utils.book_new()
  const baseOptions = { hospitalName, hopitalId, exportedBy, lang, platformName }
  const sheetNames =
    lang === "fr"
      ? { summary: "Synthèse", appointments: "Rendez-vous", revenue: "Revenus", demographics: "Démographie" }
      : { summary: "Summary", appointments: "Appointments", revenue: "Revenue", demographics: "Demographics" }

  XLSX.utils.book_append_sheet(workbook, buildSummarySheet(data, labels, baseOptions), sheetNames.summary)
  XLSX.utils.book_append_sheet(workbook, buildAppointmentsSheet(data, labels, baseOptions), sheetNames.appointments)
  XLSX.utils.book_append_sheet(workbook, buildRevenueSheet(data, labels, baseOptions), sheetNames.revenue)
  XLSX.utils.book_append_sheet(workbook, buildDemographicsSheet(data, labels, baseOptions), sheetNames.demographics)

  const filename = buildFilename(hospitalName, hopitalId)
  XLSX.writeFile(workbook, filename)
  return { filename, sheets: 4, hospitalName }
}
