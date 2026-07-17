import { useEffect, useRef, useState } from "react"
import { Megaphone, Volume2, X } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { ROLE_KEYS } from "@/config/roles"
import { getToken } from "@/services/httpClient"
import {
  createWaitingRoomLiveClient,
  disconnectWaitingRoomLiveClient,
} from "@/services/waitingRoomLiveClient"
import {
  playAndAnnounceWaitingRoomCall,
  unlockWaitingRoomAudio,
} from "@/lib/waitingRoomAudio"
import { Button } from "@/components/ui/primitives"

/**
 * Son + annonce vocale sur appel patient pour la réceptionniste
 * (et admin hôpital), même hors écran « Salle d'attente ».
 * Le médecin n'entend plus ce son localement.
 */
export function ReceptionCallAlerts() {
  const { user, roleKey } = useAuth()
  const { t, locale } = useI18n()
  const lastKeyRef = useRef(null)
  const [alert, setAlert] = useState(null)
  const [audioReady, setAudioReady] = useState(false)

  const isReceptionRole =
    roleKey === ROLE_KEYS.RECEPTIONIST || roleKey === ROLE_KEYS.HOSPITAL_ADMIN

  useEffect(() => {
    if (!isReceptionRole) return undefined

    const unlock = () => {
      void unlockWaitingRoomAudio().then(() => setAudioReady(true))
    }

    window.addEventListener("pointerdown", unlock, { once: true, capture: true })
    window.addEventListener("keydown", unlock, { once: true, capture: true })
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true })
      window.removeEventListener("keydown", unlock, { capture: true })
    }
  }, [isReceptionRole])

  useEffect(() => {
    if (!alert) return undefined
    const timer = window.setTimeout(() => setAlert(null), 10000)
    return () => window.clearTimeout(timer)
  }, [alert])

  useEffect(() => {
    if (!isReceptionRole) return undefined
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

        const numero =
          payload.numeroPassage != null
            ? String(payload.numeroPassage).padStart(3, "0")
            : "—"
        const medecinRaw = (payload.medecinNom || "").trim()
        const doctorLabel = medecinRaw
          ? /^(dr\.?|docteur)\b/i.test(medecinRaw)
            ? medecinRaw
            : `Docteur ${medecinRaw}`
          : payload.salle || "—"
        setAlert({
          key,
          rappel: Boolean(payload.rappel),
          numero,
          salle: payload.salle || "—",
          patient: payload.patientNom || "",
          doctor: doctorLabel,
        })
        void playAndAnnounceWaitingRoomCall(payload, locale)
      },
    })

    return () => disconnectWaitingRoomLiveClient(client)
  }, [isReceptionRole, user?.idHopital, locale])

  if (!isReceptionRole) return null

  const patientSuffix = alert?.patient ? ` — ${alert.patient}` : ""

  return (
    <>
      {!audioReady && (
        <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg">
          <div className="flex items-start gap-3">
            <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="space-y-2">
              <p className="font-medium">{t("waitingRoom.receptionCallAlerts.enableSoundTitle")}</p>
              <p className="text-amber-900/80">{t("waitingRoom.receptionCallAlerts.enableSoundBody")}</p>
              <Button
                type="button"
                size="sm"
                className="bg-amber-700 hover:bg-amber-800"
                onClick={() => {
                  void unlockWaitingRoomAudio().then(() => setAudioReady(true))
                }}
              >
                {t("waitingRoom.receptionCallAlerts.enableSoundCta")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {alert && (
        <div
          key={alert.key}
          className="fixed top-4 right-4 z-[70] max-w-md rounded-xl border border-primary/20 bg-card px-4 py-3 shadow-xl"
          role="status"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                {alert.rappel
                  ? t("waitingRoom.receptionCallAlerts.recallTitle")
                  : t("waitingRoom.receptionCallAlerts.callTitle")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("waitingRoom.receptionCallAlerts.callBody", {
                  number: alert.numero,
                  room: alert.salle,
                  patient: patientSuffix,
                  doctor: alert.doctor,
                })}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Fermer"
              onClick={() => setAlert(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
