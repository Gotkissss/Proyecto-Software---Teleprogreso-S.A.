/**
 * pages/DashboardPage.jsx
 * ---------------------------------------------------------------------------
 * Dashboard principal del supervisor.
 * Muestra: técnicos activos, tareas completadas, pendientes y en retraso.
 * Conectado al endpoint /metricas/supervisor vía alertaService.
 * ---------------------------------------------------------------------------
 */
 
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMetricas, getTecnicos } from '../api/alertaService'
import { getTareas } from '../api/tareaService'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import styles from './DashboardPage.module.css'
 
export default function DashboardPage() {
  const navigate = useNavigate()
 
  const [metricas, setMetricas]     = useState(null)
  const [tecnicosList, setTecnicosList] = useState([])
  const [tareasList, setTareasList] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, tecnicos, tareas] = await Promise.all([
          getMetricas(),
          getTecnicos(),
          getTareas(),
        ])
        setMetricas(m)
        setTecnicosList(tecnicos)
        setTareasList(tareas)
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
 
      {/* ── Tarjetas de métricas ─────────────────────── */}
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
 
      {/* ── Lista de técnicos ────────────────────────── */}
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
 
      {/* ── Tareas recientes ─────────────────────────── */}
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
                    tarea.estado === 'finalizado' ? 'success' :
                    tarea.estado === 'en_curso'   ? 'info'    :
                    tarea.estado === 'retrasado'  ? 'danger'  : 'warning'
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
 
/* ── Componente interno: tarjeta de métrica ─────────────── */
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
 