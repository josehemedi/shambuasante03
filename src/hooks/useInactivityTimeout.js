import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/auth/AuthProvider"

const DEFAULT_TIMEOUT = 30 * 60 * 1000
const WARNING_BEFORE = 2 * 60 * 1000

export function useInactivityTimeout(timeoutMs = DEFAULT_TIMEOUT) {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(WARNING_BEFORE / 1000)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const timerRef = useRef(null)
  const warningTimerRef = useRef(null)
  const countdownRef = useRef(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowWarning(false)
    setCountdown(WARNING_BEFORE / 1000)

    timerRef.current = setTimeout(() => {
      setShowWarning(true)
      const start = Date.now()
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - start
        const remaining = Math.max(0, Math.ceil((WARNING_BEFORE - elapsed) / 1000))
        setCountdown(remaining)
      }, 1000)

      warningTimerRef.current = setTimeout(() => {
        setShowWarning(false)
        logout()
        navigate("/login", { replace: true })
      }, WARNING_BEFORE)
    }, timeoutMs)
  }, [logout, navigate, timeoutMs])

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]
    events.forEach((event) => document.addEventListener(event, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      events.forEach((event) => document.removeEventListener(event, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [resetTimer])

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false)
    resetTimer()
  }, [resetTimer])

  return { showWarning, countdown, stayLoggedIn }
}
