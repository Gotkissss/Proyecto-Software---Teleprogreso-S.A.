/**
 * pages/AlertasPage.jsx
 * ---------------------------------------------------------------------------
 * Muestra las alertas activas: técnicos retrasados, servicios vencidos.
 * Permite al supervisor marcar alertas como resueltas.
 * ---------------------------------------------------------------------------
 */
 
import { useEffect, useState } from 'react'
import { getAlertas, resolverAlerta } from '../api/alertaService'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import styles from './AlertasPage.module.css'
 
export default function AlertasPage() {
  const [alertas, setAlertas]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [resolviendo, setResolviendo] = useState(null)
 
  const fetchAlertas = async () => {
    try {
      const data = await getAlertas()
      setAlertas(data)
    } catch (err) {
      setError('No se pudieron cargar las alertas.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
 
  useEffect(() => {
    fetchAlertas()
  }, [])
 
  const handleResolver = async (id) => {
    setResolviendo(id)
    try {
      await resolverAlerta(id)
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
 
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Alertas y retrasos</h1>
 
      {alertas.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>✓</p>
          <p className={styles.emptyMsg}>Sin alertas activas. Todo en orden.</p>
        </div>
      ) : (
        <ul className={styles.alertasList}>
          {alertas.map((alerta) => (
            <li key={alerta.id} className={`${styles.alertaItem} ${styles[alerta.nivel]}`}>
              <div className={styles.alertaHeader}>
                <Badge
                  label={alerta.nivel}
                  variant={alerta.nivel === 'critico' ? 'danger' : 'warning'}
                />
                <span className={styles.alertaHora}>{alerta.hora ?? ''}</span>
              </div>
 
              <p className={styles.alertaMensaje}>{alerta.mensaje}</p>
 
              {alerta.tecnico && (
                <p className={styles.alertaTecnico}>
                  Técnico: <strong>{alerta.tecnico.nombre_completo}</strong>
                </p>
              )}
 
              {alerta.tarea && (
                <p className={styles.alertaTarea}>
                  Tarea: {alerta.tarea.titulo}
                </p>
              )}
 
              <button
                className={styles.resolverBtn}
                onClick={() => handleResolver(alerta.id)}
                disabled={resolviendo === alerta.id}
              >
                {resolviendo === alerta.id ? 'Resolviendo...' : 'Marcar como resuelta'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}