/**
 * api/empleadoService.js
 * ---------------------------------------------------------------------------
 * Servicio para gestionar empleados desde el panel del supervisor/admin.
 * Endpoints del backend FastAPI (backend/app/schemas/empleado.py):
 *   GET    /empleados          → EmpleadoResponse[]
 *   GET    /empleados/{id}     → EmpleadoResponse
 *   POST   /empleados          → EmpleadoResponse
 *   PATCH  /empleados/{id}     → EmpleadoResponse
 *   DELETE /empleados/{id}     → 204
 * ---------------------------------------------------------------------------
 */

import apiClient from './client'

/**
 * Obtiene la lista completa de empleados.
 * @param {Object} params - Filtros opcionales: { rol, estado }
 */
export async function getEmpleados(params = {}) {
  const { data } = await apiClient.get('/empleados', { params })
  return data
}

/**
 * Obtiene el detalle de un empleado.
 * @param {number} id
 */
export async function getEmpleado(id) {
  const { data } = await apiClient.get(`/empleados/${id}`)
  return data
}

/**
 * Actualiza parcialmente un empleado (PATCH).
 * Solo envía los campos que cambiaron.
 * @param {number} id
 * @param {Object} campos - Campos del EmpleadoUpdate schema
 */
export async function actualizarEmpleado(id, campos) {
  const { data } = await apiClient.patch(`/empleados/${id}`, campos)
  return data
}

/**
 * Cambia el estado de un empleado a 'activo' o 'inactivo'.
 * Usa el mismo endpoint PATCH /empleados/{id}
 * @param {number} id
 * @param {'activo'|'inactivo'|'suspendido'} nuevoEstado
 */
export async function cambiarEstadoEmpleado(id, nuevoEstado) {
  const { data } = await apiClient.patch(`/empleados/${id}`, {
    estado: nuevoEstado,
  })
  return data
}