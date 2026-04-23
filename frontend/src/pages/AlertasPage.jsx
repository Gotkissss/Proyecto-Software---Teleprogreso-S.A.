import { useEffect, useState } from 'react'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import styles from './AlertasPage.module.css'

const USE_MOCK = true

const MOCK_ALERTAS = [
  {
    id: 1,
    nivel: 'critico',
    mensaje: 'Tarea con más de 2 horas de retraso',
    tecnico: { nombre_completo: 'Juan Pérez García' },
    tarea: { titulo: 'Reparación de señal - Tienda El Ahorro' },
    fecha_hora: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resuelta: false,
  },
  {
    id: 2,
    nivel: 'advertencia',
    mensaje: 'Tarea sin asignar hace más de 1 hora',
    tecnico: null,
    tarea: { titulo: 'Instalación TV Cable - Restaurante Sabor Latino' },
    fecha_hora: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    resuelta: false,
  },
  {
    id: 3,
    nivel: 'advertencia',
    mensaje: 'Técnico en pausa prolongada (más de 45 min)',
    tecnico: { nombre_completo: 'Carlos Hernández' },
    tarea: null,
    fecha_hora: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    resuelta: false,
  },
  {
    id: 4,
    nivel: 'critico',
    mensaje: 'Incidencia reportada por el técnico en el sitio',
    tecnico: { nombre_completo: 'María López' },
    tarea: { titulo: 'Mantenimiento preventivo - Carlos Mendoza' },
    fecha_hora: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    resuelta: false,
  },
]

const formatHora = (isoString) => {
  const fecha = new Date(isoString)
  const ahora = new Date()
  const diffMin = Math.floor((ahora - fecha) / (1000 * 60))

  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH} h`
  return fecha.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resolviendo, setResolviendo] = useState(null)

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 500))
          setAlertas(MOCK_ALERTAS)
        } else {
          const { getAlertas } = await import('../api/alertaService')
          const data = await getAlertas()
          setAlertas(data)
        }
      } catch (err) {
        setError('No se pudieron cargar las alertas.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAlertas()
  }, [])

  const handleResolver = async (id) => {
    setResolviendo(id)
    try {
      if (!USE_MOCK) {
        const { resolverAlerta } = await import('../api/alertaService')
        await resolverAlerta(id)
      } else {
        await new Promise((r) => setTimeout(r, 500))
      }
      setAlertas((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Error al resolver alerta:', err)
    } finally {
      setResolviendo(null)
    }
  }

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

  const alertasActivas = alertas.filter((a) => !a.resuelta)

  return (
    <div className={styles.page}>
      {/* ── Encabezado ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Alertas operativas</h1>
        {alertasActivas.length > 0 && (
          <p className={styles.subtitle}>
            {alertasActivas.length} alerta{alertasActivas.length !== 1 ? 's' : ''} activa{alertasActivas.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {alertasActivas.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✓</div>
          <p className={styles.emptyMsg}>No hay alertas activas por el momento.</p>
        </div>
      ) : (
        <ul className={styles.alertasList}>
          {alertasActivas.map((alerta) => (
            <li key={alerta.id} className={styles.alertaItem}>
              {/* Barra lateral de color */}
              <div className={`${styles.accentBar} ${styles[alerta.nivel]}`} />

              {/* Cuerpo principal */}
              <div className={styles.alertaBody}>
                <div className={styles.alertaTop}>
                  <Badge
                    label={alerta.nivel === 'critico' ? 'Crítico' : 'Advertencia'}
                    variant={alerta.nivel === 'critico' ? 'danger' : 'warning'}
                  />
                  <span className={styles.alertaHora}>
                    {formatHora(alerta.fecha_hora)}
                  </span>
                </div>

                <p className={styles.alertaMensaje}>{alerta.mensaje}</p>

                <div className={styles.alertaMeta}>
                  {alerta.tecnico && (
                    <span>
                      Técnico: <strong>{alerta.tecnico.nombre_completo}</strong>
                    </span>
                  )}
                  {alerta.tarea && (
                    <span>{alerta.tarea.titulo}</span>
                  )}
                </div>
              </div>

              {/* Pie con acción */}
              <div className={styles.alertaFooter}>
                <button
                  className={styles.resolverBtn}
                  onClick={() => handleResolver(alerta.id)}
                  disabled={resolviendo === alerta.id}
                >
                  {resolviendo === alerta.id ? 'Resolviendo...' : 'Marcar como resuelta'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}