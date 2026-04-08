/**
 * api/alertaService.js
 * ---------------------------------------------------------------------------
 * Servicio para obtener alertas de retrasos y disponibilidad de técnicos.
 * ---------------------------------------------------------------------------
 */

import apiClient from './client'

/**
 * Obtiene las alertas activas (retrasos, técnicos sin asignar, etc.)
 */
export async function getAlertas() {
  const { data } = await apiClient.get('/alertas')
  return data
}

/**
 * Obtiene métricas del dashboard del supervisor
 * Retorna: técnicos activos, tareas completadas, tareas pendientes, tareas en retraso
 */
export async function getMetricas() {
  const { data } = await apiClient.get('/metricas/supervisor')
  return data
}

/**
 * Obtiene la lista de técnicos con su estado actual
 */
export async function getTecnicos() {
  const { data } = await apiClient.get('/empleados?rol=tecnico')
  return data
}

/**
 * Marca una alerta como vista/resuelta
 * @param {number} id
 */
export async function resolverAlerta(id) {
  const { data } = await apiClient.patch(`/alertas/${id}/resolver`)
  return data
}