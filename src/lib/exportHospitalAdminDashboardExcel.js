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
  chart1: "14B8A6",
  chart1Bg: "CCFBF1",
  chart2: "3B82F6",
  chart2Bg: "DBEAFE",
  chart3: "8B5CF6",
  chart3Bg: "EDE9FE",
  warning: "D97706",
  warningBg: "FEF3C7",
  destructive: "DC2626",
  destructiveBg: "FEE2E2",
  success: "059669",
  successBg: "D1FAE5",
  summary: "F1F5F9",
  summaryText: "334155",
  summaryValue: "0F766E",
  chartHeader: "7C3AED",
  kpiPrimary: "0D9488",
  kpiAccent: "2563EB",
  kpiSecondary: "7C3AED",
  kpiWarning: "D97706",
}

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
  const slug = slugify(hospitalName) || (hopitalId != null ? `hopital_${hopitalId}` : "dashboard")
  return `Dashboard_${slug}_${stamp}.xlsx`
}

function formatExportDate(lang = "fr") {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date())
}

function formatCurrency(value, lang = "fr") {
  const num = Number(value) || 0
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(num)
}

function formatDelta(delta) {
  const n = Number(delta) || 0
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`
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
    font: { name: "Calibri", sz: 16, bold: true, color: { rgb: color } },
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

function deltaStyle(positive) {
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: positive ? COLORS.success : COLORS.destructive } },
    fill: { fgColor: { rgb: positive ? COLORS.successBg : COLORS.destructiveBg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
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
  const mergeFullRow = (row) => {
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  }
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

function buildSummarySheet(dashboard, labels, options) {
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const kpis = dashboard?.kpis || {}
  const colCount = 4
  const ws = {}
  const merges = []
  const rows = []
  const cols = [{ wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]

  buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.summarySubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  const kpiDefs = [
    { key: "totalPatients", label: labels.totalPatients, color: COLORS.kpiPrimary, bg: COLORS.chart1Bg },
    { key: "activeConsultations", label: labels.activeConsultations, color: COLORS.kpiAccent, bg: COLORS.chart2Bg },
    { key: "revenueMtd", label: labels.revenue, color: COLORS.kpiSecondary, bg: COLORS.chart3Bg, format: "currency" },
  ]

  let row = 4
  merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  setCell(ws, row, 0, labels.kpiSection, headerStyle(COLORS.chartHeader))
  rows[row] = { hpt: 26 }
  row += 1

  for (let i = 0; i < kpiDefs.length; i += 2) {
    const left = kpiDefs[i]
    const right = kpiDefs[i + 1]
    setCell(ws, row, 0, left.label, metricLabelStyle(left.bg))
    setCell(ws, row, 1, right?.label || "", right ? metricLabelStyle(right.bg) : dataStyle(COLORS.white))
    rows[row] = { hpt: 22 }
    row += 1

    const leftVal = kpis[left.key]?.value ?? 0
    const rightVal = right ? (kpis[right.key]?.value ?? 0) : ""
    setCell(
      ws,
      row,
      0,
      left.format === "currency" ? formatCurrency(leftVal, lang) : `${leftVal}${left.suffix || ""}`,
      metricStyle(left.color, left.bg),
    )
    if (right) {
      setCell(
        ws,
        row,
        1,
        right.format === "currency" ? formatCurrency(rightVal, lang) : `${rightVal}${right.suffix || ""}`,
        metricStyle(right.color, right.bg),
      )
    }
    rows[row] = { hpt: 32 }
    row += 1

    setCell(ws, row, 0, formatDelta(kpis[left.key]?.delta), deltaStyle((kpis[left.key]?.delta ?? 0) >= 0))
    if (right) {
      setCell(ws, row, 1, formatDelta(kpis[right.key]?.delta), deltaStyle((kpis[right.key]?.delta ?? 0) >= 0))
    }
    rows[row] = { hpt: 22 }
    row += 2
  }

  const footerRow = row
  const footerText =
    lang === "fr"
      ? `Rapport exécutif — ${hospitalName} — ${platformName}`
      : `Executive report — ${hospitalName} — ${platformName}`
  setCell(ws, footerRow, 0, footerText, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }

  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

function buildRevenueSheet(dashboard, labels, options) {
  const series = dashboard?.revenueSeries || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 6
  const cols = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }]
  const headers = [labels.month, labels.inpatient, labels.outpatient, labels.tele, labels.total, labels.visual]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.revenueSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  headers.forEach((h, c) => {
    const bg = c === 1 ? COLORS.chart1 : c === 2 ? COLORS.chart2 : c === 3 ? COLORS.chart3 : COLORS.header
    setCell(ws, headerRow, c, h, headerStyle(c >= 1 && c <= 3 ? bg : COLORS.header))
  })
  rows[headerRow] = { hpt: 28 }

  const maxTotal = Math.max(
    ...series.map((p) => (Number(p.inpatient) || 0) + (Number(p.outpatient) || 0) + (Number(p.tele) || 0)),
    1,
  )

  series.forEach((point, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const inp = Number(point.inpatient) || 0
    const out = Number(point.outpatient) || 0
    const tele = Number(point.tele) || 0
    const total = inp + out + tele

    setCell(ws, row, 0, point.month || "", dataStyle(bg))
    setCell(ws, row, 1, inp, chartValueStyle(COLORS.chart1, COLORS.chart1Bg))
    setCell(ws, row, 2, out, chartValueStyle(COLORS.chart2, COLORS.chart2Bg))
    setCell(ws, row, 3, tele, chartValueStyle(COLORS.chart3, COLORS.chart3Bg))
    setCell(ws, row, 4, Number(total.toFixed(2)), chartValueStyle(COLORS.summaryValue, COLORS.summary))
    setCell(ws, row, 5, visualBar(total, maxTotal), barVisualStyle(COLORS.chart1))
    rows[row] = { hpt: 24 }
  })

  const footerRow = headerRow + 1 + series.length
  setCell(ws, footerRow, 0, labels.revenueNote, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }

  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

function buildPatientFlowSheet(dashboard, labels, options) {
  const flow = dashboard?.patientFlow || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 5
  const cols = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 22 }]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.flowSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  const headers = [labels.day, labels.admissions, labels.discharges, labels.admissionsBar, labels.dischargesBar]
  headers.forEach((h, c) => {
    const bg = c === 1 ? COLORS.chart1 : c === 2 ? COLORS.chart2 : COLORS.header
    setCell(ws, headerRow, c, h, headerStyle(c === 1 || c === 2 ? bg : COLORS.header))
  })
  rows[headerRow] = { hpt: 28 }

  const maxAdm = Math.max(...flow.map((p) => Number(p.admissions) || 0), 1)
  const maxDis = Math.max(...flow.map((p) => Number(p.discharges) || 0), 1)

  flow.forEach((point, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const dayLabel = labels.days?.[point.dayKey] || point.dayKey || point.day || ""
    const adm = Number(point.admissions) || 0
    const dis = Number(point.discharges) || 0

    setCell(ws, row, 0, dayLabel, dataStyle(bg))
    setCell(ws, row, 1, adm, chartValueStyle(COLORS.chart1, COLORS.chart1Bg))
    setCell(ws, row, 2, dis, chartValueStyle(COLORS.chart2, COLORS.chart2Bg))
    setCell(ws, row, 3, visualBar(adm, maxAdm), barVisualStyle(COLORS.chart1))
    setCell(ws, row, 4, visualBar(dis, maxDis), barVisualStyle(COLORS.chart2))
    rows[row] = { hpt: 24 }
  })

  const footerRow = headerRow + 1 + flow.length
  setCell(ws, footerRow, 0, labels.flowNote, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }

  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "")
  if (h.length !== 6) return COLORS.chart1
  return h.toUpperCase()
}

function buildDepartmentSheet(dashboard, labels, options) {
  const depts = dashboard?.departmentLoad || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 4
  const cols = [{ wch: 24 }, { wch: 12 }, { wch: 28 }, { wch: 10 }]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.deptSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  ;[labels.department, labels.load, labels.visual, labels.status].forEach((h, c) => {
    setCell(ws, headerRow, c, h, headerStyle(COLORS.chartHeader))
  })
  rows[headerRow] = { hpt: 28 }

  depts.forEach((dept, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const value = Number(dept.value) || 0
    const color = hexToRgb(dept.color)
    const status =
      value >= 85 ? labels.critical : value >= 70 ? labels.high : labels.normal

    setCell(ws, row, 0, dept.name || "", dataStyle(bg))
    setCell(ws, row, 1, `${value}%`, chartValueStyle(color, COLORS.chart1Bg))
    setCell(ws, row, 2, visualBar(value, 100, 20), barVisualStyle(color))
    setCell(
      ws,
      row,
      3,
      status,
      value >= 85
        ? deltaStyle(false)
        : value >= 70
          ? {
              font: { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.warning } },
              fill: { fgColor: { rgb: COLORS.warningBg }, patternType: "solid" },
              alignment: { horizontal: "center", vertical: "center" },
              border: baseBorder(),
            }
          : deltaStyle(true),
    )
    rows[row] = { hpt: 26 }
  })

  const footerRow = headerRow + 1 + depts.length
  setCell(ws, footerRow, 0, labels.deptNote, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }

  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

function buildAlertsSheet(dashboard, labels, options) {
  const alerts = dashboard?.emergencyAlerts || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 4
  const cols = [{ wch: 10 }, { wch: 28 }, { wch: 16 }, { wch: 16 }]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.alertsSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  ;[labels.level, labels.alertTitle, labels.deptCol, labels.timeCol].forEach((h, c) => {
    setCell(ws, headerRow, c, h, headerStyle(COLORS.destructive))
  })
  rows[headerRow] = { hpt: 28 }

  if (alerts.length === 0) {
    const row = headerRow + 1
    setCell(ws, row, 0, labels.noAlerts, dataStyle(COLORS.white))
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
    rows[row] = { hpt: 24 }
  }

  alerts.forEach((alert, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const isCritical = alert.level === "critical"
    const title = lang === "fr" ? alert.titleFr || alert.title : alert.title

    setCell(ws, row, 0, isCritical ? labels.critical : labels.warning, isCritical ? deltaStyle(false) : deltaStyle(true))
    setCell(ws, row, 1, title || "", dataStyle(bg))
    setCell(ws, row, 2, alert.dept || "", dataStyle(bg))
    setCell(ws, row, 3, alert.time || "", dataStyle(bg))
    rows[row] = { hpt: 24 }
  })

  const footerRow = headerRow + 1 + Math.max(alerts.length, 1)
  setCell(ws, footerRow, 0, labels.alertsNote, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }

  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

function buildInsightsSheet(dashboard, labels, options) {
  const insights = dashboard?.aiInsights || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 3
  const cols = [{ wch: 14 }, { wch: 28 }, { wch: 48 }]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.insightsSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  ;[labels.type, labels.title, labels.detail].forEach((h, c) => {
    setCell(ws, headerRow, c, h, headerStyle(COLORS.chart3))
  })
  rows[headerRow] = { hpt: 28 }

  insights.forEach((ins, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const title = lang === "fr" ? ins.titleFr || ins.title : ins.title
    const detail = lang === "fr" ? ins.detailFr || ins.detail : ins.detail
    const toneBg = ins.tone === "warning" ? COLORS.warningBg : ins.tone === "destructive" ? COLORS.destructiveBg : COLORS.chart3Bg

    setCell(ws, row, 0, ins.tone || "insight", metricLabelStyle(toneBg))
    setCell(ws, row, 1, title || "", dataStyle(bg))
    setCell(ws, row, 2, detail || "", dataStyle(bg))
    rows[row] = { hpt: 28 }
  })

  const footerRow = headerRow + 1 + insights.length
  setCell(ws, footerRow, 0, labels.insightsNote, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }

  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

function buildTimelineSheet(dashboard, labels, options) {
  const timeline = dashboard?.activityTimeline || []
  const { hospitalName, hopitalId, exportedBy, lang, platformName } = options
  const colCount = 3
  const cols = [{ wch: 16 }, { wch: 48 }, { wch: 20 }]
  const ws = {}
  const merges = []
  const rows = []

  const headerRow = buildSheetHeader(ws, merges, rows, colCount, hospitalName, labels.timelineSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  ;[labels.time, labels.event, labels.actor].forEach((h, c) => {
    setCell(ws, headerRow, c, h, headerStyle(COLORS.chart2))
  })
  rows[headerRow] = { hpt: 28 }

  if (timeline.length === 0) {
    const row = headerRow + 1
    setCell(ws, row, 0, labels.noActivity, dataStyle(COLORS.white))
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
    rows[row] = { hpt: 24 }
  }

  timeline.forEach((event, index) => {
    const row = headerRow + 1 + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    const text = lang === "fr" ? event.textFr || event.text : event.text

    setCell(ws, row, 0, event.time || "", dataStyle(bg))
    setCell(ws, row, 1, text || "", dataStyle(bg))
    setCell(ws, row, 2, event.actor || "", dataStyle(bg))
    rows[row] = { hpt: 24 }
  })

  const footerRow = headerRow + 1 + Math.max(timeline.length, 1)
  setCell(ws, footerRow, 0, labels.timelineNote, footerStyle())
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: colCount - 1 } })
  rows[footerRow] = { hpt: 20 }

  return finalizeSheet(ws, merges, rows, cols, footerRow, colCount)
}

/**
 * Exporte le tableau de bord admin hôpital vers Excel (KPIs + tous les diagrammes).
 */
export function exportHospitalAdminDashboardToExcel(dashboard, options = {}) {
  const {
    hopitalId,
    hospitalName = "Shambua Santé",
    exportedBy = "",
    lang = "fr",
    platformName = "ShambuaSante",
    labels = {},
  } = options

  if (!dashboard) {
    throw new Error("EMPTY")
  }

  const workbook = XLSX.utils.book_new()
  const baseOptions = { hospitalName, hopitalId, exportedBy, lang, platformName }

  const sheetNames = lang === "fr"
    ? { summary: "Synthèse", revenue: "Revenus", flow: "Flux patients", dept: "Charge services", alerts: "Alertes", insights: "Analyses IA", timeline: "Activité" }
    : { summary: "Summary", revenue: "Revenue", flow: "Patient flow", dept: "Departments", alerts: "Alerts", insights: "AI insights", timeline: "Activity" }

  XLSX.utils.book_append_sheet(workbook, buildSummarySheet(dashboard, labels, baseOptions), sheetNames.summary)
  XLSX.utils.book_append_sheet(workbook, buildRevenueSheet(dashboard, labels, baseOptions), sheetNames.revenue)
  XLSX.utils.book_append_sheet(workbook, buildPatientFlowSheet(dashboard, labels, baseOptions), sheetNames.flow)
  XLSX.utils.book_append_sheet(workbook, buildDepartmentSheet(dashboard, labels, baseOptions), sheetNames.dept)
  XLSX.utils.book_append_sheet(workbook, buildAlertsSheet(dashboard, labels, baseOptions), sheetNames.alerts)
  XLSX.utils.book_append_sheet(workbook, buildInsightsSheet(dashboard, labels, baseOptions), sheetNames.insights)
  XLSX.utils.book_append_sheet(workbook, buildTimelineSheet(dashboard, labels, baseOptions), sheetNames.timeline)

  const filename = buildFilename(hospitalName, hopitalId)
  XLSX.writeFile(workbook, filename)

  return {
    filename,
    sheets: Object.keys(sheetNames).length,
    hospitalName,
  }
}
