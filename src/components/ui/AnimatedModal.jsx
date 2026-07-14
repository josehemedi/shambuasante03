import { useEffect } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { modalBackdropVariants, modalPanelVariants } from "@/lib/modalMotion"

export function AnimatedModal({
  open,
  onClose,
  children,
  className,
  contentClassName,
  zIndex = 50,
  closeOnBackdrop = true,
  align = "center",
}) {
  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence mode="wait">
      {open ? (
        <div
          className={cn(
            "fixed inset-0 flex p-4",
            align === "center" ? "items-center justify-center" : "items-start justify-center pt-[8vh]",
            className,
          )}
          style={{ zIndex }}
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default border-0 bg-black/55 backdrop-blur-[4px] p-0"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            className={cn("relative w-full max-w-lg outline-none", contentClassName)}
            variants={modalPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
