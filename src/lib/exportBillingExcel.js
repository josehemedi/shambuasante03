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
  paid: "059669",
  paidBg: "D1FAE5",
  pending: "D97706",
  pendingBg: "FEF3C7",
  overdue: "DC2626",
  overdueBg: "FEE2E2",
  partial: "2563EB",
  partialBg: "DBEAFE",
  cancelled: "64748B",
  cancelledBg: "F1F5F9",
  amount: "0F766E",
  amountBg: "99F6E4",
  code: "1D4ED8",
  codeBg: "EFF6FF",
  summary: "F1F5F9",
  summaryText: "334155",
  summaryValue: "0F766E",
  chartHeader: "7C3AED",
  chartHeaderBg: "EDE9FE",
  revenueBar: "14B8A6",
  revenueBarBg: "CCFBF1",
}

const INVOICE_COLUMNS = [
  { key: "numeroFacture", width: 18 },
  { key: "patient", width: 22 },
  { key: "date", width: 14 },
  { key: "service", width: 32 },
  { key: "montantHt", width: 14 },
  { key: "tva", width: 10 },
  { key: "montantTtc", width: 16 },
  { key: "status", width: 14 },
]

const REVENUE_COLUMNS = [
  { key: "label", width: 14 },
  { key: "year", width: 10 },
  { key: "revenue", width: 18 },
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
  const slug = slugify(hospitalName) || (hopitalId != null ? `hopital_${hopitalId}` : "facturation")
  return `Facturation_${slug}_${stamp}.xlsx`
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

function formatDateValue(value, lang = "fr") {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).split("T")[0]
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
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

function statusStyle(status) {
  const map = {
    paid: { color: COLORS.paid, bg: COLORS.paidBg },
    pending: { color: COLORS.pending, bg: COLORS.pendingBg },
    overdue: { color: COLORS.overdue, bg: COLORS.overdueBg },
    partial: { color: COLORS.partial, bg: COLORS.partialBg },
    cancelled: { color: COLORS.cancelled, bg: COLORS.cancelledBg },
  }
  const s = map[status] || map.pending
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: s.color } },
    fill: { fgColor: { rgb: s.bg }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border: baseBorder(),
  }
}

function amountStyle(bgColor) {
  return {
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.amount } },
    fill: { fgColor: { rgb: bgColor === COLORS.white ? COLORS.amountBg : bgColor }, patternType: "solid" },
    alignment: { horizontal: "right", vertical: "center" },
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

function revenueBarStyle(bgColor) {
  return {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.revenueBar } },
    fill: { fgColor: { rgb: bgColor }, patternType: "solid" },
    alignment: { horizontal: "right", vertical: "center" },
    border: baseBorder(),
  }
}

function computeInvoiceSummary(invoices) {
  const summary = {
    total: invoices.length,
    paid: 0,
    pending: 0,
    overdue: 0,
    partial: 0,
    cancelled: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
  }
  invoices.forEach((inv) => {
    const amount = Number(inv.amount) || 0
    summary.totalAmount += amount
    switch (inv.status) {
      case "paid":
        summary.paid += 1
        summary.paidAmount += amount
        break
      case "overdue":
        summary.overdue += 1
        summary.outstandingAmount += amount
        break
      case "partial":
        summary.partial += 1
        summary.outstandingAmount += amount
        break
      case "cancelled":
        summary.cancelled += 1
        break
      default:
        summary.pending += 1
        summary.outstandingAmount += amount
        break
    }
  })
  return summary
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

function buildInvoicesSheet(invoices, options) {
  const {
    hospitalName,
    hopitalId,
    exportedBy,
    lang,
    sheetSubtitle,
    platformName,
    filterSummary,
    columnLabels = {},
    statusLabels = {},
    summaryLabels = {},
    kpis = {},
  } = options

  const columns = INVOICE_COLUMNS.map((col) => ({
    ...col,
    label: columnLabels[col.key] || col.key,
  }))
  const colCount = columns.length
  const headerRowIndex = 4
  const dataStartRow = 5
  const summaryRowIndex = dataStartRow + invoices.length
  const footerRowIndex = summaryRowIndex + 1
  const totalRows = footerRowIndex

  const stats = computeInvoiceSummary(invoices)
  const ws = {}
  const merges = []
  const rows = []
  const cols = columns.map((col) => ({ wch: col.width }))

  const kpiMeta =
    lang === "fr"
      ? `CA annuel : ${formatCurrency(kpis.totalRevenueYtd, lang)}   |   Payé : ${formatCurrency(kpis.totalPaid, lang)}   |   Impayé : ${formatCurrency(kpis.outstanding, lang)}`
      : `YTD revenue : ${formatCurrency(kpis.totalRevenueYtd, lang)}   |   Paid : ${formatCurrency(kpis.totalPaid, lang)}   |   Outstanding : ${formatCurrency(kpis.outstanding, lang)}`

  buildSheetHeader(ws, merges, rows, colCount, hospitalName, sheetSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    `${lang === "fr" ? "Total" : "Total"} : ${stats.total} ${lang === "fr" ? "facture(s)" : "invoice(s)"}`,
    hopitalId != null
      ? lang === "fr"
        ? `Établissement n°${hopitalId}`
        : `Facility #${hopitalId}`
      : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    filterSummary || null,
    kpiMeta,
    platformName,
  ])

  columns.forEach((col, c) => {
    setCell(ws, headerRowIndex, c, col.label, headerStyle())
  })
  rows[headerRowIndex] = { hpt: 28 }

  invoices.forEach((invoice, index) => {
    const row = dataStartRow + index
    const bg = index % 2 === 1 ? COLORS.zebra : COLORS.white
    columns.forEach((col, c) => {
      let value
      if (col.key === "date") {
        value = formatDateValue(invoice.date, lang)
      } else if (col.key === "montantHt" || col.key === "montantTtc") {
        value = Number(invoice[col.key === "montantHt" ? "montantHt" : "amount"]) || 0
      } else if (col.key === "tva") {
        value = invoice.tva != null ? `${invoice.tva}%` : ""
      } else if (col.key === "status") {
        value = statusLabels[invoice.status] || invoice.status
      } else {
        value = invoice[col.key] ?? ""
      }

      let style = dataStyle(bg)
      if (col.key === "numeroFacture") style = codeStyle(bg)
      else if (col.key === "montantHt" || col.key === "montantTtc") style = amountStyle(bg)
      else if (col.key === "status") style = statusStyle(invoice.status)

      setCell(ws, row, c, value, style)
    })
    rows[row] = { hpt: 22 }
  })

  const mergeRange = (row, startCol, endCol) => {
    merges.push({ s: { r: row, c: startCol }, e: { r: row, c: endCol } })
  }

  const summaryTitle = summaryLabels.title || (lang === "fr" ? "SYNTHÈSE (liste filtrée)" : "SUMMARY (filtered list)")
  setCell(ws, summaryRowIndex, 0, summaryTitle, summaryStyle())
  mergeRange(summaryRowIndex, 0, 2)

  const paidLabel = summaryLabels.paid || (lang === "fr" ? "Payées" : "Paid")
  const pendingLabel = summaryLabels.pending || (lang === "fr" ? "En attente" : "Pending")
  const overdueLabel = summaryLabels.overdue || (lang === "fr" ? "En retard" : "Overdue")
  const partialLabel = summaryLabels.partial || (lang === "fr" ? "Partielles" : "Partial")

  setCell(ws, summaryRowIndex, 3, `${paidLabel}: ${stats.paid}`, summaryValueStyle())
  setCell(ws, summaryRowIndex, 4, `${pendingLabel}: ${stats.pending}`, summaryValueStyle())
  setCell(ws, summaryRowIndex, 5, `${overdueLabel}: ${stats.overdue}`, summaryValueStyle())
  setCell(ws, summaryRowIndex, 6, `${partialLabel}: ${stats.partial}`, summaryValueStyle())
  setCell(
    ws,
    summaryRowIndex,
    7,
    lang === "fr"
      ? `Montant total : ${formatCurrency(stats.totalAmount, lang)}`
      : `Total amount : ${formatCurrency(stats.totalAmount, lang)}`,
    summaryValueStyle(),
  )
  rows[summaryRowIndex] = { hpt: 26 }

  const footerText =
    lang === "fr"
      ? `Document confidentiel — ${hospitalName} — Généré par ${platformName} — Usage interne uniquement`
      : `Confidential document — ${hospitalName} — Generated by ${platformName} — Internal use only`
  setCell(ws, footerRowIndex, 0, footerText, footerStyle())
  merges.push({ s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: colCount - 1 } })
  rows[footerRowIndex] = { hpt: 20 }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows, c: colCount - 1 } })
  ws["!merges"] = merges
  ws["!cols"] = cols
  ws["!rows"] = rows

  return ws
}

function buildRevenueSheet(revenueSeries, options) {
  const { hospitalName, hopitalId, exportedBy, lang, platformName, columnLabels = {} } = options
  const columns = REVENUE_COLUMNS.map((col) => ({
    ...col,
    label: columnLabels[col.key] || col.key,
  }))
  const colCount = columns.length
  const headerRowIndex = 4
  const dataStartRow = 5
  const maxRevenue = Math.max(...revenueSeries.map((p) => Number(p.revenue) || 0), 1)
  const summaryRowIndex = dataStartRow + revenueSeries.length
  const footerRowIndex = summaryRowIndex + 1
  const totalRows = footerRowIndex

  const ws = {}
  const merges = []
  const rows = []
  const cols = columns.map((col) => ({ wch: col.width }))

  const sheetSubtitle =
    lang === "fr" ? "TENDANCE DES REVENUS (6 DERNIERS MOIS)" : "REVENUE TREND (LAST 6 MONTHS)"

  buildSheetHeader(ws, merges, rows, colCount, hospitalName, sheetSubtitle, [
    lang === "fr" ? `Exporté le ${formatExportDate(lang)}` : `Exported on ${formatExportDate(lang)}`,
    hopitalId != null ? (lang === "fr" ? `Établissement n°${hopitalId}` : `Facility #${hopitalId}`) : null,
    exportedBy ? `${lang === "fr" ? "Par" : "By"} : ${exportedBy}` : null,
    platformName,
  ])

  columns.forEach((col, c) => {
    setCell(ws, headerRowIndex, c, col.label, headerStyle(COLORS.chartHeader))
  })
  rows[headerRowIndex] = { hpt: 28 }

  let totalRevenue = 0
  revenueSeries.forEach((point, index) => {
    const row = dataStartRow + index
    const revenue = Number(point.revenue) || 0
    totalRevenue += revenue
    const intensity = Math.max(0.15, revenue / maxRevenue)
    const bg = index % 2 === 1 ? COLORS.revenueBarBg : COLORS.white

    setCell(ws, row, 0, point.label || point.name || "", dataStyle(bg))
    setCell(ws, row, 1, point.year || "", dataStyle(bg))
    setCell(ws, row, 2, revenue, revenueBarStyle(intensity > 0.5 ? COLORS.revenueBarBg : bg))
    rows[row] = { hpt: 24 }
  })

  setCell(
    ws,
    summaryRowIndex,
    0,
    lang === "fr" ? "TOTAL PÉRIODE" : "PERIOD TOTAL",
    summaryStyle(),
  )
  merges.push({ s: { r: summaryRowIndex, c: 0 }, e: { r: summaryRowIndex, c: 1 } })
  setCell(ws, summaryRowIndex, 2, totalRevenue, summaryValueStyle())
  rows[summaryRowIndex] = { hpt: 26 }

  const footerText =
    lang === "fr"
      ? `Revenus encaissés (factures payées ou partielles) — ${hospitalName}`
      : `Collected revenue (paid or partial invoices) — ${hospitalName}`
  setCell(ws, footerRowIndex, 0, footerText, footerStyle())
  merges.push({ s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: colCount - 1 } })
  rows[footerRowIndex] = { hpt: 20 }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows, c: colCount - 1 } })
  ws["!merges"] = merges
  ws["!cols"] = cols
  ws["!rows"] = rows

  return ws
}

/**
 * Exporte les factures et la tendance des revenus vers un fichier Excel stylisé.
 */
export function exportBillingToExcel(invoices, revenueSeries, options = {}) {
  const {
    hopitalId,
    hospitalName = "Shambua Santé",
    exportedBy = "",
    lang = "fr",
    platformName = "ShambuaSante",
    filterSummary = "",
    columnLabels = {},
    revenueColumnLabels = {},
    statusLabels = {},
    summaryLabels = {},
    kpis = {},
    sheetSubtitle,
  } = options

  if (!invoices?.length) {
    throw new Error("EMPTY")
  }

  const workbook = XLSX.utils.book_new()

  const invoicesSheet = buildInvoicesSheet(invoices, {
    hospitalName,
    hopitalId,
    exportedBy,
    lang,
    sheetSubtitle: sheetSubtitle || (lang === "fr" ? "REGISTRE DES FACTURES" : "INVOICE REGISTER"),
    platformName,
    filterSummary,
    columnLabels,
    statusLabels,
    summaryLabels,
    kpis,
  })
  XLSX.utils.book_append_sheet(workbook, invoicesSheet, lang === "fr" ? "Factures" : "Invoices")

  if (revenueSeries?.length) {
    const revenueSheet = buildRevenueSheet(revenueSeries, {
      hospitalName,
      hopitalId,
      exportedBy,
      lang,
      platformName,
      columnLabels: revenueColumnLabels,
    })
    XLSX.utils.book_append_sheet(workbook, revenueSheet, lang === "fr" ? "Revenus" : "Revenue")
  }

  const filename = buildFilename(hospitalName, hopitalId)
  XLSX.writeFile(workbook, filename)

  return { filename, count: invoices.length, summary: computeInvoiceSummary(invoices) }
}
