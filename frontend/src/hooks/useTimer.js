/**
 * hooks/useTimer.js
 * ---------------------------------------------------------------------------
 * Hook para el cronómetro de tiempo activo en la pantalla de Pausas.
 * 
 * Recibe los segundos iniciales del backend y los va incrementando.
 * Se detiene automáticamente cuando `running` es false (en pausa).
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useRef } from 'react'

/**
 * @param {number}  initialSeconds - Segundos de tiempo activo que ya lleva el día
 * @param {boolean} running        - false cuando el usuario está en pausa
 */
export function useTimer(initialSeconds = 0, running = true) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const intervalRef = useRef(null)

  // Actualizar si el servidor nos da un valor nuevo (ej: al recargar)
  useEffect(() => {
    setSeconds(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  /** Formatea segundos → "HH:MM:SS" */
  const formatted = formatSeconds(seconds)

  return { seconds, formatted }
}

export function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}
