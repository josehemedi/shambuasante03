import { useCallback, useEffect, useState } from "react"

export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.resolve()
      .then(() => fn())
      .then((res) => {
        if (active) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          // 403 rôle/session : ne pas afficher d'erreur à l'écran
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

  return { data, setData, loading, error, reload }
}

/** Comme useAsync, mais data est toujours un tableau (jamais null). */
export function useAsyncList(fn, deps = []) {
  const result = useAsync(fn, deps)
  return { ...result, data: result.data ?? [] }
}
