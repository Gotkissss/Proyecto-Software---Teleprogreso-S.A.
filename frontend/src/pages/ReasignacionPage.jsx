/**
 * pages/ReasignacionPage.jsx
 * ---------------------------------------------------------------------------
 * Permite al supervisor ver tareas asignadas y reasignarlas a otro técnico.
 * 
 * Mientras el backend no tenga los endpoints completos, usa datos MOCK.
 * Para activar el backend real: cambiar USE_MOCK a false.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import styles from './ReasignacionPage.module.css'

const USE_MOCK = true

const MOCK_TAREAS = [
  { id: 1, titulo: 'Instalación fibra óptica - Los Álamos',  estado: 'pendiente',   tecnico: { id: 2, nombre_completo: 'Juan Pérez García' } },
  { id: 2, titulo: 'Reparación de señal - El Ahorro',        estado: 'en_progreso', tecnico: { id: 2, nombre_completo: 'Juan Pérez García' } },
  { id: 3, titulo: 'Mantenimiento - Carlos Mendoza',         estado: 'pendiente',   tecnico: { id: 3, nombre_completo: 'María López' } },
  { id: 4, titulo: 'Instalación TV Cable - Sabor Latino',    estado: 'pendiente',   tecnico: null },
]

const MOCK_TECNICOS = [
  { id: 2, nombre_completo: 'Juan Pérez García' },
  { id: 3, nombre_completo: 'María López' },
  { id: 4, nombre_completo: 'Carlos Hernández' },
  { id: 5, nombre_completo: 'Ana Rodríguez' },
]

export default function ReasignacionPage() {
  const [tareas, setTareas]       = useState([])
  const [tecnicos, setTecnicos]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const [tareaSeleccionada, setTareaSeleccionada] = useState(null)
  const [tecnicoNuevo, setTecnicoNuevo]           = useState('')
  const [guardando, setGuardando]                 = useState(false)
  const [exito, setExito]                         = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 500))
          setTareas(MOCK_TAREAS)
          setTecnicos(MOCK_TECNICOS)
        } else {
          const { getTareas } = await import('../api/tareaService')
          const { getTecnicos: fetchTecnicos } = await import('../api/alertaService')
          const [t, tec] = await Promise.all([
            getTareas({ estado: 'pendiente,en_curso' }),
            fetchTecnicos(),
          ])
          setTareas(t)
          setTecnicos(tec)
        }
      } catch (err) {
        setError('No se pudieron cargar las tareas.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleReasignar = async () => {
    if (!tareaSeleccionada || !tecnicoNuevo) return
    setGuardando(true)
    try {
      if (!USE_MOCK) {
        const { reasignarTarea } = await import('../api/tareaService')
        await reasignarTarea(tareaSeleccionada.id, Number(tecnicoNuevo))
      } else {
        await new Promise((r) => setTimeout(r, 600))
      }
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tareaSeleccionada.id
            ? { ...t, tecnico: tecnicos.find((tec) => tec.id === Number(tecnicoNuevo)) }
            : t
        )
      )
      setExito('Tarea reasignada correctamente.')
      setTareaSeleccionada(null)
      setTecnicoNuevo('')
      setTimeout(() => setExito(null), 3000)
    } catch (err) {
      console.error('Error al reasignar:', err)
    } finally {
      setGuardando(false)
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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Reasignación de servicios</h1>

      {exito && <div className={styles.exitoBanner}>{exito}</div>}

      {tareas.length === 0 ? (
        <p className={styles.emptyMsg}>No hay tareas activas para reasignar.</p>
      ) : (
        <ul className={styles.tareasList}>
          {tareas.map((tarea) => (
            <li key={tarea.id} className={styles.tareaItem}>
              <div className={styles.tareaInfo}>
                <span className={styles.tareaTitulo}>{tarea.titulo}</span>
                <span className={styles.tareaTecnico}>
                  {tarea.tecnico?.nombre_completo ?? 'Sin asignar'}
                </span>
              </div>

              <div className={styles.tareaAcciones}>
                <Badge
                  label={tarea.estado}
                  variant={
                    tarea.estado === 'en_progreso' ? 'info'    :
                    tarea.estado === 'retrasado'   ? 'danger'  : 'warning'
                  }
                />
                <button
                  className={styles.reasignarBtn}
                  onClick={() => {
                    setTareaSeleccionada(tarea)
                    setTecnicoNuevo('')
                  }}
                >
                  Reasignar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tareaSeleccionada && (
        <div className={styles.overlay} onClick={() => setTareaSeleccionada(null)}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.panelTitle}>Reasignar tarea</h2>
            <p className={styles.panelSubtitle}>{tareaSeleccionada.titulo}</p>

            <label className={styles.label}>Asignar a:</label>
            <select
              className={styles.select}
              value={tecnicoNuevo}
              onChange={(e) => setTecnicoNuevo(e.target.value)}
            >
              <option value="">Selecciona un técnico</option>
              {tecnicos.map((tec) => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombre_completo}
                </option>
              ))}
            </select>

            <div className={styles.panelBtns}>
              <button className={styles.cancelBtn} onClick={() => setTareaSeleccionada(null)}>
                Cancelar
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleReasignar}
                disabled={!tecnicoNuevo || guardando}
              >
                {guardando ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}