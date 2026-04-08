/**
 * api/client.js
 * ---------------------------------------------------------------------------
 * Cliente Axios centralizado para Teleprogreso S.A.
 * 
 * - Agrega automáticamente el JWT en cada petición (Bearer token)
 * - Si el servidor responde 401, limpia la sesión y redirige al login
 * - Todos los servicios importan este cliente, NO crean su propio axios
 * ---------------------------------------------------------------------------
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
})

/* ── Request Interceptor ──────────────────────────────────────────────── */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* ── Response Interceptor ────────────────────────────────────────────── */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido → limpiar sesión
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      // Redirigir al login sin usar React Router (acceso global)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
