/**
 * pages/DashboardPage.jsx
 * ---------------------------------------------------------------------------
 * Dashboard principal del supervisor.
 * Muestra: técnicos activos, tareas completadas, pendientes y en retraso.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { getTareas } from '../api/tareaService'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import styles from './DashboardPage.module.css'

const USE_MOCK = false

/* ── MOCK DATA (solo como fallback de desarrollo) ────────────────────────── */
const MOCK_METRICAS = {
  tecnicos_activos:   4,
  tareas_completadas: 12,
  tareas_pendientes:  8,
  tareas_retrasadas:  2,
}

const MOCK_TECNICOS = [
  { id: 1, nombre_completo: 'Juan Pérez García',   estado: 'activo',   tareas_asignadas: 6 },
  { id: 2, nombre_completo: 'María López',         estado: 'activo',   tareas_asignadas: 4 },
  { id: 3, nombre_completo: 'Carlos Hernández',    estado: 'en_pausa', tareas_asignadas: 3 },
  { id: 4, nombre_completo: 'Ana Rodríguez',       estado: 'activo',   tareas_asignadas: 5 },
]

const MOCK_TAREAS = [
  { id: 1, titulo: 'Instalación fibra óptica - Los Álamos',  estado: 'pendiente',   tecnico: { nombre_completo: 'Juan Pérez García' } },
  { id: 2, titulo: 'Reparación de señal - El Ahorro',        estado: 'en_progreso', tecnico: { nombre_completo: 'María López' } },
  { id: 3, titulo: 'Mantenimiento preventivo - Carlos M.',   estado: 'completado',  tecnico: { nombre_completo: 'Carlos Hernández' } },
  { id: 4, titulo: 'Instalación TV Cable - Sabor Latino',    estado: 'pendiente',   tecnico: { nombre_completo: 'Ana Rodríguez' } },
  { id: 5, titulo: 'Revisión equipo - María Josefa R.',      estado: 'pendiente',   tecnico: { nombre_completo: 'Juan Pérez García' } },
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Obtiene métricas del supervisor desde el backend real.
 * Endpoint: GET /metricas/supervisor
 */
async function fetchMetricasReal() {
  const { data } = await apiClient.get('/metricas/supervisor')
  return data
}

/**
 * Obtiene técnicos disponibles con conteo de tareas.
 * Endpoint: GET /empleados/tecnicos/disponibles
 */
async function fetchTecnicosReal() {
  const { data } = await apiClient.get('/empleados/tecnicos/disponibles')
  // El endpoint devuelve un array; adaptamos al formato que usa la tabla.
  return (Array.isArray(data) ? data : []).map((tec) => ({
    id:               tec.id_empleado,
    nombre_completo:  tec.nombre_completo,
    estado:           tec.disponible ? 'activo' : 'en_limite',
    tareas_asignadas: tec.tareas_activas,
  }))
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const [metricas,      setMetricas]      = useState(null)
  const [tecnicosList,  setTecnicosList]  = useState([])
  const [tareasList,    setTareasList]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 600))
          setMetricas(MOCK_METRICAS)
          setTecnicosList(MOCK_TECNICOS)
          setTareasList(MOCK_TAREAS)
        } else {
          // Llamadas paralelas para minimizar el tiempo de carga
          const [metricas, tecnicos, tareas] = await Promise.all([
            fetchMetricasReal(),
            fetchTecnicosReal(),
            getTareas(),
          ])
          setMetricas(metricas)
          setTecnicosList(tecnicos)
          // Adaptar tareas al formato que usa la tabla del dashboard
          setTareasList(
            (Array.isArray(tareas) ? tareas : []).map((t) => ({
              id:     t.id_tarea,
              titulo: t.titulo,
              estado: t.estado_tarea,
              tecnico: t.tecnico
                ? { nombre_completo: t.tecnico.nombre }
                : null,
            }))
          )
        }
      } catch (err) {
        console.error('Error al cargar el dashboard:', err)
        setError(
          err?.response?.data?.detail ||
          'No se pudieron cargar los datos del dashboard.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, []) // Sin dependencias: se re-ejecuta en cada montaje (navegación entre páginas)

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <p className={styles.errorMsg}>{error}</p>
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      {/* ── Métricas ── */}
      <section className={styles.metricsGrid}>
        <MetricCard
          label="Técnicos activos"
          value={metricas?.tecnicos_activos ?? 0}
          variant="info"
        />
        <MetricCard
          label="Tareas completadas"
          value={metricas?.tareas_completadas ?? 0}
          variant="success"
        />
        <MetricCard
          label="Tareas pendientes"
          value={metricas?.tareas_pendientes ?? 0}
          variant="warning"
        />
        <MetricCard
          label="En retraso"
          value={metricas?.tareas_retrasadas ?? 0}
          variant="danger"
          onClick={() => navigate('/supervisor/alertas')}
          clickable
        />
      </section>

      {/* ── Técnicos ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Técnicos hoy</h2>
        {tecnicosList.length === 0 ? (
          <p className={styles.emptyMsg}>No hay técnicos registrados.</p>
        ) : (
          <ul className={styles.tecnicosList}>
            {tecnicosList.map((tec) => (
              <li key={tec.id} className={styles.tecnicoItem}>
                <div className={styles.tecnicoAvatar}>
                  {tec.nombre_completo?.[0]?.toUpperCase() ?? 'T'}
                </div>
                <div className={styles.tecnicoInfo}>
                  <span className={styles.tecnicoNombre}>{tec.nombre_completo}</span>
                  <span className={styles.tecnicoTareas}>
                    {tec.tareas_asignadas ?? 0} tareas activas
                  </span>
                </div>
                <Badge
                  label={tec.estado === 'activo' ? 'activo' : 'en límite'}
                  variant={tec.estado === 'activo' ? 'success' : 'warning'}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Tareas recientes ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tareas recientes</h2>
        {tareasList.length === 0 ? (
          <p className={styles.emptyMsg}>No hay tareas registradas.</p>
        ) : (
          <ul className={styles.tareasList}>
            {tareasList.slice(0, 5).map((tarea) => (
              <li
                key={tarea.id}
                className={styles.tareaItem}
                onClick={() => navigate('/supervisor/reasignacion')}
              >
                <div className={styles.tareaInfo}>
                  <span className={styles.tareaTitulo}>{tarea.titulo}</span>
                  <span className={styles.tareaTecnico}>
                    {tarea.tecnico?.nombre_completo ?? 'Sin asignar'}
                  </span>
                </div>
                <Badge
                  label={tarea.estado}
                  variant={
                    tarea.estado === 'completado'  ? 'success' :
                    tarea.estado === 'en_progreso' ? 'info'    :
                    tarea.estado === 'retrasado'   ? 'danger'  : 'warning'
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function MetricCard({ label, value, variant, onClick, clickable }) {
  return (
    <div
      className={`${styles.metricCard} ${styles[variant]} ${clickable ? styles.clickable : ''}`}
      onClick={onClick}
    >
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  )
}