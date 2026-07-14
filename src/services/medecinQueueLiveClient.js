import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { WS_BASE_URL } from "@/services/httpClient"

function resolveSockJsUrl() {
  const configured = (WS_BASE_URL || "").replace(/\/$/, "")
  if (configured) return `${configured}/ws`
  if (typeof window !== "undefined") return `${window.location.origin}/ws`
  return "/ws"
}

/**
 * Live updates for a doctor's waiting queue.
 * Topics:
 *  - /topic/medecin-queue/{tenantId}/{medecinId}
 *  - /topic/reception/{tenantId} (backup NEW_ADMISSION)
 */
export function createMedecinQueueLiveClient({
  tenantId,
  medecinId,
  token,
  onEvent,
  onConnect,
  onDisconnect,
}) {
  if (!tenantId || !token) return null

  const connectHeaders = {
    Authorization: `Bearer ${token}`,
    "X-Hopital-Id": String(tenantId),
  }

  const destinations = [`/topic/reception/${tenantId}`]
  if (medecinId) {
    destinations.push(`/topic/medecin-queue/${tenantId}/${medecinId}`)
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(resolveSockJsUrl()),
    connectHeaders,
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      destinations.forEach((destination) => {
        client.subscribe(destination, (message) => {
          try {
            const body = message?.body
            if (!body) {
              onEvent?.("REFRESH")
              return
            }
            if (body.startsWith("{")) {
              onEvent?.(JSON.parse(body))
            } else {
              onEvent?.(body)
            }
          } catch {
            onEvent?.(message?.body || "REFRESH")
          }
        })
      })
      onConnect?.()
    },
    onDisconnect: () => onDisconnect?.(),
    onStompError: () => onDisconnect?.(),
    onWebSocketClose: () => onDisconnect?.(),
  })

  client.activate()
  return client
}

export function disconnectMedecinQueueLiveClient(client) {
  if (!client) return
  try {
    client.deactivate()
  } catch {
    // ignore
  }
}
