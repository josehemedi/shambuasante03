import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { WS_BASE_URL } from "@/services/httpClient"

export function createLiveNotificationClient({
  tenantId,
  userId,
  token,
  onNotification,
  onConnect,
  onDisconnect,
}) {
  if (!tenantId || !userId || !token) {
    return null
  }

  const connectHeaders = {
    Authorization: `Bearer ${token}`,
    "X-Hopital-Id": String(tenantId),
  }

  const destination = `/topic/tenant/${tenantId}/user/${userId}/notifications`

  const client = new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
    connectHeaders,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body)
          onNotification?.(payload)
        } catch {
          // ignore malformed payloads
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

export function disconnectLiveNotificationClient(client) {
  if (!client) return
  try {
    client.deactivate()
  } catch {
    // ignore teardown errors
  }
}
