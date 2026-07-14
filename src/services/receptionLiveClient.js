import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { WS_BASE_URL } from "@/services/httpClient"

/**
 * Client STOMP pour les mises à jour live du tableau de bord réception.
 * Topic: /topic/reception/{tenantId}
 */
export function createReceptionLiveClient({ tenantId, token, onEvent, onConnect, onDisconnect }) {
  if (!tenantId || !token) {
    return null
  }

  const connectHeaders = {
    Authorization: `Bearer ${token}`,
    "X-Hopital-Id": String(tenantId),
  }

  const destination = `/topic/reception/${tenantId}`
  const configured = (WS_BASE_URL || "").replace(/\/$/, "")
  const sockJsUrl = configured
    ? `${configured}/ws`
    : typeof window !== "undefined"
      ? `${window.location.origin}/ws`
      : "/ws"

  const client = new Client({
    webSocketFactory: () => new SockJS(sockJsUrl),
    connectHeaders,
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe(destination, (message) => {
        onEvent?.(message?.body || "REFRESH")
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

export function disconnectReceptionLiveClient(client) {
  if (!client) return
  try {
    client.deactivate()
  } catch {
    // ignore
  }
}
