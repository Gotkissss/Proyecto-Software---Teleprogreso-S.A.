/**
 * api/asistenciaService.js
 * ---------------------------------------------------------------------------
 * Servicio para la pantalla "Pausas y Asistencia".
 * 
 * Endpoints esperados del backend FastAPI:
 *   GET   /asistencias/hoy                     → AsistenciaHoy
 *   POST  /asistencias/entrada                 → AsistenciaHoy
 *   POST  /asistencias/salida                  → AsistenciaHoy
 *   POST  /asistencias/pausa/iniciar           → PausaResponse
 *   POST  /asistencias/pausa/finalizar         → PausaResponse
 *   GET   /asistencias/pausas/tipos            → TipoPausa[]
 *   POST  /asistencias/finalizar-jornada       → JornadaFinalizada
 * ---------------------------------------------------------------------------
 */

import apiClient from './client'

/**
 * Obtiene el estado de asistencia del día actual para el usuario autenticado.
 * 
 * Response esperada:
 * {
 *   id_asistencia: 1,
 *   fecha: "2024-05-24",
 *   hora_entrada: "2024-05-24T08:00:00Z" | null,
 *   hora_salida: null,
 *   tiempo_activo_segundos: 15621,
 *   en_pausa: false,
 *   tiempo_en_pausa_segundos: 3900,
 *   productividad_pct: 92,
 *   historial: [
 *     {
 *       tipo: "entrada" | "pausa" | "reanudacion" | "salida",
 *       label: "Inicio de Jornada",
 *       hora_inicio: "08:00 AM",
 *       hora_fin: null,
 *       duracion_segundos: null
 *     }
 *   ]
 * }
 */
export const getAsistenciaHoy = async () => {
  const { data } = await apiClient.get('/asistencias/hoy')
  return data
}

/**
 * Registra la entrada al inicio de la jornada.
 * Opcionalmente recibe coordenadas GPS.
 */
export const registrarEntrada = async (lat = null, lon = null) => {
  const { data } = await apiClient.post('/asistencias/entrada', { lat, lon })
  return data
}

/**
 * Inicia una pausa.
 * 
 * @param {string} tipoPausa - ID o nombre del tipo de pausa (ej: 'almuerzo', 'tecnica')
 */
export const iniciarPausa = async (tipoPausa) => {
  const { data } = await apiClient.post('/asistencias/pausa/iniciar', {
    tipo_pausa: tipoPausa,
  })
  return data
}

/**
 * Finaliza la pausa activa actual.
 */
export const finalizarPausa = async () => {
  const { data } = await apiClient.post('/asistencias/pausa/finalizar')
  return data
}

/**
 * Obtiene los tipos de pausa disponibles según la normativa.
 * 
 * Response esperada:
 * [
 *   { id: 'almuerzo', label: 'Pausa de Almuerzo', duracion_max_min: 60 },
 *   { id: 'tecnica',  label: 'Pausa Técnica (Soporte)', duracion_max_min: 15 },
 *   { id: 'personal', label: 'Pausa Personal', duracion_max_min: 10 },
 * ]
 */
export const getTiposPausa = async () => {
  const { data } = await apiClient.get('/asistencias/pausas/tipos')
  return data
}

/**
 * Finaliza la jornada laboral del día.
 * El backend actualizará la ubicación y estado en el panel de supervisión.
 */
export const finalizarJornada = async () => {
  const { data } = await apiClient.post('/asistencias/finalizar-jornada')
  return data
}
