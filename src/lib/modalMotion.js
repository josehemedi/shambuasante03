/** Shared motion presets for modals and drawers. */
export const MODAL_EASE = [0.32, 0.72, 0, 1]

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.24, ease: MODAL_EASE } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: MODAL_EASE } },
}

export const modalPanelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: MODAL_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: { duration: 0.22, ease: MODAL_EASE },
  },
}

export const drawerBackdropVariants = modalBackdropVariants

export const drawerPanelVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { duration: 0.34, ease: MODAL_EASE },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.26, ease: MODAL_EASE },
  },
}
