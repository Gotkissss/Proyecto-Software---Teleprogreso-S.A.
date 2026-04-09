/**
 * context/AuthContext.jsx
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getMe, logout } from '../api/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

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
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  const getRedirectPath = (rol) => {
    if (rol === 'admin' || rol === 'supervisor' || rol === 'gerente') {
      return '/supervisor/dashboard'
    }
    return '/ruta'
  }

  const loginUser = useCallback(async (correo, contrasena) => {
    const loginData = await login(correo, contrasena)
    const userData = await getMe()
    setUser(userData)
    const redirectPath = getRedirectPath(userData.rol || loginData.rol)
    navigate(redirectPath, { replace: true })
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}