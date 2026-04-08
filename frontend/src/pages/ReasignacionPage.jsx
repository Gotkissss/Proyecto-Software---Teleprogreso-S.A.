/**
 * pages/ReasignacionPage.jsx
 * ---------------------------------------------------------------------------
 * Permite al supervisor ver tareas asignadas y reasignarlas a otro técnico.
 * Conectado a PATCH /tareas/{id}/reasignar de Gualim.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react'
import { getTareas, reasignarTarea } from '../api/tareaService'
import { getTecnicos } from '../api/alertaService'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import styles from './ReasignacionPage.module.css'

export default function ReasignacionPage() {
  const [tareas, setTareas]       = useState([])
  const [tecnicos, setTecnicos]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  /* Estado del modal de reasignación */
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null)
  const [tecnicoNuevo, setTecnicoNuevo]           = useState('')
  const [guardando, setGuardando]                 = useState(false)
  const [exito, setExito]                         = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, tec] = await Promise.all([
          getTareas({ estado: 'pendiente,en_curso' }),
          getTecnicos(),
        ])
        setTareas(t)
        setTecnicos(tec)
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
      await reasignarTarea(tareaSeleccionada.id, Number(tecnicoNuevo))
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tareaSeleccionada.id
            ? {
                ...t,
                tecnico: tecnicos.find((tec) => tec.id === Number(tecnicoNuevo)),
              }
            : t
        )
      )
      setExito(`Tarea reasignada correctamente.`)
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
                    tarea.estado === 'en_curso'  ? 'info'    :
                    tarea.estado === 'retrasado' ? 'danger'  : 'warning'
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

      {/* ── Panel de reasignación ───────────────────── */}
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
              <button
                className={styles.cancelBtn}
                onClick={() => setTareaSeleccionada(null)}
              >
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