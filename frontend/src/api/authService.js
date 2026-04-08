/**
 * api/authService.js
 * ---------------------------------------------------------------------------
 * Servicio de autenticación.
 * 
 * Endpoints esperados del backend FastAPI:
 *   POST /auth/login   → { access_token, token_type }
 *   POST /auth/logout  → 200 OK  (opcional, el token es stateless)
 *   GET  /auth/me      → { id_usuario, nombre_completo, correo, cargo, roles[] }
 * ---------------------------------------------------------------------------
 */

import apiClient from './client'

/**
 * Login con correo y contraseña.
 * FastAPI OAuth2 espera el body como form-data con los campos
 * "username" y "password" (estándar OAuth2PasswordRequestForm).
 */
export const login = async (correo, contrasena) => {
  const formData = new URLSearchParams()
  formData.append('username', correo)
  formData.append('password', contrasena)

  const { data } = await apiClient.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  // Guardar token y datos básicos del usuario
  localStorage.setItem('access_token', data.access_token)

  return data
}

/**
 * Obtiene el perfil del usuario autenticado.
 * Se llama justo después del login para poblar el contexto.
 */
export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me')
  return data
}

/**
 * Cierra sesión: limpia el almacenamiento local.
 * Si el backend implementa blacklist de tokens, descomentar la llamada.
 */
export const logout = async () => {
  // await apiClient.post('/auth/logout')  // descomentar si el back lo requiere
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}
