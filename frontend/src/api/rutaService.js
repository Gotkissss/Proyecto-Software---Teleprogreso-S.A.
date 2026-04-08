/**
 * api/rutaService.js
 * ---------------------------------------------------------------------------
 * Servicio para la pantalla "Mi Ruta Diaria".
 * 
 * Endpoints esperados del backend FastAPI:
 *   GET  /servicios/mi-ruta                    → RutaDiariaResponse
 *   GET  /servicios/{id}                        → ServicioDetail
 *   PATCH /servicios/{id}/estado               → ServicioDetail actualizado
 *   GET  /servicios/mi-ruta/resumen            → ResumenRuta
 * ---------------------------------------------------------------------------
 */

import apiClient from './client'

/**
 * Obtiene la ruta del día para el técnico autenticado.
 * 
 * Response esperada:
 * {
 *   fecha: "2024-05-24",
 *   tecnico: { nombre_completo, cargo },
 *   resumen: { total_paradas, duracion_estimada_h, km_ruta },
 *   alerta: { mensaje } | null,
 *   servicios: [
 *     {
 *       id_servicio: 1,
 *       eta: "08:30",
 *       estado: "completado" | "en_progreso" | "pendiente",
 *       prioridad: "urgente" | "alta" | "media" | "baja",
 *       nombre: "Residencial Los Álamos",
 *       direccion: "Calle 15, Ave. Circunvalaci",
 *       tipo: "Reparación" | "Instalación" | "Mantenimiento",
 *     }
 *   ]
 * }
 */
export const getMiRuta = async () => {
  const { data } = await apiClient.get('/servicios/mi-ruta')
  return data
}

/**
 * Obtiene el detalle de un servicio específico.
 */
export const getServicioDetalle = async (idServicio) => {
  const { data } = await apiClient.get(`/servicios/${idServicio}`)
  return data
}

/**
 * Actualiza el estado de un servicio (ej: marcar como completado).
 * 
 * @param {number} idServicio
 * @param {'pendiente'|'en_progreso'|'completado'|'cancelado'} nuevoEstado
 */
export const actualizarEstadoServicio = async (idServicio, nuevoEstado) => {
  const { data } = await apiClient.patch(`/servicios/${idServicio}/estado`, {
    estado: nuevoEstado,
  })
  return data
}
