import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Swal from "sweetalert2"
import {
  Search,
  Users,
  FileText,
  Stethoscope,
  FlaskConical,
  Pill,
  BedDouble,
  Wallet,
  Receipt,
  LogOut,
  History,
  RefreshCw,
  Printer,
  Activity,
  MoreHorizontal,
  Calculator,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Input,
} from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { cashierService } from "@/services/api"
import CollectPaymentModal from "@/components/CollectPaymentModal"
import CashierReceiptModal from "@/components/CashierReceiptModal"
import CashierInvoiceModal from "@/components/CashierInvoiceModal"
import { cn, formatCurrency } from "@/lib/utils"

const statusVariants = {
  pending: "warning",
  partial: "secondary",
  paid: "success",
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function FeeSection({ icon: Icon, title, lines, formatMoney, emptyLabel }) {
  if (!lines?.length) return null
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        <span className="text-sm font-bold text-foreground">{formatMoney(subtotal)}</span>
      </div>
      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              {line.label}
              {line.qty > 1 ? ` × ${line.qty}` : ""}
            </span>
            <span className="shrink-0 font-medium">{formatMoney(line.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CashierDesk() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [tab, setTab] = useState("queue")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoicePreview, setInvoicePreview] = useState(null)
  const [lastReceipt, setLastReceipt] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data, reload } = useAsync(
    () => {
      if (user?.idHopital == null) return Promise.resolve({ queue: [], history: [] })
      return cashierService.getWorkspace()
    },
    [user?.idHopital],
  )
  const queue = data?.queue || []
  const history = data?.history || []

  const formatMoney = (v) => formatCurrency(v, lang)
  const formatDateTime = (value) => {
    if (!value) return "—"
    return new Date(value).toLocaleString(lang === "fr" ? "fr-FR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const filteredQueue = useMemo(() => {
    return queue.filter((row) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        row.patientName.toLowerCase().includes(q) ||
        row.invoiceNumber.toLowerCase().includes(q) ||
        row.patientId.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || row.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [queue, search, statusFilter])

  const selected = queue.find((r) => r.id === selectedId) || null
  const unpaidSelected = Boolean(selected && Number(selected.balanceDue) > 0)

  const openPatientInvoice = (invoice) => {
    if (!invoice) return
    setInvoicePreview(invoice)
    setInvoiceOpen(true)
  }

  const handleSelect = (id) => {
    setSelectedId(id)
    setTab("queue")
    const row = queue.find((r) => r.id === id)
    if (row && Number(row.balanceDue) > 0) {
      openPatientInvoice(row)
    } else {
      setInvoiceOpen(false)
    }
  }

  // Pré-sélectionne le premier patient impayé pour activer le panneau Facture Patient.
  useEffect(() => {
    if (selectedId != null || !filteredQueue.length) return
    const firstUnpaid = filteredQueue.find((r) => Number(r.balanceDue) > 0)
    if (firstUnpaid) setSelectedId(firstUnpaid.id)
  }, [filteredQueue, selectedId])

  const handlePrintInvoice = (invoice) => {
    openPatientInvoice(invoice || selected)
  }

  const handleComposeInvoice = async () => {
    if (!selected?.idFacture && !selected?.idPatientDb) return
    const discountResult = await Swal.fire({
      title: t("cashier.invoice.compose"),
      input: "number",
      inputLabel: t("cashier.invoice.discountPrompt"),
      inputValue: selected.montantRemise || 0,
      showCancelButton: true,
      confirmButtonText: t("cashier.actions.compose"),
      cancelButtonText: t("common.cancel"),
    })
    if (!discountResult.isConfirmed) return

    setSaving(true)
    try {
      const result = await cashierService.composeInvoice({
        idFacture: selected.idFacture,
        idPatient: selected.idPatientDb,
        montantRemise: Number(discountResult.value) || 0,
      })
      reload()
      await Swal.fire({
        icon: "success",
        title: t("cashier.invoice.composeSuccess"),
        text: t("cashier.invoice.formulaHint")
          + ` → ${formatMoney(result.montantPatient ?? result.balanceDue ?? 0)}`,
        timer: 2600,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("cashier.invoice.composeError"),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRecordAdvance = async () => {
    if (!selected?.idPatientDb) return
    const amountResult = await Swal.fire({
      title: t("cashier.invoice.advance"),
      input: "number",
      inputLabel: t("cashier.invoice.advancePrompt"),
      inputAttributes: { min: 0, step: "0.01" },
      showCancelButton: true,
      confirmButtonText: t("cashier.actions.advance"),
      cancelButtonText: t("common.cancel"),
    })
    if (!amountResult.isConfirmed) return
    const amount = Number(amountResult.value)
    if (!amount || amount <= 0) {
      await Swal.fire({ icon: "warning", title: t("cashier.payment.errors.amount") })
      return
    }

    setSaving(true)
    try {
      await cashierService.recordAdvance({
        idPatient: selected.idPatientDb,
        montant: amount,
        method: "cash",
      })
      await cashierService.composeInvoice({
        idFacture: selected.idFacture,
        idPatient: selected.idPatientDb,
      })
      reload()
      await Swal.fire({
        icon: "success",
        title: t("cashier.invoice.advanceSuccess"),
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("cashier.invoice.advanceError"),
      })
    } finally {
      setSaving(false)
    }
  }

  const loadInvoicePdf = async (invoice) => {
    return cashierService.downloadInvoicePdf(invoice)
  }

  const handleCollectPayment = async (payload) => {
    if (!selected) return
    setSaving(true)
    try {
      const result = await cashierService.collectPayment(selected.id, payload, user?.name)
      reload()
      setPaymentOpen(false)
      setLastReceipt(result.receipt)
      setReceiptOpen(true)
      if (result.invoiceRemoved) {
        setSelectedId(null)
      }
      await Swal.fire({
        icon: "success",
        title: t("cashier.payment.successTitle"),
        text: t("cashier.payment.successText", { amount: formatMoney(payload.amount) }),
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("cashier.payment.error"),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleValidateDischarge = async () => {
    if (!selected?.awaitingAdminDischarge || selected.balanceDue > 0) return
    const confirm = await Swal.fire({
      icon: "question",
      title: t("cashier.discharge.confirmTitle"),
      text: t("cashier.discharge.confirmText", { patient: selected.patientName }),
      showCancelButton: true,
      confirmButtonText: t("cashier.discharge.validate"),
      cancelButtonText: t("common.cancel"),
      confirmButtonColor: "#0d9488",
    })
    if (!confirm.isConfirmed) return

    setSaving(true)
    try {
      await cashierService.validateAdminDischarge(selected.id)
      reload()
      await Swal.fire({
        icon: "success",
        title: t("cashier.discharge.successTitle"),
        text: t("cashier.discharge.successText"),
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({ icon: "error", title: t("common.error"), text: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          title={t("cashier.desk.title")}
          subtitle={
            user?.tenantLabel
              ? t("cashier.desk.subtitleTenant", { hospital: user.tenantLabel })
              : t("cashier.desk.subtitle")
          }
          actions={
            <Button variant="outline" size="sm" onClick={reload}>
              <RefreshCw className="h-4 w-4" />
              {t("common.refresh")}
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-2">
        <Button
          variant={tab === "queue" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("queue")}
        >
          <Users className="h-4 w-4" />
          {t("cashier.desk.tabQueue")}
        </Button>
        <Button
          variant={tab === "history" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("history")}
        >
          <History className="h-4 w-4" />
          {t("cashier.desk.tabHistory")}
        </Button>
      </motion.div>

      {tab === "queue" ? (
        <motion.div variants={item} className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {t("cashier.desk.waitingTitle")}
              </CardTitle>
              <CardDescription>{t("cashier.desk.waitingSub")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t("cashier.desk.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["all", "pending", "partial"].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    onClick={() => setStatusFilter(s)}
                  >
                    {t(`cashier.desk.filter_${s}`)}
                  </Button>
                ))}
              </div>
              <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {filteredQueue.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {t("cashier.desk.emptyQueue")}
                  </p>
                ) : (
                  filteredQueue.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => handleSelect(row.id)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-all",
                        selected?.id === row.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{row.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.invoiceNumber} · {row.department}
                          </p>
                        </div>
                        <Badge variant={statusVariants[row.status]}>
                          {t(`cashier.status.${row.status}`)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("cashier.invoice.balanceDue")}</span>
                        <span className="font-bold text-foreground">{formatMoney(row.balanceDue)}</span>
                      </div>
                      {row.awaitingAdminDischarge && (
                        <Badge variant="outline" className="mt-2 text-[10px]">
                          {t("cashier.discharge.awaiting")}
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "xl:col-span-3 transition-shadow",
              unpaidSelected && "ring-2 ring-amber-500/40 shadow-md",
              selected && !unpaidSelected && "ring-1 ring-emerald-500/30",
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {t("cashier.invoice.title")}
                {unpaidSelected && (
                  <Badge variant="warning" className="ml-1">
                    {t("cashier.status.pending")}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selected ? selected.invoiceNumber : t("cashier.invoice.selectHint")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selected ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  {t("cashier.invoice.selectHint")}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t("cashier.invoice.patient")}
                      </p>
                      <p className="font-semibold text-foreground">{selected.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.patientId} · {selected.sex} · {selected.age} {t("cashier.invoice.years")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t("cashier.invoice.visit")}
                      </p>
                      <p className="text-sm text-foreground">{formatDateTime(selected.visitDate)}</p>
                      <p className="text-xs text-muted-foreground">{selected.doctorName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryBox label={t("cashier.invoice.total")} value={formatMoney(selected.totalAmount)} />
                    <SummaryBox label={t("cashier.invoice.paid")} value={formatMoney(selected.paidAmount)} />
                    <SummaryBox
                      label={t("cashier.invoice.balanceDue")}
                      value={formatMoney(selected.balanceDue)}
                      highlight
                    />
                    <SummaryBox
                      label={t("cashier.invoice.status")}
                      value={t(`cashier.status.${selected.status}`)}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                      {t("cashier.invoice.formulaHint")}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t("cashier.invoice.grossTotal")}</span>
                        <span className="font-medium">{formatMoney(selected.sousTotalSoins || selected.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">
                          {t("cashier.invoice.insurance")}
                          {selected.tauxAssurance > 0 ? ` (${selected.tauxAssurance} %)` : ""}
                        </span>
                        <span className="font-medium text-emerald-700">− {formatMoney(selected.montantAssurance || 0)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t("cashier.invoice.discount")}</span>
                        <span className="font-medium text-emerald-700">− {formatMoney(selected.montantRemise || 0)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t("cashier.invoice.advances")}</span>
                        <span className="font-medium text-emerald-700">− {formatMoney(selected.montantAvances || 0)}</span>
                      </div>
                      <div className="mt-2 flex justify-between gap-2 border-t border-border pt-2 font-semibold">
                        <span>{t("cashier.invoice.patientDue")}</span>
                        <span>{formatMoney(selected.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <FeeSection
                      icon={Stethoscope}
                      title={t("cashier.fees.consultation")}
                      lines={selected.consultationFees}
                      formatMoney={formatMoney}
                    />
                    <FeeSection
                      icon={FlaskConical}
                      title={t("cashier.fees.laboratory")}
                      lines={selected.laboratoryFees}
                      formatMoney={formatMoney}
                    />
                    <FeeSection
                      icon={Pill}
                      title={t("cashier.fees.pharmacy")}
                      lines={selected.pharmacyItems}
                      formatMoney={formatMoney}
                    />
                    <FeeSection
                      icon={BedDouble}
                      title={t("cashier.fees.hospitalization")}
                      lines={selected.hospitalizationFees}
                      formatMoney={formatMoney}
                    />
                    <FeeSection
                      icon={Activity}
                      title={t("cashier.fees.medicalActs")}
                      lines={selected.medicalActFees}
                      formatMoney={formatMoney}
                    />
                    <FeeSection
                      icon={MoreHorizontal}
                      title={t("cashier.fees.other")}
                      lines={selected.otherFees}
                      formatMoney={formatMoney}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button variant="outline" onClick={handleComposeInvoice} disabled={saving || !selected}>
                      <Calculator className="h-4 w-4" />
                      {t("cashier.actions.compose")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRecordAdvance}
                      disabled={saving || !selected?.idPatientDb}
                    >
                      <Receipt className="h-4 w-4" />
                      {t("cashier.actions.advance")}
                    </Button>
                    {unpaidSelected && (
                      <Button
                        variant="secondary"
                        onClick={() => openPatientInvoice(selected)}
                        disabled={saving}
                      >
                        <Printer className="h-4 w-4" />
                        {t("cashier.invoice.printInvoice")}
                      </Button>
                    )}
                    <Button onClick={() => setPaymentOpen(true)} disabled={!unpaidSelected || saving}>
                      <Wallet className="h-4 w-4" />
                      {t("cashier.actions.collect")}
                    </Button>
                    {selected.awaitingAdminDischarge && (
                      <Button
                        variant="outline"
                        onClick={handleValidateDischarge}
                        disabled={selected.balanceDue > 0 || selected.adminDischargeValidated || saving}
                      >
                        <LogOut className="h-4 w-4" />
                        {t("cashier.discharge.validate")}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                {t("cashier.history.title")}
              </CardTitle>
              <CardDescription>{t("cashier.history.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">{t("cashier.receipt.number")}</th>
                      <th className="px-5 py-3 font-semibold">{t("cashier.invoice.patient")}</th>
                      <th className="px-5 py-3 font-semibold">{t("cashier.invoice.number")}</th>
                      <th className="px-5 py-3 font-semibold">{t("cashier.receipt.date")}</th>
                      <th className="px-5 py-3 font-semibold">{t("cashier.payment.amount")}</th>
                      <th className="px-5 py-3 font-semibold">{t("cashier.payment.type")}</th>
                      <th className="px-5 py-3 font-semibold">{t("cashier.payment.method")}</th>
                      <th className="px-5 py-3 font-semibold">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-3.5 font-mono text-xs">{row.receiptNumber}</td>
                        <td className="px-5 py-3.5 font-medium">{row.patientName}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{row.invoiceNumber}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{formatDateTime(row.paidAt)}</td>
                        <td className="px-5 py-3.5 font-mono font-medium">{formatMoney(row.amount)}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={row.paymentType === "total" ? "success" : "warning"}>
                            {t(`cashier.payment.type_${row.paymentType}`)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {t(`cashier.payment.method_${row.method}`)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setLastReceipt({ ...row, consultationFees: [], laboratoryFees: [], pharmacyItems: [], hospitalizationFees: [] })
                              setReceiptOpen(true)
                            }}
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            {t("cashier.receipt.view")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                    {t("cashier.history.empty")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <CollectPaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        invoice={selected}
        onConfirm={handleCollectPayment}
        onPrintInvoice={handlePrintInvoice}
        saving={saving}
        formatMoney={formatMoney}
      />

      <CashierInvoiceModal
        isOpen={invoiceOpen}
        onClose={() => {
          setInvoiceOpen(false)
          setInvoicePreview(null)
        }}
        invoice={invoicePreview}
        onLoadPdf={loadInvoicePdf}
      />

      <CashierReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={lastReceipt}
        formatMoney={formatMoney}
        formatDateTime={formatDateTime}
      />
    </motion.div>
  )
}

function SummaryBox({ label, value, highlight }) {
  return (
    <div className={cn("rounded-xl border p-3", highlight ? "border-warning/40 bg-warning/8" : "border-border bg-muted/20")}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-semibold", highlight ? "text-warning" : "text-foreground")}>{value}</p>
    </div>
  )
}
