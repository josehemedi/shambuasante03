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
 * Live updates for the waiting-room call board.
 * Topic: /topic/waiting-room/{tenantId}
 */
export function createWaitingRoomLiveClient({ tenantId, token, onEvent, onConnect, onDisconnect }) {
  if (!tenantId || !token) return null

  const connectHeaders = {
    Authorization: `Bearer ${token}`,
    "X-Hopital-Id": String(tenantId),
  }

  const destination = `/topic/waiting-room/${tenantId}`
  const client = new Client({
    webSocketFactory: () => new SockJS(resolveSockJsUrl()),
    connectHeaders,
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body)
          onEvent?.(payload)
        } catch {
          onEvent?.({ type: "REFRESH", raw: message.body })
        }
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

export function disconnectWaitingRoomLiveClient(client) {
  if (!client) return
  try {
    client.deactivate()
  } catch {
    // ignore
  }
}
