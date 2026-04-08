/**
 * api/tareaService.js
 * ---------------------------------------------------------------------------
 * Servicio para gestionar tareas/servicios desde el lado del supervisor.
 * Usa el mismo apiClient de Diego (con JWT automático).
 * ---------------------------------------------------------------------------
 */

import apiClient from './client'

/**
 * Obtiene todas las tareas (con filtros opcionales)
 * @param {Object} params - { estado, tecnico_id, fecha }
 */
export async function getTareas(params = {}) {
  const { data } = await apiClient.get('/tareas', { params })
  return data
}

/**
 * Cambia el estado de una tarea
 * @param {number} id
 * @param {string} estado - 'pendiente' | 'en_curso' | 'finalizado'
 */
export async function actualizarEstado(id, estado) {
  const { data } = await apiClient.patch(`/tareas/${id}/estado`, { estado })
  return data
}

/**
 * Reasigna una tarea a otro técnico
 * @param {number} id
 * @param {number} tecnico_id
 */
export async function reasignarTarea(id, tecnico_id) {
  const { data } = await apiClient.patch(`/tareas/${id}/reasignar`, { tecnico_id })
  return data
}

/**
 * Crea una nueva tarea y la asigna a un técnico
 * @param {Object} tarea - { titulo, descripcion, tecnico_id, fecha_limite }
 */
export async function crearTarea(tarea) {
  const { data } = await apiClient.post('/tareas', tarea)
  return data
}