/**
 * pages/DashboardPage.jsx
 * ---------------------------------------------------------------------------
 * Dashboard principal del supervisor.
 * Muestra: técnicos activos, tareas completadas, pendientes y en retraso.
 * 
 * Mientras el backend no tenga /metricas/supervisor, usa datos MOCK.
 * Para activar el backend real: cambiar USE_MOCK a false.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import styles from './DashboardPage.module.css'

const USE_MOCK = true

/* ── MOCK DATA ───────────────────────────────────────────────── */
const MOCK_METRICAS = {
  tecnicos_activos: 4,
  tareas_completadas: 12,
  tareas_pendientes: 8,
  tareas_retrasadas: 2,
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

export default function DashboardPage() {
  const navigate = useNavigate()

  const [metricas, setMetricas]         = useState(null)
  const [tecnicosList, setTecnicosList] = useState([])
  const [tareasList, setTareasList]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 600))
          setMetricas(MOCK_METRICAS)
          setTecnicosList(MOCK_TECNICOS)
          setTareasList(MOCK_TAREAS)
        } else {
          const { getMetricas, getTecnicos } = await import('../api/alertaService')
          const { getTareas } = await import('../api/tareaService')
          const [m, tecnicos, tareas] = await Promise.all([
            getMetricas(),
            getTecnicos(),
            getTareas(),
          ])
          setMetricas(m)
          setTecnicosList(tecnicos)
          setTareasList(tareas)
        }
      } catch (err) {
        setError('No se pudieron cargar los datos del dashboard.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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

      <section className={styles.metricsGrid}>
        <MetricCard label="Técnicos activos"   value={metricas?.tecnicos_activos ?? 0}   variant="info" />
        <MetricCard label="Tareas completadas"  value={metricas?.tareas_completadas ?? 0} variant="success" />
        <MetricCard label="Tareas pendientes"   value={metricas?.tareas_pendientes ?? 0}  variant="warning" />
        <MetricCard
          label="En retraso"
          value={metricas?.tareas_retrasadas ?? 0}
          variant="danger"
          onClick={() => navigate('/supervisor/alertas')}
          clickable
        />
      </section>

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
                    {tec.tareas_asignadas ?? 0} tareas asignadas
                  </span>
                </div>
                <Badge
                  label={tec.estado ?? 'activo'}
                  variant={tec.estado === 'activo' ? 'success' : 'warning'}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

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