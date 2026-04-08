/**
 * pages/LoginPage.jsx
 * ---------------------------------------------------------------------------
 * Vista de login conectada al endpoint de autenticación.
 * 
 * Flujo:
 *  1. Usuario ingresa correo + contraseña
 *  2. Se llama a loginUser() del AuthContext
 *  3. AuthContext llama a authService.login() → guarda JWT
 *  4. AuthContext llama a authService.getMe() → carga perfil
 *  5. Redirige a /ruta
 * ---------------------------------------------------------------------------
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'
import styles from './LoginPage.module.css'

/* Icono de ojo para mostrar/ocultar contraseña */
const IconEye     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconEyeOff  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
const IconLogo    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

export default function LoginPage() {
  const { loginUser } = useAuth()

  const [correo,      setCorreo]      = useState('')
  const [contrasena,  setContrasena]  = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!correo || !contrasena) {
      setError('Por favor completa todos los campos.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await loginUser(correo, contrasena)
      // La redirección la maneja AuthContext → /ruta
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (err?.response?.status === 401) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      } else if (detail) {
        setError(typeof detail === 'string' ? detail : 'Error al iniciar sesión.')
      } else {
        setError('No se pudo conectar al servidor. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Fondo decorativo */}
      <div className={styles.bgDecor} aria-hidden="true">
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />
      </div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <span className={styles.logoIcon}><IconLogo /></span>
          <h1 className={styles.appName}>Teleprogreso S.A.</h1>
        </div>

        <p className={styles.subtitle}>Control de Personal Operativo</p>

        {/* Formulario */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Error global */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* Campo correo */}
          <div className={styles.field}>
            <label htmlFor="correo" className={styles.label}>
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              autoComplete="email"
              className={styles.input}
              placeholder="usuario@teleprogreso.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Campo contraseña */}
          <div className={styles.field}>
            <label htmlFor="contrasena" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.inputWrap}>
              <input
                id="contrasena"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${styles.input} ${styles.inputWithIcon}`}
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {/* Botón submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <p className={styles.footer}>
          ¿Problemas para acceder? Contacta a tu supervisor.
        </p>
      </div>
    </div>
  )
}
