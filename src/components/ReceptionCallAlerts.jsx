import { useEffect, useRef } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { ROLE_KEYS } from "@/config/roles"
import { getToken } from "@/services/httpClient"
import {
  createWaitingRoomLiveClient,
  disconnectWaitingRoomLiveClient,
} from "@/services/waitingRoomLiveClient"
import { playAndAnnounceWaitingRoomCall } from "@/lib/waitingRoomAudio"

/**
 * Son + annonce vocale sur appel patient, même si la réceptionniste
 * n'est pas sur l'écran « Salle d'attente » / afficheur TV.
 */
export function ReceptionCallAlerts() {
  const { user, roleKey } = useAuth()
  const { locale } = useI18n()
  const lastKeyRef = useRef(null)

  useEffect(() => {
    if (roleKey !== ROLE_KEYS.RECEPTIONIST && roleKey !== ROLE_KEYS.HOSPITAL_ADMIN) {
      return undefined
    }
    const tenantId = user?.idHopital
    const token = getToken()
    if (!tenantId || !token) return undefined

    const client = createWaitingRoomLiveClient({
      tenantId,
      token,
      onEvent: (payload) => {
        if (!payload || payload.type === "REFRESH") return
        const key = `${payload.idAdmission}-${payload.appeleAt || Date.now()}-${payload.rappel ? "R" : "C"}`
        if (lastKeyRef.current === key) return
        lastKeyRef.current = key
        void playAndAnnounceWaitingRoomCall(payload, locale)
      },
    })

    return () => disconnectWaitingRoomLiveClient(client)
  }, [roleKey, user?.idHopital, locale])

  return null
}
