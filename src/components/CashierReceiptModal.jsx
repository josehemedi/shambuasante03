import { Printer, Download, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"

export default function CashierReceiptModal({
  isOpen,
  onClose,
  receipt,
  formatMoney,
  formatDateTime,
}) {
  const { t } = useI18n()
  if (!receipt) return null

  const lines = [
    ...(receipt.consultationFees || []),
    ...(receipt.laboratoryFees || []),
    ...(receipt.pharmacyItems || []),
    ...(receipt.hospitalizationFees || []),
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            {t("cashier.receipt.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 font-mono text-sm">
          <div className="border-b border-dashed border-border pb-3 text-center">
            <p className="font-display text-base font-bold text-foreground">Shambua Santé</p>
            <p className="text-xs text-muted-foreground">{t("cashier.receipt.hospitalReceipt")}</p>
          </div>

          <div className="space-y-1 text-xs">
            <Row label={t("cashier.receipt.number")} value={receipt.receiptNumber} />
            <Row label={t("cashier.invoice.number")} value={receipt.invoiceNumber} />
            <Row label={t("cashier.receipt.date")} value={formatDateTime(receipt.paidAt)} />
            <Row label={t("cashier.invoice.patient")} value={receipt.patientName} />
            <Row label={t("cashier.receipt.cashier")} value={receipt.cashierName} />
            <Row
              label={t("cashier.payment.method")}
              value={t(`cashier.payment.method_${receipt.method}`)}
            />
            <Row
              label={t("cashier.payment.type")}
              value={t(`cashier.payment.type_${receipt.paymentType}`)}
            />
          </div>

          {lines.length > 0 && (
            <div className="border-t border-dashed border-border pt-3">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                {t("cashier.receipt.details")}
              </p>
              {lines.map((line) => (
                <div key={line.id} className="flex justify-between gap-2 py-0.5 text-xs">
                  <span className="truncate text-muted-foreground">{line.label}</span>
                  <span>{formatMoney(line.total)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-dashed border-border pt-3 space-y-1">
            <Row label={t("cashier.receipt.amountPaid")} value={formatMoney(receipt.amount)} bold />
            {receipt.balanceAfter > 0 && (
              <Row label={t("cashier.receipt.remaining")} value={formatMoney(receipt.balanceAfter)} />
            )}
            {receipt.balanceAfter === 0 && (
              <Badge variant="success" className="mt-2 w-full justify-center">
                {t("cashier.receipt.fullyPaid")}
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {t("cashier.receipt.print")}
          </Button>
          <Button type="button" onClick={onClose}>
            <Download className="h-4 w-4" />
            {t("cashier.receipt.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  )
}
