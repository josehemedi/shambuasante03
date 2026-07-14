import { useEffect, useMemo, useState } from "react"
import { CreditCard, Lock, ShieldCheck } from "lucide-react"
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

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "")
}

export function formatCardNumber(value) {
  const digits = digitsOnly(value).slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

export function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function luhnCheck(cardNumber) {
  const digits = digitsOnly(cardNumber)
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

function isExpiryValid(value) {
  const digits = digitsOnly(value)
  if (digits.length !== 4) return false
  const month = Number(digits.slice(0, 2))
  const year = Number(`20${digits.slice(2, 4)}`)
  if (month < 1 || month > 12) return false
  const now = new Date()
  const expiry = new Date(year, month, 0, 23, 59, 59)
  return expiry >= now
}

function detectCardBrand(number) {
  const digits = digitsOnly(number)
  if (/^4/.test(digits)) return "visa"
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard"
  if (/^3[47]/.test(digits)) return "amex"
  return "generic"
}

const brandLabels = {
  visa: "visa",
  mastercard: "mastercard",
  amex: "amex",
  generic: "generic",
}

export default function SubscriptionPaymentModal({
  isOpen,
  onClose,
  planName,
  amountLabel,
  onPay,
  paying = false,
}) {
  const { t } = useI18n()
  const [cardholderName, setCardholderName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setCardholderName("")
    setCardNumber("")
    setExpiry("")
    setCvv("")
    setErrors({})
    setSubmitError("")
  }, [isOpen])

  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber])
  const maskedPreview = useMemo(() => {
    const digits = digitsOnly(cardNumber)
    const padded = `${digits}${"•".repeat(Math.max(0, 16 - digits.length))}`
    return padded.match(/.{1,4}/g)?.join(" ") || "•••• •••• •••• ••••"
  }, [cardNumber])

  const validate = () => {
    const next = {}
    if (!cardholderName.trim() || cardholderName.trim().length < 3) {
      next.cardholderName = t("mySubscription.payment.errors.cardholder")
    }
    if (!luhnCheck(cardNumber)) {
      next.cardNumber = t("mySubscription.payment.errors.cardNumber")
    }
    if (!isExpiryValid(expiry)) {
      next.expiry = t("mySubscription.payment.errors.expiry")
    }
    const cvvDigits = digitsOnly(cvv)
    const cvvLen = brand === "amex" ? 4 : 3
    if (cvvDigits.length !== cvvLen) {
      next.cvv = t("mySubscription.payment.errors.cvv", { digits: cvvLen })
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")
    if (!validate()) return

    try {
      await onPay?.()
      onClose()
    } catch (err) {
      setSubmitError(err?.message || t("mySubscription.repayError"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !paying && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("mySubscription.payment.title")}
          </DialogTitle>
          <DialogDescription>
            {t("mySubscription.payment.subtitle", { plan: planName || "Starter", amount: amountLabel || "—" })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D9488] via-[#0f766e] to-[#1F4E79] p-5 text-white shadow-lg">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/10" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">Shambua Santé</p>
                <BadgeLike label={t(`mySubscription.payment.brands.${brandLabels[brand]}`)} />
              </div>
              <p className="font-mono text-lg tracking-widest sm:text-xl">{maskedPreview}</p>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/70">{t("mySubscription.payment.cardholder")}</p>
                  <p className="mt-1 text-sm font-medium uppercase">
                    {cardholderName.trim() || t("mySubscription.payment.cardholderPlaceholder")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-white/70">{t("mySubscription.payment.expiry")}</p>
                  <p className="mt-1 font-mono text-sm">{expiry || "MM/AA"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("mySubscription.currentPlan")}</p>
                <p className="font-semibold text-foreground">{planName || "Starter"}</p>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{amountLabel}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field
              id="cardholderName"
              label={t("mySubscription.payment.cardholder")}
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              placeholder={t("mySubscription.payment.cardholderPlaceholder")}
              error={errors.cardholderName}
              autoComplete="cc-name"
            />

            <Field
              id="cardNumber"
              label={t("mySubscription.payment.cardNumber")}
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              error={errors.cardNumber}
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={19}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                id="expiry"
                label={t("mySubscription.payment.expiry")}
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/AA"
                error={errors.expiry}
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
              />
              <Field
                id="cvv"
                label={t("mySubscription.payment.cvv")}
                value={cvv}
                onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, brand === "amex" ? 4 : 3))}
                placeholder={brand === "amex" ? "1234" : "123"}
                error={errors.cvv}
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={brand === "amex" ? 4 : 3}
                type="password"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>{t("mySubscription.payment.secureNotice")}</p>
          </div>

          {submitError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={paying}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={paying}>
              <Lock className="h-4 w-4" />
              {paying ? t("mySubscription.processing") : t("mySubscription.payment.payNow", { amount: amountLabel })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ id, label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={cn(error && "border-destructive focus-visible:ring-destructive/30", className)}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function BadgeLike({ label }) {
  return (
    <span className="rounded-md bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
      {label}
    </span>
  )
}
