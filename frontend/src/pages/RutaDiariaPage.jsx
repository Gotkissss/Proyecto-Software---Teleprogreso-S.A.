/**
 * pages/RutaDiariaPage.jsx
 * ---------------------------------------------------------------------------
 * Pantalla "Mi Ruta Diaria" — muestra el cronograma de servicios del día.
 *
 * Datos: se obtienen de rutaService.getMiRuta()
 * Mientras el backend no esté listo, se usan datos MOCK (ver mock al final).
 * Para activar el backend real: cambiar USE_MOCK a false.
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMiRuta, actualizarEstadoServicio } from '../api/rutaService'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import styles from './RutaDiariaPage.module.css'

/* ─── Cambiar a false cuando el backend esté listo ─────────────────────── */
const USE_MOCK = true

/* ── Iconos ──────────────────────────────────────────────────────────────── */
const IconPin      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const IconClock    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconRoute    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const IconNav      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
const IconChevron  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
const IconCalendar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconAlert    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>

/* ── MOCK DATA ────────────────────────────────────────────────────────────── */
const MOCK_RUTA = {
  fecha: '2024-05-24',
  tecnico: { nombre_completo: 'Juan Pérez', cargo: 'Técnico de Campo' },
  resumen: { total_paradas: 8, duracion_estimada_h: 6.5, km_ruta: 42 },
  alerta: { mensaje: 'Tienes 1 servicio urgente pendiente en tu ruta.' },
  servicios: [
    { id_servicio: 1, eta: '08:30', estado: 'completado',  prioridad: 'media',   nombre: 'Residencial Los Álamos - Bloque B', direccion: 'Calle 15, Ave. Circunvalaci', tipo: 'Reparación' },
    { id_servicio: 2, eta: '09:45', estado: 'en_progreso', prioridad: 'urgente', nombre: 'Tienda El Ahorro',                   direccion: 'Barrio El Centro, 3 Cal',     tipo: 'Instalación' },
    { id_servicio: 3, eta: '11:15', estado: 'pendiente',   prioridad: 'media',   nombre: 'Carlos Mendoza',                    direccion: 'Col. Universidad, Casa 4',    tipo: 'Mantenimiento' },
    { id_servicio: 4, eta: '13:00', estado: 'pendiente',   prioridad: 'media',   nombre: 'Restaurante Sabor Latino',          direccion: 'Bo. Guamilito, 5 Ave 4 Ca',   tipo: 'Reparación' },
    { id_servicio: 5, eta: '14:30', estado: 'pendiente',   prioridad: 'alta',    nombre: 'María Josefa Rodríguez',            direccion: 'Res. El Portal, Senda',       tipo: 'Mantenimiento' },
    { id_servicio: 6, eta: '15:45', estado: 'pendiente',   prioridad: 'media',   nombre: 'Supermercado La Antorcha',          direccion: 'Salida a La Lima, KM',        tipo: 'Instalación' },
  ],
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const ESTADO_LABEL = {
  completado:  'Completado',
  en_progreso: 'En Ruta',
  pendiente:   'Pendiente',
  cancelado:   'Cancelado',
}

const formatFecha = (isoDate) => {
  if (!isoDate) return ''
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })
}

/* ── Componente tarjeta de servicio ──────────────────────────────────────── */
function ServicioCard({ servicio, onVerDetalle }) {
  const isActive    = servicio.estado === 'en_progreso'
  const isCompleted = servicio.estado === 'completado'

  return (
    <article
      className={`${styles.card} ${isActive ? styles.cardActive : ''} ${isCompleted ? styles.cardCompleted : ''}`}
    >
      <div className={styles.cardMain}>
        {/* ETA */}
        <div className={styles.etaCol}>
          <span className={styles.etaLabel}>ETA</span>
          <span className={styles.etaTime}>{servicio.eta}</span>
        </div>

        {/* Línea de tiempo vertical */}
        <div className={styles.timeline}>
          <div className={`${styles.dot} ${styles[`dot_${servicio.estado}`]}`} />
          <div className={styles.line} />
        </div>

        {/* Info del servicio */}
        <div className={styles.info}>
          <div className={styles.badges}>
            <Badge label={ESTADO_LABEL[servicio.estado] ?? servicio.estado} variant={servicio.estado} />
            {servicio.prioridad === 'urgente' && (
              <Badge label="Urgente" variant="urgente" />
            )}
          </div>
          <h3 className={styles.nombre}>{servicio.nombre}</h3>
          <p className={styles.direccion}>
            <span className={styles.pinIcon}><IconPin /></span>
            {servicio.direccion}
          </p>
          <p className={styles.tipo}>{servicio.tipo}</p>
        </div>

        {/* Chevron */}
        <button
          className={styles.chevronBtn}
          onClick={() => onVerDetalle(servicio)}
          aria-label={`Ver detalles de ${servicio.nombre}`}
        >
          <IconChevron />
        </button>
      </div>

      {/* Botón navegar (solo si activo o pendiente) */}
      {!isCompleted && (
        <button
          className={`${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}
          onClick={() => onVerDetalle(servicio)}
        >
          <IconNav />
          <span>Ver detalles de la orden</span>
        </button>
      )}
    </article>
  )
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function RutaDiariaPage() {
  const { user } = useAuth()
  const [ruta,    setRuta]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const fetchRuta = async () => {
      setLoading(true)
      try {
        if (USE_MOCK) {
          // Simular latencia de red
          await new Promise((r) => setTimeout(r, 600))
          setRuta(MOCK_RUTA)
        } else {
          const data = await getMiRuta()
          setRuta(data)
        }
      } catch (err) {
        setError(err?.response?.data?.detail || 'No se pudo cargar la ruta.')
      } finally {
        setLoading(false)
      }
    }
    fetchRuta()
  }, [])

  const handleVerDetalle = (servicio) => {
    // TODO: Navegar a /servicios/:id cuando exista esa pantalla
    console.log('Ver detalle servicio:', servicio.id_servicio)
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
        <p className={styles.loadingText}>Cargando tu ruta del día...</p>
      </div>
    )
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>{error}</p>
      </div>
    )
  }

  const nombre = ruta?.tecnico?.nombre_completo ?? user?.nombre_completo ?? 'Técnico'
  const primerNombre = nombre.split(' ')[0]

  return (
    <div className={styles.page}>
      {/* ── Encabezado del día ────────────────────────── */}
      <header className={styles.pageHeader}>
        <div className={styles.dateRow}>
          <span className={styles.dateLabel}>
            <IconCalendar />
            HOY, {ruta?.fecha
              ? new Date(ruta.fecha + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'long' }).toUpperCase()
              : ''}
          </span>
        </div>
        <h2 className={styles.greeting}>Hola, {primerNombre}</h2>
      </header>

      {/* ── Resumen del día ───────────────────────────── */}
      <section className={styles.resumen}>
        <div className={styles.resumenItem}>
          <span className={styles.resumenIcon}><IconPin /></span>
          <span className={styles.resumenValue}>{ruta?.resumen?.total_paradas ?? '-'}</span>
          <span className={styles.resumenLabel}>PARADAS</span>
        </div>
        <div className={styles.resumenDivider} />
        <div className={styles.resumenItem}>
          <span className={styles.resumenIcon}><IconClock /></span>
          <span className={styles.resumenValue}>{ruta?.resumen?.duracion_estimada_h ?? '-'}h</span>
          <span className={styles.resumenLabel}>EST.</span>
        </div>
        <div className={styles.resumenDivider} />
        <div className={styles.resumenItem}>
          <span className={styles.resumenIcon}><IconRoute /></span>
          <span className={styles.resumenValue}>{ruta?.resumen?.km_ruta ?? '-'}km</span>
          <span className={styles.resumenLabel}>RUTA</span>
        </div>
      </section>

      {/* ── Alerta si existe ──────────────────────────── */}
      {ruta?.alerta && (
        <div className={styles.alertBanner}>
          <IconAlert />
          <span>{ruta.alerta.mensaje}</span>
        </div>
      )}

      {/* ── Lista de servicios ────────────────────────── */}
      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <h3 className={styles.listTitle}>Cronograma del Día</h3>
          <span className={styles.listUpdated}>
            Actualizado: {new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {ruta?.servicios?.length > 0 ? (
          <div className={styles.list}>
            {ruta.servicios.map((s) => (
              <ServicioCard
                key={s.id_servicio}
                servicio={s}
                onVerDetalle={handleVerDetalle}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No hay paradas programadas para hoy.</p>
        )}

        <p className={styles.listEnd}>No hay más paradas programadas</p>
      </section>
    </div>
  )
}
