/**
 * context/AuthContext.jsx
 * ---------------------------------------------------------------------------
 * Provee el estado de autenticación a toda la aplicación.
 * 
 * Expone:
 *   - user         → objeto con datos del usuario o null
 *   - isLoading    → true mientras verifica la sesión inicial
 *   - isAuthenticated → booleano
 *   - loginUser(correo, pass) → hace login y carga el perfil
 *   - logoutUser()           → limpia sesión y redirige
 * ---------------------------------------------------------------------------
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getMe, logout } from '../api/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  /* Verificar si hay una sesión activa al cargar la app */
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        const userData = await getMe()
        setUser(userData)
      } catch {
        // Token inválido o expirado → el interceptor ya limpió el storage
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  const loginUser = useCallback(async (correo, contrasena) => {
    await login(correo, contrasena)      // guarda el token en localStorage
    const userData = await getMe()       // carga el perfil
    setUser(userData)
    navigate('/ruta', { replace: true }) // redirige a la ruta diaria
  }, [navigate])

  const logoutUser = useCallback(async () => {
    await logout()
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      loginUser,
      logoutUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook conveniente para consumir el contexto */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
