import { useEffect, useRef, useState } from "react"
import { FileText, Loader2, Printer, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"

export default function CashierInvoiceModal({ isOpen, onClose, invoice, onLoadPdf }) {
  const { t } = useI18n()
  const iframeRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pdfUrl, setPdfUrl] = useState(null)

  useEffect(() => {
    if (!isOpen || !invoice) return

    let cancelled = false
    let objectUrl = null

    const load = async () => {
      setLoading(true)
      setError("")
      setPdfUrl(null)
      try {
        const blob = await onLoadPdf(invoice)
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || t("cashier.invoice.error"))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [isOpen, invoice, onLoadPdf, t])

  useEffect(() => {
    if (!isOpen && pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
  }, [isOpen, pdfUrl])

  const handlePrint = () => {
    const frame = iframeRef.current
    if (frame?.contentWindow) {
      frame.contentWindow.focus()
      frame.contentWindow.print()
    }
  }

  if (!invoice) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[94vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t("cashier.invoice.previewTitle")}
          </DialogTitle>
          <DialogDescription>
            {invoice.patientName} — {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[480px] flex-1 bg-muted/30">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("cashier.invoice.loading")}</p>
            </div>
          )}
          {error && !loading && (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {pdfUrl && !error && (
            <iframe
              ref={iframeRef}
              title={t("cashier.invoice.previewTitle")}
              src={pdfUrl}
              className="h-[min(70vh,620px)] w-full border-0 bg-white"
            />
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
            {t("common.close")}
          </Button>
          <Button type="button" onClick={handlePrint} disabled={!pdfUrl || loading}>
            <Printer className="h-4 w-4" />
            {t("cashier.invoice.print")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
