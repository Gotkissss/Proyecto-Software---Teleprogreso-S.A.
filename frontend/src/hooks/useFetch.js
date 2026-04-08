/**
 * hooks/useFetch.js
 * ---------------------------------------------------------------------------
 * Hook genérico para llamadas async con manejo de loading/error.
 * Llama al servicio inmediatamente al montar (o cuando cambia `deps`).
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from 'react'

/**
 * @param {Function} fetchFn   - función async que retorna datos
 * @param {Array}    deps      - dependencias (por defecto [])
 * @param {boolean}  immediate - si debe ejecutarse al montar (default: true)
 */
export function useFetch(fetchFn, deps = [], immediate = true) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError]     = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Error desconocido')
      throw err
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (immediate) execute()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps])

  return { data, loading, error, refetch: execute }
}
