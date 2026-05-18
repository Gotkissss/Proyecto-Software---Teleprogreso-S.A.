/**
 * api/client.js
 * ---------------------------------------------------------------------------
 * Cliente Axios centralizado para Teleprogreso S.A.
 * ---------------------------------------------------------------------------
 */

import axios from 'axios'

// Resolución de la URL base del API:
// 1. Si la build inyectó VITE_API_URL (Railway / .env.production) → usarla.
// 2. Si estamos en localhost (desarrollo local) → backend local.
// 3. Fallback: backend de Railway (mantiene compatibilidad si la build
//    de prod se hizo sin VITE_API_URL).
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1')

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isLocalhost
    ? 'http://localhost:8000'
    : 'https://backend-production-6d60.up.railway.app')

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient