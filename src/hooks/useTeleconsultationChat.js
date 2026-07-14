import { useCallback, useEffect, useRef, useState } from "react"

import { Client } from "@stomp/stompjs"

import SockJS from "sockjs-client"

import { teleService } from "@/services/api"

import { WS_BASE_URL } from "@/services/httpClient"



function mapChatMessage(msg, isDoctor) {

  const fromDoctor = msg.senderRole === "doctor"

  return {

    id: msg.id,

    from: fromDoctor ? "doctor" : "patient",

    text: msg.content,

    time: msg.createdAt

      ? new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

      : "",

    createdAt: msg.createdAt || new Date().toISOString(),

    senderName: msg.senderName,

    mine: fromDoctor ? isDoctor : !isDoctor,

    readByRecipient: Boolean(msg.readByRecipient),

    readAt: msg.readAt,

    pending: Boolean(msg.pending),

  }

}



function sortMessages(messages) {

  return [...messages].sort((a, b) => {

    if (a.id && b.id) {

      if (typeof a.id === "number" && typeof b.id === "number") return a.id - b.id

      return String(a.id).localeCompare(String(b.id))

    }

    if (a.createdAt && b.createdAt) {

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()

    }

    return 0

  })

}



function upsertMessage(list, message) {

  if (message.id && list.some((m) => m.id === message.id)) {

    return list

  }

  let next = list

  if (message.mine && message.text) {

    next = list.filter((m) => !(m.pending && m.mine && m.text === message.text))

  }

  return sortMessages([...next, { ...message, pending: false }])

}



function mergeHistory(current, history, isDoctor) {

  const mapped = history.map((msg) => mapChatMessage(msg, isDoctor))

  if (!current.length) return mapped

  const byId = new Map(mapped.filter((m) => m.id).map((m) => [m.id, m]))

  const pending = current.filter((m) => m.pending)

  const merged = [...mapped]

  pending.forEach((p) => {

    if (!merged.some((m) => m.mine && m.text === p.text)) {

      merged.push(p)

    }

  })

  return sortMessages(merged.length ? merged : current)

}



function applyReadReceipt(messages, receipt, isDoctor) {

  if (!receipt?.messageIds?.length) return messages



  const shouldUpdateMine =

    (isDoctor && receipt.readerRole === "patient") ||

    (!isDoctor && receipt.readerRole === "doctor")



  if (!shouldUpdateMine) return messages



  return messages.map((message) => {

    if (message.mine && receipt.messageIds.includes(message.id)) {

      return {

        ...message,

        readByRecipient: true,

        readAt: receipt.readAt || message.readAt,

      }

    }

    return message

  })

}



function unwrapStompPayload(payload) {

  if (payload?.eventType === "message" && payload.message) {

    return { kind: "message", data: payload.message }

  }

  if (payload?.eventType === "read_receipt" && payload.readReceipt) {

    return { kind: "read_receipt", data: payload.readReceipt }

  }

  if (payload?.eventType === "read_receipt") {

    return { kind: "read_receipt", data: payload }

  }

  if (payload?.content != null) {

    return { kind: "message", data: payload }

  }

  return null

}



function resolveSockJsUrl() {

  const configured = (WS_BASE_URL || "").replace(/\/$/, "")

  if (configured) return `${configured}/ws`

  if (typeof window !== "undefined") return `${window.location.origin}/ws`

  return "/ws"

}



export function useTeleconsultationChat({ idRdv, tenantId, token, enabled, isDoctor }) {

  const [messages, setMessages] = useState([])

  const [status, setStatus] = useState("idle")

  const [error, setError] = useState(null)

  const clientRef = useRef(null)

  const subscriptionRef = useRef(null)

  const isDoctorRef = useRef(isDoctor)



  useEffect(() => {

    isDoctorRef.current = isDoctor

  }, [isDoctor])



  const canConnect = Boolean(enabled && idRdv && tenantId && token)



  const markRead = useCallback(async () => {

    if (!idRdv) return

    try {

      await teleService.markChatRead(idRdv)

    } catch {

      // non bloquant

    }

  }, [idRdv])



  const loadHistory = useCallback(async () => {

    if (!idRdv) {

      setMessages([])

      return

    }

    try {

      const history = await teleService.getChatMessages(idRdv)

      setMessages((prev) => mergeHistory(prev, history, isDoctorRef.current))

      setError(null)

    } catch (err) {

      if (err?.status === 403) {

        setError("Accès refusé au chat. Seuls le médecin et le patient de ce rendez-vous peuvent écrire.")

      } else {

        setError(err?.payload?.message || err?.message || "Impossible de charger l'historique du chat.")

      }

    }

  }, [idRdv])



  useEffect(() => {

    loadHistory()

  }, [loadHistory])



  useEffect(() => {

    if (!enabled || !idRdv) return undefined

    if (status === "connected") return undefined



    const interval = window.setInterval(() => {

      loadHistory()

    }, 3000)



    return () => window.clearInterval(interval)

  }, [enabled, idRdv, status, loadHistory])



  useEffect(() => {

    if (!canConnect) {

      setStatus("idle")

      if (subscriptionRef.current) {

        try {

          subscriptionRef.current.unsubscribe()

        } catch {

          // ignore

        }

        subscriptionRef.current = null

      }

      if (clientRef.current) {

        try {

          clientRef.current.deactivate()

        } catch {

          // ignore

        }

        clientRef.current = null

      }

      return undefined

    }



    const destination = `/topic/tenant/${tenantId}/teleconsultation/${idRdv}/chat`

    const connectHeaders = {

      Authorization: `Bearer ${token}`,

      "X-Hopital-Id": String(tenantId),

    }

    const sockJsUrl = resolveSockJsUrl()



    setStatus("connecting")



    const client = new Client({

      webSocketFactory: () => new SockJS(sockJsUrl),

      connectHeaders,

      reconnectDelay: 5000,

      heartbeatIncoming: 10000,

      heartbeatOutgoing: 10000,

      onConnect: () => {

        setStatus("connected")

        setError(null)

        subscriptionRef.current = client.subscribe(destination, (frame) => {

          try {

            const payload = JSON.parse(frame.body)

            const event = unwrapStompPayload(payload)

            if (!event) return



            if (event.kind === "message") {

              const mapped = mapChatMessage(event.data, isDoctorRef.current)

              setMessages((prev) => upsertMessage(prev, mapped))

              if (!mapped.mine) {

                markRead()

              }

              return

            }



            if (event.kind === "read_receipt") {

              setMessages((prev) => applyReadReceipt(prev, event.data, isDoctorRef.current))

            }

          } catch {

            // ignore malformed payloads

          }

        })

        markRead()

      },

      onDisconnect: () => setStatus("offline"),

      onStompError: (frame) => {

        setStatus("offline")

        const detail = frame?.headers?.message || frame?.body

        if (detail) {

          setError(`Chat temps réel indisponible (${detail}). Synchronisation automatique activée.`)

        }

      },

      onWebSocketClose: () => setStatus("offline"),

      onWebSocketError: () => setStatus("offline"),

    })



    clientRef.current = client

    client.activate()



    return () => {

      if (subscriptionRef.current) {

        try {

          subscriptionRef.current.unsubscribe()

        } catch {

          // ignore

        }

        subscriptionRef.current = null

      }

      if (clientRef.current) {

        try {

          clientRef.current.deactivate()

        } catch {

          // ignore

        }

        clientRef.current = null

      }

    }

  }, [canConnect, idRdv, tenantId, token, markRead])



  const sendMessage = useCallback(

    async (content) => {

      const trimmed = content?.trim()

      if (!trimmed || !idRdv) return false



      const client = clientRef.current

      if (client?.connected) {

        const optimistic = mapChatMessage(

          {

            id: `temp-${Date.now()}`,

            senderRole: isDoctor ? "doctor" : "patient",

            content: trimmed,

            createdAt: new Date().toISOString(),

            readByRecipient: false,

          },

          isDoctor,

        )

        optimistic.pending = true

        setMessages((prev) => upsertMessage(prev, optimistic))

        try {

          client.publish({

            destination: `/app/teleconsultation/${idRdv}/chat`,

            body: JSON.stringify({ content: trimmed }),

            headers: { "content-type": "application/json" },

          })

          setError(null)

          window.setTimeout(() => loadHistory(), 400)

          return true

        } catch {

          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))

          // fallback REST below

        }

      }



      try {

        const saved = await teleService.sendChatMessage(idRdv, trimmed)

        const mapped = mapChatMessage(saved, isDoctor)

        setMessages((prev) => upsertMessage(prev, mapped))

        setError(null)

        return true

      } catch (err) {

        setError(err?.message || "Impossible d'envoyer le message.")

        return false

      }

    },

    [idRdv, isDoctor, loadHistory],

  )



  return {

    messages,

    status,

    error,

    sendMessage,

    reloadHistory: loadHistory,

  }

}

