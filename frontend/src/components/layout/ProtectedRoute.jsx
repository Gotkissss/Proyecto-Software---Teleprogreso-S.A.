/**
 * components/layout/ProtectedRoute.jsx
 * ---------------------------------------------------------------------------
 * Wrapper para rutas que requieren autenticación.
 * Si el usuario no está autenticado, redirige al login.
 * Muestra un spinner mientras se verifica la sesión inicial.
 * ---------------------------------------------------------------------------
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'
import styles from './ProtectedRoute.module.css'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
