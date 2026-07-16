import { useCallback, useEffect, useRef, useState } from "react"

const DEFAULT_POLL_MS = 15_000

/**
 * Fetch asynchrone avec rechargement auto (sans F5) :
 * - poll silencieux tant que l’onglet est visible
 * - refetch à la réouverture de l’onglet
 * - reload() manuel reste disponible (boutons Actualiser)
 *
 * @param {() => Promise<any>} fn
 * @param {any[]} deps
 * @param {{
 *   pollInterval?: number | false,
 *   refetchOnFocus?: boolean,
 *   soft?: boolean,
 * }} [options]
 *   pollInterval — ms entre rafraîchissements (défaut 15s ; 0/false pour désactiver)
 *   refetchOnFocus — rafraîchir quand l’utilisateur revient sur l’onglet (défaut true)
 *   soft — ne pas flash « loading » lors des reloads (défaut true)
 */
export function useAsync(fn, deps = [], options = {}) {
  const {
    pollInterval = DEFAULT_POLL_MS,
    refetchOnFocus = true,
    soft = true,
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const dataRef = useRef(null)
  const fnRef = useRef(fn)
  fnRef.current = fn
  dataRef.current = data

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let active = true
    const isInitial = dataRef.current == null
    if (!soft || isInitial) {
      setLoading(true)
    }

    Promise.resolve()
      .then(() => fnRef.current())
      .then((res) => {
        if (active) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          if (err?.silent || err?.status === 403) {
            setError(null)
          } else {
            setError(err)
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  // Polling : données à jour sans F5
  useEffect(() => {
    const ms = pollInterval === false || pollInterval == null ? 0 : Number(pollInterval)
    if (!ms || ms <= 0) return undefined

    const timer = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return
      reload()
    }, ms)

    return () => window.clearInterval(timer)
  }, [pollInterval, reload])

  // Retour sur l’onglet → rafraîchir
  useEffect(() => {
    if (!refetchOnFocus) return undefined

    const onVisibility = () => {
      if (document.visibilityState === "visible") reload()
    }

    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [refetchOnFocus, reload])

  return { data, setData, loading, error, reload }
}

/** Comme useAsync, mais data est toujours un tableau (jamais null). */
export function useAsyncList(fn, deps = [], options = {}) {
  const result = useAsync(fn, deps, options)
  return { ...result, data: result.data ?? [] }
}
