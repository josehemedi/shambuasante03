import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import { useAuth } from "@/auth/AuthProvider"
import { useNotifications } from "@/auth/NotificationProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { ROLE_KEYS } from "@/config/roles"

const ARCHIVE_DISCHARGE_TYPE = "ARCHIVE_DOSSIER_SORTIE"

export function ArchivistLiveAlerts() {
  const { roleKey } = useAuth()
  const { notifications, markRead } = useNotifications()
  const { lang, t } = useI18n()
  const navigate = useNavigate()
  const shownRef = useRef(new Set())
  const seededRef = useRef(false)

  useEffect(() => {
    if (roleKey !== ROLE_KEYS.ARCHIVIST) return

    if (!seededRef.current) {
      notifications.forEach((n) => shownRef.current.add(n.id))
      seededRef.current = true
      return
    }

    const newest = notifications.find(
      (n) => n.type === ARCHIVE_DISCHARGE_TYPE && !shownRef.current.has(n.id),
    )
    if (!newest) return

    shownRef.current.add(newest.id)
    const title = lang === "fr" ? newest.titleFr : newest.title
    const text = lang === "fr" ? newest.messageFr : newest.message

    Swal.fire({
      icon: "warning",
      title,
      text,
      confirmButtonText: t("archives.viewDossier"),
      cancelButtonText: t("common.close"),
      showCancelButton: true,
      confirmButtonColor: "#d97706",
      allowOutsideClick: true,
    }).then((result) => {
      markRead(newest.id)
      if (result.isConfirmed && newest.link) {
        navigate(newest.link)
      }
    })
  }, [notifications, roleKey, lang, t, navigate, markRead])

  return null
}
