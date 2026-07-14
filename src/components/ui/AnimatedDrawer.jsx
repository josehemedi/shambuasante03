import { useEffect } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { drawerBackdropVariants, drawerPanelVariants } from "@/lib/modalMotion"

export function AnimatedDrawer({
  open,
  onClose,
  children,
  className,
  panelClassName,
  zIndex = 50,
  side = "right",
  widthClassName = "max-w-2xl",
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

  const panelPosition =
    side === "right"
      ? "right-0 top-0 h-full"
      : "left-0 top-0 h-full"

  return createPortal(
    <AnimatePresence mode="wait">
      {open ? (
        <div className={cn("fixed inset-0", className)} style={{ zIndex }} role="presentation">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default border-0 bg-black/55 backdrop-blur-[4px] p-0"
            variants={drawerBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "fixed flex flex-col bg-card shadow-2xl shadow-black/15",
              panelPosition,
              widthClassName,
              "w-full",
              panelClassName,
            )}
            variants={drawerPanelVariants}
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
