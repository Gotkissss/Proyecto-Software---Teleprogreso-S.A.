/**
 * pages/PausasPage.jsx
 * ---------------------------------------------------------------------------
 * Pantalla "Pausas y Asistencia".
 *
 * SCRUM-51: Botón "Iniciar descanso" agregado en la sección de acciones.
 * SCRUM-52: Indicador visual de estado "En descanso" en el hero y métricas.
 *
 * Mientras el backend no tenga /asistencias/*, se usan datos MOCK.
 * Para activar el backend real: cambiar USE_MOCK a false.
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect } from 'react'
import {
  getAsistenciaHoy,
  iniciarPausa,
  finalizarPausa,
  finalizarJornada,
  getTiposPausa,
} from '../api/asistenciaService'
import { useTimer, formatSeconds } from '../hooks/useTimer'
import Spinner from '../components/ui/Spinner'
import styles from './PausasPage.module.css'

/* ─── Cambiar a false cuando el backend tenga /asistencias/* ───────────── */
const USE_MOCK = true

/* ── Iconos ──────────────────────────────────────────────────────────────── */
const IconClock   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconPause   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IconPlay    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const IconCheck   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconBolt    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IconTimer   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13"/><line x1="12" y1="3" x2="12" y2="5"/></svg>
const IconHistory = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.01"/></svg>
const IconX       = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconCoffee  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
/* SCRUM-51/52: Icono de luna para representar el descanso */
const IconMoon    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>

/* ── MOCK DATA ────────────────────────────────────────────────────────────── */
const MOCK_ASISTENCIA = {
  id_asistencia: 1,
  fecha: new Date().toISOString().split('T')[0],
  hora_entrada: new Date().toISOString(),
  hora_salida: null,
  tiempo_activo_segundos: 15621,
  en_pausa: false,
  en_descanso: false,          // SCRUM-52: nuevo campo
  tiempo_en_pausa_segundos: 3900,
  tiempo_en_descanso_segundos: 0, // SCRUM-52: nuevo campo
  productividad_pct: 92,
  historial: [
    { tipo: 'entrada',    label: 'Inicio de Jornada',       hora_inicio: '08:00 AM', hora_fin: null,       duracion_segundos: null },
    { tipo: 'pausa',      label: 'Pausa de Almuerzo',       hora_inicio: '12:30 PM', hora_fin: '01:30 PM', duracion_segundos: 3600 },
    { tipo: 'pausa',      label: 'Pausa Técnica (Soporte)', hora_inicio: '03:15 PM', hora_fin: '03:20 PM', duracion_segundos: 300  },
  ],
}

const MOCK_TIPOS_PAUSA = [
  { id: 'almuerzo', label: 'Pausa de Almuerzo',       duracion_max_min: 60 },
  { id: 'tecnica',  label: 'Pausa Técnica (Soporte)', duracion_max_min: 15 },
  { id: 'personal', label: 'Pausa Personal',           duracion_max_min: 10 },
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const secsToHHMM = (s) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`
}

const formatDuracion = (seconds) => {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

/* ── Modal de selección de pausa ────────────────────────────────────────── */
function ModalPausa({ tipos, onSelect, onClose, loading }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Seleccionar tipo de pausa</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        <p className={styles.modalSubtitle}>
          Registra tus pausas para cumplir con la normativa operativa.
        </p>
        <div className={styles.modalList}>
          {tipos.map((t) => (
            <button
              key={t.id}
              className={styles.tipoPausaBtn}
              onClick={() => onSelect(t.id)}
              disabled={loading}
            >
              <span className={styles.tipoPausaIcon}><IconCoffee /></span>
              <div className={styles.tipoPausaInfo}>
                <span className={styles.tipoPausaLabel}>{t.label}</span>
                <span className={styles.tipoPausaMax}>Máx. {t.duracion_max_min} min</span>
              </div>
              {loading && <Spinner size="sm" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Componente fila de historial ────────────────────────────────────────── */
function HistorialRow({ item }) {
  const isEntrada  = item.tipo === 'entrada'
  const isDescanso = item.tipo === 'descanso' // SCRUM-52
  return (
    <div className={styles.historialRow}>
      <span className={`${styles.historialIcon} ${isEntrada ? styles.iconEntrada : isDescanso ? styles.iconDescanso : styles.iconPausa}`}>
        {isEntrada ? <IconBolt /> : isDescanso ? <IconMoon /> : <IconClock />}
      </span>
      <div className={styles.historialInfo}>
        <span className={styles.historialLabel}>{item.label}</span>
        {item.hora_fin
          ? <span className={styles.historialTime}>{item.hora_inicio} - {item.hora_fin}</span>
          : <span className={styles.historialTime}>{item.hora_inicio}</span>
        }
      </div>
      <span className={styles.historialDuracion}>
        {item.duracion_segundos != null
          ? formatDuracion(item.duracion_segundos)
          : item.tipo === 'entrada' ? 'Entrada' : ''}
      </span>
    </div>
  )
}

/* ── SCRUM-52: Indicador de estado de descanso ──────────────────────────── */
function IndicadorDescanso({ tiempoDescansoSegundos }) {
  const { formatted } = useTimer(tiempoDescansoSegundos, true)
  return (
    <div className={styles.indicadorDescanso}>
      <span className={styles.indicadorDescansoIcon}><IconMoon /></span>
      <div className={styles.indicadorDescansoTexto}>
        <span className={styles.indicadorDescansoLabel}>EN DESCANSO</span>
        <span className={styles.indicadorDescansoTimer}>{formatted}</span>
      </div>
      <span className={styles.indicadorDescansoPulso} />
    </div>
  )
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function PausasPage() {
  const [asistencia, setAsistencia] = useState(null)
  const [tiposPausa, setTiposPausa] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showModal,  setShowModal]  = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  const enPausa    = asistencia?.en_pausa    ?? false
  const enDescanso = asistencia?.en_descanso ?? false  // SCRUM-52

  const { formatted: tiempoActivo } = useTimer(
    asistencia?.tiempo_activo_segundos ?? 0,
    !enPausa && !enDescanso && !!asistencia?.hora_entrada && !asistencia?.hora_salida
  )

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 500))
          setAsistencia(MOCK_ASISTENCIA)
          setTiposPausa(MOCK_TIPOS_PAUSA)
        } else {
          const [asist, tipos] = await Promise.all([
            getAsistenciaHoy(),
            getTiposPausa(),
          ])
          setAsistencia(asist)
          setTiposPausa(tipos)
        }
      } catch (err) {
        setError(err?.response?.data?.detail || 'No se pudo cargar la asistencia.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleIniciarPausa = async (tipoPausaId) => {
    setActionLoading(true)
    try {
      if (!USE_MOCK) {
        const updated = await iniciarPausa(tipoPausaId)
        setAsistencia(updated)
      } else {
        setAsistencia((prev) => ({ ...prev, en_pausa: true, en_descanso: false }))
      }
      setShowModal(false)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al iniciar pausa.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReanudar = async () => {
    setActionLoading(true)
    try {
      if (!USE_MOCK) {
        const updated = await finalizarPausa()
        setAsistencia(updated)
      } else {
        setAsistencia((prev) => ({ ...prev, en_pausa: false, en_descanso: false }))
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al reanudar.')
    } finally {
      setActionLoading(false)
    }
  }

  /* SCRUM-51: Manejador para iniciar descanso */
  const handleIniciarDescanso = async () => {
    setActionLoading(true)
    try {
      if (!USE_MOCK) {
        // Cuando el backend esté listo, llamar al endpoint correspondiente
        // const updated = await iniciarDescanso()
        // setAsistencia(updated)
      } else {
        setAsistencia((prev) => ({
          ...prev,
          en_descanso: true,
          en_pausa: false,
          tiempo_en_descanso_segundos: prev.tiempo_en_descanso_segundos ?? 0,
        }))
      }
      setSuccessMsg('Descanso iniciado. Recuerda regresar a tiempo.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al iniciar descanso.')
    } finally {
      setActionLoading(false)
    }
  }

  /* SCRUM-51: Manejador para finalizar descanso */
  const handleFinalizarDescanso = async () => {
    setActionLoading(true)
    try {
      if (!USE_MOCK) {
        // const updated = await finalizarDescanso()
        // setAsistencia(updated)
      } else {
        setAsistencia((prev) => ({ ...prev, en_descanso: false }))
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al finalizar descanso.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFinalizarJornada = async () => {
    if (!window.confirm('¿Confirmas que deseas finalizar la jornada de hoy?')) return
    setActionLoading(true)
    try {
      if (!USE_MOCK) {
        await finalizarJornada()
      } else {
        await new Promise((r) => setTimeout(r, 800))
      }
      setSuccessMsg('¡Jornada finalizada! Tu estado ha sido actualizado.')
      setAsistencia((prev) => ({ ...prev, hora_salida: new Date().toISOString() }))
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al finalizar jornada.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
        <p className={styles.loadingText}>Cargando asistencia...</p>
      </div>
    )
  }

  if (error && !asistencia) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>{error}</p>
      </div>
    )
  }

  const jornadaFinalizada = !!asistencia?.hora_salida

  /* SCRUM-52: determina el estado visual del reloj */
  const clockStateClass = enDescanso
    ? styles.clockRingDescanso
    : enPausa
    ? styles.clockRingPaused
    : ''

  const clockTimeClass = enDescanso
    ? styles.clockTimeDescanso
    : enPausa
    ? styles.clockTimePaused
    : ''

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.jornadaLabel}>
          Jornada de Hoy:{' '}
          {asistencia?.fecha
            ? new Date(asistencia.fecha + 'T12:00:00').toLocaleDateString('es-GT', {
                day: 'numeric', month: 'long', year: 'numeric'
              })
            : ''}
        </p>

        {/* SCRUM-52: reloj cambia de color/estado según en_descanso */}
        <div className={`${styles.clockRing} ${clockStateClass}`}>
          <span className={styles.clockIcon}>
            {enDescanso ? <IconMoon /> : <IconClock />}
          </span>
          <span className={`${styles.clockTime} ${clockTimeClass}`}>
            {tiempoActivo}
          </span>
          <span className={styles.clockLabel}>
            {enDescanso ? 'EN DESCANSO' : 'TIEMPO ACTIVO'}
          </span>
        </div>

        {/* SCRUM-52: indicador de descanso activo debajo del reloj */}
        {enDescanso && (
          <IndicadorDescanso
            tiempoDescansoSegundos={asistencia?.tiempo_en_descanso_segundos ?? 0}
          />
        )}

        <p className={styles.normativaText}>
          Registra tus pausas y descansos para cumplir con la normativa operativa.
        </p>

        {/* Botones de acción — solo visibles si la jornada no ha finalizado */}
        {!jornadaFinalizada && (
          <div className={styles.accionesRow}>
            {/* Botón pausa existente */}
            {!enDescanso && (
              <button
                className={`${styles.pauseBtn} ${enPausa ? styles.pauseBtnActive : ''}`}
                onClick={enPausa ? handleReanudar : () => setShowModal(true)}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <Spinner size="sm" color="white" />
                  : enPausa ? <IconPlay /> : <IconPause />}
                <span>{enPausa ? 'REANUDAR' : 'PAUSAR'}</span>
              </button>
            )}

            {/* SCRUM-51: Botón "Iniciar descanso" / "Terminar descanso" */}
            {!enPausa && (
              <button
                className={`${styles.descansoBtn} ${enDescanso ? styles.descansoBtnActive : ''}`}
                onClick={enDescanso ? handleFinalizarDescanso : handleIniciarDescanso}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <Spinner size="sm" color="white" />
                  : <IconMoon />}
                <span>{enDescanso ? 'TERMINAR DESCANSO' : 'INICIAR DESCANSO'}</span>
              </button>
            )}
          </div>
        )}
      </section>

      <section className={styles.metrics}>
        <div className={styles.metricCard}>
          <span className={styles.metricIcon}><IconBolt /></span>
          <div>
            <p className={styles.metricLabel}>PRODUCTIVIDAD</p>
            <p className={styles.metricValue}>{asistencia?.productividad_pct ?? '-'}%</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricIcon}><IconTimer /></span>
          <div>
            <p className={styles.metricLabel}>EN PAUSA</p>
            <p className={styles.metricValue}>
              {asistencia?.tiempo_en_pausa_segundos != null
                ? secsToHHMM(asistencia.tiempo_en_pausa_segundos)
                : '--:--:--'}
            </p>
          </div>
        </div>
        {/* SCRUM-52: nueva métrica de tiempo en descanso */}
        <div className={`${styles.metricCard} ${enDescanso ? styles.metricCardDescanso : ''}`}>
          <span className={`${styles.metricIcon} ${enDescanso ? styles.metricIconDescanso : ''}`}>
            <IconMoon />
          </span>
          <div>
            <p className={styles.metricLabel}>EN DESCANSO</p>
            <p className={styles.metricValue}>
              {asistencia?.tiempo_en_descanso_segundos != null
                ? secsToHHMM(asistencia.tiempo_en_descanso_segundos)
                : '--:--:--'}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.historial}>
        <div className={styles.historialHeader}>
          <span className={styles.historialTitle}>
            <IconHistory />
            Historial de hoy
          </span>
          <button className={styles.verTodoBtn}>Ver todo</button>
        </div>

        <div className={styles.historialList}>
          {asistencia?.historial?.map((item, i) => (
            <HistorialRow key={i} item={item} />
          ))}
        </div>
      </section>

      {successMsg && (
        <div className={styles.successBanner}>
          <IconCheck />
          <span>{successMsg}</span>
        </div>
      )}

      {error && asistencia && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      {!jornadaFinalizada ? (
        <div className={styles.finalizarWrap}>
          <button
            className={styles.finalizarBtn}
            onClick={handleFinalizarJornada}
            disabled={actionLoading || enPausa || enDescanso}
          >
            {actionLoading
              ? <Spinner size="sm" color="white" />
              : <IconCheck />}
            <span>Guardar y Finalizar Jornada</span>
          </button>
          <p className={styles.finalizarNote}>
            Al finalizar, tu ubicación y estado se actualizarán en el panel de supervisión.
          </p>
        </div>
      ) : (
        <div className={styles.jornadaFinalizada}>
          <IconCheck />
          <span>Jornada finalizada</span>
        </div>
      )}

      {showModal && (
        <ModalPausa
          tipos={tiposPausa}
          onSelect={handleIniciarPausa}
          onClose={() => setShowModal(false)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}