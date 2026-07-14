import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useAuth } from "@/auth/AuthProvider"
import { getToken, USE_LIVE_API } from "@/services/httpClient"
import {
  createLiveNotificationClient,
  disconnectLiveNotificationClient,
} from "@/services/liveNotificationClient"

const NotificationContext = createContext(null)
const STORAGE_KEY = "shambua.liveNotifications"
const MAX_STORED = 50

function storageKey(tenantId, userId) {
  return `${STORAGE_KEY}.${tenantId}.${userId}`
}

function readStoredNotifications(tenantId, userId) {
  if (typeof window === "undefined" || !tenantId || !userId) return []
  try {
    const raw = window.localStorage.getItem(storageKey(tenantId, userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistNotifications(tenantId, userId, items) {
  if (typeof window === "undefined" || !tenantId || !userId) return
  window.localStorage.setItem(storageKey(tenantId, userId), JSON.stringify(items.slice(0, MAX_STORED)))
}

function normalizeNotification(payload, tenantId) {
  return {
    id: payload.id || crypto.randomUUID(),
    type: payload.type || "GENERIC",
    title: payload.title || "Notification",
    titleFr: payload.titleFr || payload.title || "Notification",
    message: payload.message || "",
    messageFr: payload.messageFr || payload.message || "",
    tone: payload.tone || "primary",
    link: payload.link || null,
    idRdv: payload.idRdv ?? null,
    idHopital: payload.idHopital ?? tenantId ?? null,
    createdAt: payload.createdAt || new Date().toISOString(),
    read: false,
  }
}

export function NotificationProvider({ children }) {
  const { isAuthenticated, user, bootstrapping } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)
  const userId = user?.idUtilisateur
  const tenantId = user?.idHopital

  useEffect(() => {
    if (!tenantId || !userId) {
      setNotifications([])
      return
    }
    setNotifications(readStoredNotifications(tenantId, userId))
  }, [tenantId, userId])

  const pushNotification = useCallback(
    (payload) => {
      if (!tenantId || !userId) return
      if (payload?.idHopital != null && Number(payload.idHopital) !== Number(tenantId)) {
        return
      }
      const item = normalizeNotification(payload, tenantId)
      setNotifications((prev) => {
        if (prev.some((n) => n.id === item.id)) return prev
        const next = [item, ...prev].slice(0, MAX_STORED)
        persistNotifications(tenantId, userId, next)
        return next
      })
    },
    [tenantId, userId],
  )

  useEffect(() => {
    if (!USE_LIVE_API || bootstrapping || !isAuthenticated || !userId || !tenantId) {
      disconnectLiveNotificationClient(clientRef.current)
      clientRef.current = null
      setConnected(false)
      return
    }

    const token = getToken()
    if (!token) return

    disconnectLiveNotificationClient(clientRef.current)
    clientRef.current = createLiveNotificationClient({
      tenantId,
      userId,
      token,
      onNotification: pushNotification,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    })

    return () => {
      disconnectLiveNotificationClient(clientRef.current)
      clientRef.current = null
      setConnected(false)
    }
  }, [bootstrapping, isAuthenticated, tenantId, userId, pushNotification])

  const markAllRead = useCallback(() => {
    if (!tenantId || !userId) return
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      persistNotifications(tenantId, userId, next)
      return next
    })
  }, [tenantId, userId])

  const markRead = useCallback(
    (id) => {
      if (!tenantId || !userId) return
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        persistNotifications(tenantId, userId, next)
        return next
      })
    },
    [tenantId, userId],
  )

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      connected,
      markAllRead,
      markRead,
    }),
    [notifications, unreadCount, connected, markAllRead, markRead],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider")
  return ctx
}
