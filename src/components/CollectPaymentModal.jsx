import { useEffect, useState } from "react"
import { Banknote, CreditCard, Smartphone, Building2, Wallet, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, Input } from "@/components/ui/primitives"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/I18nProvider"
import { cn } from "@/lib/utils"

const METHODS = [
  { id: "cash", icon: Banknote },
  { id: "card", icon: CreditCard },
  { id: "mobile_money", icon: Smartphone },
  { id: "transfer", icon: Building2 },
]

export default function CollectPaymentModal({
  isOpen,
  onClose,
  invoice,
  onConfirm,
  onPrintInvoice,
  saving = false,
  formatMoney,
}) {
  const { t } = useI18n()
  const [paymentType, setPaymentType] = useState("total")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("cash")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  const balance = invoice?.balanceDue ?? 0

  useEffect(() => {
    if (!isOpen) return
    setPaymentType("total")
    setAmount(String(balance))
    setMethod("cash")
    setReference("")
    setNotes("")
    setError("")
  }, [isOpen, balance, invoice?.id])

  const handleTypeChange = (type) => {
    setPaymentType(type)
    setAmount(type === "total" ? String(balance) : "")
    setError("")
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setError(t("cashier.payment.errors.amount"))
      return
    }
    if (value > balance) {
      setError(t("cashier.payment.errors.overBalance"))
      return
    }
    if (paymentType === "partial" && value >= balance) {
      setError(t("cashier.payment.errors.partialTooHigh"))
      return
    }
    onConfirm?.({
      paymentType,
      amount: value,
      method,
      reference: reference.trim() || null,
      notes: notes.trim() || null,
    })
  }

  if (!invoice) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {t("cashier.payment.title")}
          </DialogTitle>
          <DialogDescription>
            {invoice.patientName} — {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("cashier.invoice.balanceDue")}</span>
              <span className="font-bold text-foreground">{formatMoney(balance)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("cashier.payment.type")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {["total", "partial"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                    paymentType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t(`cashier.payment.type_${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">{t("cashier.payment.amount")}</Label>
            <Input
              id="pay-amount"
              type="number"
              min="1"
              max={balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={paymentType === "total"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("cashier.payment.method")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    method === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(`cashier.payment.method_${id}`)}
                </button>
              ))}
            </div>
          </div>

          {(method === "card" || method === "transfer" || method === "mobile_money") && (
            <div className="space-y-1.5">
              <Label htmlFor="pay-ref">{t("cashier.payment.reference")}</Label>
              <Input
                id="pay-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={t("cashier.payment.referencePlaceholder")}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">{t("cashier.payment.notes")}</Label>
            <Input
              id="pay-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("cashier.payment.notesPlaceholder")}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="gap-2 sm:mr-auto"
              disabled={saving}
              onClick={() => onPrintInvoice?.(invoice)}
            >
              <FileText className="h-4 w-4" />
              {t("cashier.invoice.printInvoice")}
            </Button>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1 sm:flex-none">
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
                {saving ? t("common.saving") : t("cashier.payment.confirm")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
