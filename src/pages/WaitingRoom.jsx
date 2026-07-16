import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Bell, Clock, Loader2, Megaphone, Play, RefreshCw, Monitor } from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { PageHeader } from "@/components/PageHeader"
import { Badge, Button, Card, CardContent } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsyncList } from "@/hooks/useAsync"
import { doctorService } from "@/services/api"
import { getToken } from "@/services/httpClient"
import {
  createMedecinQueueLiveClient,
  disconnectMedecinQueueLiveClient,
} from "@/services/medecinQueueLiveClient"
import { cn } from "@/lib/utils"
import { playAndAnnounceWaitingRoomCall } from "@/lib/waitingRoomAudio"

const MySwal = withReactContent(Swal)

const PRIORITY_VARIANT = {
  high: "destructive",
  normal: "warning",
  low: "secondary",
}

const STATUS_VARIANT = {
  EN_ATTENTE: "warning",
  ENREGISTRE: "success",
  APPELE: "primary",
}

export default function WaitingRoom() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: queue, setData: setQueue, loading, error, reload } = useAsyncList(
    () => doctorService.getLiveQueue(),
    [],
  )
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    const tenantId = user?.idHopital
    const token = getToken()
    if (!tenantId || !token) return undefined

    let debounceTimer = null
    const client = createMedecinQueueLiveClient({
      tenantId,
      medecinId: user?.idMedecin,
      token,
      onEvent: (payload) => {
        const type = typeof payload === "string" ? payload : payload?.type
        if (!type) return
        if (
          type === "NEW_ADMISSION" ||
          type === "NEW_RDV" ||
          type === "PATIENT_EN_FILE" ||
          type === "STATUS_UPDATED" ||
          type === "PATIENT_CALLED" ||
          type === "PATIENT_RECALLED" ||
          type === "REFRESH"
        ) {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => reload(), 250)
        }
      },
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      disconnectMedecinQueueLiveClient(client)
    }
  }, [user?.idHopital, user?.idMedecin, reload])

  const handleCall = useCallback(
    async (item) => {
      const key = item.idAdmission || item.idRendezVous || item.id
      setActingId(key)
      try {
        const event = await doctorService.callPatient(item)
        const numero = event?.numeroPassage ?? item.numeroPassage ?? null
        const salle = event?.salle ?? item.room ?? "Consultation"
        setQueue((prev) =>
          (prev || []).map((row) => {
            const rowKey = row.idAdmission || row.idRendezVous || row.id
            if (rowKey !== key && row.idAdmission !== event?.idAdmission) return row
            return {
              ...row,
              idAdmission: event?.idAdmission ?? row.idAdmission,
              numeroPassage: numero,
              room: salle,
              statut: "APPELE",
              canCall: true,
              canStart: true,
            }
          }),
        )
        const isRecall = Boolean(event?.rappel) || item.statut === "APPELE"
        await playAndAnnounceWaitingRoomCall(
          {
            ...(event || {}),
            numeroPassage: numero,
            salle,
            patientNom: event?.patientNom || item.patient || item.patientNom || "",
            rappel: isRecall,
          },
          locale,
        )
        await MySwal.fire({
          icon: "success",
          title: isRecall ? t("waitingRoom.recallSuccessTitle") : t("waitingRoom.callSuccessTitle"),
          text: t("waitingRoom.callSuccessBody", {
            number: numero != null ? String(numero).padStart(3, "0") : "—",
            room: salle,
          }),
          timer: 2200,
          showConfirmButton: false,
        })
        reload()
      } catch (err) {
        await MySwal.fire({
          icon: "error",
          title: t("waitingRoom.callErrorTitle"),
          text: err?.message || t("waitingRoom.callErrorBody"),
        })
      } finally {
        setActingId(null)
      }
    },
    [locale, reload, setQueue, t],
  )

  const handleStart = useCallback(
    async (item) => {
      if (item.idAdmission) {
        setActingId(item.idAdmission)
        try {
          const result = await doctorService.startConsultation(item.idAdmission)
          const consultationId = result?.consultation?.idConsultation
          if (consultationId) {
            navigate(`/doctor-workspace?consultation=${consultationId}`)
          } else if (item.idRendezVous) {
            navigate(`/doctor-workspace?rdv=${item.idRendezVous}`)
          } else {
            reload()
          }
        } catch (err) {
          await MySwal.fire({
            icon: "error",
            title: t("waitingRoom.startErrorTitle"),
            text: err?.message || t("waitingRoom.startErrorBody"),
          })
        } finally {
          setActingId(null)
        }
        return
      }
      if (item.idRendezVous) {
        navigate(`/doctor-workspace?rdv=${item.idRendezVous}`)
      }
    },
    [navigate, reload, t],
  )

  const handleOpenPresentiel = useCallback(
    (item) => {
      if (item.canStart && item.idAdmission) {
        handleStart(item)
        return
      }
      if (item.idRendezVous) {
        navigate(`/doctor-workspace?rdv=${item.idRendezVous}`)
        return
      }
      if (item.idAdmission) {
        handleStart(item)
      }
    },
    [handleStart, navigate],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("waitingRoom.title")}
        subtitle={t("waitingRoom.subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="md" className="gap-2" onClick={reload}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              {t("common.refresh")}
            </Button>
            <Button
              variant="outline"
              size="md"
              className="gap-2"
              onClick={() => window.open("/waiting-room-display", "_blank", "noopener,noreferrer")}
            >
              <Monitor className="h-4 w-4" />
              {t("waitingRoom.openDisplay")}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error.message || t("waitingRoom.loadError")}</CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {loading && queue.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.loading")}
            </CardContent>
          </Card>
        ) : queue.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t("waitingRoom.empty")}
            </CardContent>
          </Card>
        ) : (
          queue.map((item, index) => {
            const busy = actingId === (item.idAdmission || item.idRendezVous || item.id)
            return (
              <motion.div
                key={`${item.idAdmission || "r"}-${item.idRendezVous || item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-colors hover:border-primary/40",
                    item.statut === "APPELE" && "border-primary/40 bg-primary/5",
                  )}
                  onClick={() => handleOpenPresentiel(item)}
                >
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="text-[10px] uppercase tracking-wide">{t("waitingRoom.ticket")}</span>
                      <span className="font-display text-lg font-bold">
                        {item.numeroPassage != null
                          ? String(item.numeroPassage).padStart(3, "0")
                          : "—"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">{item.patient}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {t("docDash.waited", { time: item.waited })}
                        </span>
                        <span>·</span>
                        <span>{item.room}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge variant={PRIORITY_VARIANT[item.priority] || "default"}>
                        {t(`priority.${item.priority}`)}
                      </Badge>
                          <Badge variant={STATUS_VARIANT[item.statut] || "secondary"}>
                            {t(`waitingRoom.status.${item.statut}`) || item.statut}
                          </Badge>
                      {item.canCall && (
                        <Button
                          size="sm"
                          className={cn(
                            "gap-1.5",
                            item.statut === "APPELE" && "bg-amber-600 text-white hover:bg-amber-500",
                          )}
                          disabled={busy}
                          onClick={() => handleCall(item)}
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
                          {item.statut === "APPELE" ? t("waitingRoom.recall") : t("waitingRoom.call")}
                        </Button>
                      )}
                      {(item.canStart || item.idRendezVous) && (
                        <Button size="sm" variant="secondary" className="gap-1.5" disabled={busy} onClick={() => handleOpenPresentiel(item)}>
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          {item.canStart ? t("waitingRoom.start") : "Consulter"}
                        </Button>
                      )}
                      {item.statut === "APPELE" && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <Bell className="h-3.5 w-3.5" />
                          {t("waitingRoom.calledHint")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
