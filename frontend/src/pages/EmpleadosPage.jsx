/**
 * pages/EmpleadosPage.jsx
 * ---------------------------------------------------------------------------
 * Gestión de empleados para supervisor/admin.
 * Funcionalidades:
 *   - Tabla de empleados con búsqueda y filtro por rol
 *   - Botón "Editar" → panel lateral con formulario
 *   - Botón "Desactivar/Activar" → modal de confirmación
 *
 * Mientras el backend no tenga /empleados, usa datos MOCK.
 * Para activar el backend real: cambiar USE_MOCK a false.
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useRef } from 'react'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import styles from './EmpleadosPage.module.css'

const USE_MOCK = true

/* ── MOCK DATA (alineado con EmpleadoResponse del backend) ───── */
const MOCK_EMPLEADOS = [
  {
    id_empleado: 1,
    nombre: 'Carlos',
    apellido: 'Administrador',
    correo: 'admin@teleprogreso.com',
    rol: 'admin',
    estado: 'activo',
    telefono: '5550-0001',
    fecha_contratacion: '2020-01-15',
  },
  {
    id_empleado: 2,
    nombre: 'Juan',
    apellido: 'Pérez García',
    correo: 'tecnico@teleprogreso.com',
    rol: 'tecnico',
    estado: 'activo',
    telefono: '5550-0002',
    fecha_contratacion: '2022-06-01',
  },
  {
    id_empleado: 3,
    nombre: 'María',
    apellido: 'López Ruiz',
    correo: 'supervisora@teleprogreso.com',
    rol: 'supervisor',
    estado: 'activo',
    telefono: '5550-0003',
    fecha_contratacion: '2021-03-10',
  },
  {
    id_empleado: 4,
    nombre: 'Carlos',
    apellido: 'Hernández',
    correo: 'carlos.h@teleprogreso.com',
    rol: 'tecnico',
    estado: 'activo',
    telefono: '5550-0004',
    fecha_contratacion: '2023-01-20',
  },
  {
    id_empleado: 5,
    nombre: 'Ana',
    apellido: 'Rodríguez Soto',
    correo: 'ana.r@teleprogreso.com',
    rol: 'tecnico',
    estado: 'inactivo',
    telefono: '5550-0005',
    fecha_contratacion: '2022-09-15',
  },
  {
    id_empleado: 6,
    nombre: 'Roberto',
    apellido: 'Gómez',
    correo: 'roberto.g@teleprogreso.com',
    rol: 'gerente',
    estado: 'activo',
    telefono: '5550-0006',
    fecha_contratacion: '2019-07-01',
  },
]

/* ── Constantes del dominio ──────────────────────────────────── */
const ROLES = ['admin', 'supervisor', 'tecnico', 'gerente']

const ROL_LABEL = {
  admin:      'Admin',
  supervisor: 'Supervisor',
  tecnico:    'Técnico',
  gerente:    'Gerente',
}

const ROL_VARIANT = {
  admin:      'danger',
  supervisor: 'info',
  tecnico:    'muted',
  gerente:    'warning',
}

/* ── Iconos SVG ──────────────────────────────────────────────── */
const IconEdit   = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconToggleOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
    <circle cx="8" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>
)

const IconToggleOn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
    <circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>
)

const IconSearch  = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ── Modal de confirmación para Desactivar/Activar ──────────── */
function ModalConfirmacion({ empleado, onConfirmar, onCancelar, cargando }) {
  const esActivo = empleado.estado === 'activo'
  const accion   = esActivo ? 'desactivar' : 'activar'
  const nuevoEstado = esActivo ? 'inactivo' : 'activo'

  return (
    <div className={styles.modalOverlay} onClick={onCancelar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Icono de advertencia */}
        <div className={`${styles.modalIconWrap} ${esActivo ? styles.modalIconDanger : styles.modalIconSuccess}`}>
          {esActivo ? <IconAlert /> : <IconCheck />}
        </div>

        <h3 className={styles.modalTitle}>
          {esActivo ? 'Desactivar empleado' : 'Activar empleado'}
        </h3>

        <p className={styles.modalDesc}>
          {esActivo
            ? <>¿Estás seguro de que deseas <strong>desactivar</strong> a <strong>{empleado.nombre} {empleado.apellido}</strong>? No podrá iniciar sesión mientras esté inactivo.</>
            : <>¿Deseas <strong>activar</strong> nuevamente a <strong>{empleado.nombre} {empleado.apellido}</strong>? Volverá a tener acceso al sistema.</>
          }
        </p>

        <div className={styles.modalBtns}>
          <button
            className={styles.modalCancelBtn}
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            className={`${styles.modalConfirmBtn} ${esActivo ? styles.modalConfirmDanger : styles.modalConfirmSuccess}`}
            onClick={() => onConfirmar(empleado.id_empleado, nuevoEstado)}
            disabled={cargando}
          >
            {cargando
              ? <><Spinner size="sm" color="white" /> Procesando...</>
              : esActivo
              ? 'Sí, desactivar'
              : 'Sí, activar'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Panel lateral de edición ────────────────────────────────── */
function PanelEditar({ empleado, onGuardar, onCerrar, cargando, errorMsg }) {
  const [form, setForm] = useState({
    nombre:    empleado.nombre    ?? '',
    apellido:  empleado.apellido  ?? '',
    correo:    empleado.correo    ?? '',
    telefono:  empleado.telefono  ?? '',
    rol:       empleado.rol       ?? 'tecnico',
  })
  const [errores, setErrores] = useState({})

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    // Limpiar error del campo al editar
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: null }))
    }
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!form.nombre.trim())   nuevosErrores.nombre   = 'El nombre es obligatorio.'
    if (!form.apellido.trim()) nuevosErrores.apellido  = 'El apellido es obligatorio.'
    if (!form.correo.trim())   nuevosErrores.correo    = 'El correo es obligatorio.'
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      nuevosErrores.correo = 'Ingresa un correo válido.'
    }
    if (form.telefono && form.telefono.trim() && !/^[0-9+\-() ]{7,}$/.test(form.telefono.trim())) {
      nuevosErrores.telefono = 'Teléfono inválido (mín. 7 dígitos).'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validar()) return
    // Solo enviar campos que cambiaron
    const cambios = {}
    if (form.nombre.trim()   !== empleado.nombre)    cambios.nombre    = form.nombre.trim()
    if (form.apellido.trim() !== empleado.apellido)  cambios.apellido  = form.apellido.trim()
    if (form.correo.trim()   !== empleado.correo)    cambios.correo    = form.correo.trim()
    if (form.rol             !== empleado.rol)       cambios.rol       = form.rol
    if (form.telefono.trim() !== (empleado.telefono ?? '')) {
      cambios.telefono = form.telefono.trim() || null
    }
    if (Object.keys(cambios).length === 0) {
      onCerrar() // Sin cambios, solo cerrar
      return
    }
    onGuardar(empleado.id_empleado, cambios)
  }

  return (
    <div className={styles.panelOverlay} onClick={onCerrar}>
      <div className={styles.editPanel} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className={styles.editPanelHeader}>
          <div className={styles.editPanelHeaderLeft}>
            <div className={styles.editAvatar}>
              {empleado.nombre[0]?.toUpperCase()}{empleado.apellido[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className={styles.editPanelTitle}>Editar empleado</h2>
              <p className={styles.editPanelSubtitle}>
                ID #{empleado.id_empleado} — {empleado.correo}
              </p>
            </div>
          </div>
          <button className={styles.panelCloseBtn} onClick={onCerrar} aria-label="Cerrar panel">
            <IconX />
          </button>
        </div>

        {/* Error del servidor */}
        {errorMsg && (
          <div className={styles.editErrorBanner}>
            <IconAlert />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form className={styles.editForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.editFormGrid}>
            {/* Nombre */}
            <div className={styles.editField}>
              <label className={styles.editLabel}>Nombre <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={`${styles.editInput} ${errores.nombre ? styles.editInputError : ''}`}
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                disabled={cargando}
                placeholder="Ej: Juan"
              />
              {errores.nombre && <p className={styles.editFieldError}>{errores.nombre}</p>}
            </div>

            {/* Apellido */}
            <div className={styles.editField}>
              <label className={styles.editLabel}>Apellido <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={`${styles.editInput} ${errores.apellido ? styles.editInputError : ''}`}
                value={form.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                disabled={cargando}
                placeholder="Ej: Pérez García"
              />
              {errores.apellido && <p className={styles.editFieldError}>{errores.apellido}</p>}
            </div>
          </div>

          {/* Correo */}
          <div className={styles.editField}>
            <label className={styles.editLabel}>Correo electrónico <span className={styles.required}>*</span></label>
            <input
              type="email"
              className={`${styles.editInput} ${errores.correo ? styles.editInputError : ''}`}
              value={form.correo}
              onChange={(e) => handleChange('correo', e.target.value)}
              disabled={cargando}
              placeholder="usuario@teleprogreso.com"
            />
            {errores.correo && <p className={styles.editFieldError}>{errores.correo}</p>}
          </div>

          {/* Teléfono */}
          <div className={styles.editField}>
            <label className={styles.editLabel}>Teléfono</label>
            <input
              type="tel"
              className={`${styles.editInput} ${errores.telefono ? styles.editInputError : ''}`}
              value={form.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              disabled={cargando}
              placeholder="Ej: 5550-0001"
            />
            {errores.telefono && <p className={styles.editFieldError}>{errores.telefono}</p>}
          </div>

          {/* Rol */}
          <div className={styles.editField}>
            <label className={styles.editLabel}>Rol</label>
            <select
              className={styles.editSelect}
              value={form.rol}
              onChange={(e) => handleChange('rol', e.target.value)}
              disabled={cargando}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROL_LABEL[r]}</option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className={styles.editFormBtns}>
            <button
              type="button"
              className={styles.editCancelBtn}
              onClick={onCerrar}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.editSaveBtn}
              disabled={cargando}
            >
              {cargando
                ? <><Spinner size="sm" color="white" /> Guardando...</>
                : 'Guardar cambios'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Componente principal ────────────────────────────────────── */
export default function EmpleadosPage() {
  const [empleados,       setEmpleados]       = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)

  // Búsqueda y filtros
  const [busqueda,        setBusqueda]        = useState('')
  const [filtroRol,       setFiltroRol]       = useState('todos')

  // Panel de edición
  const [empleadoEditar,  setEmpleadoEditar]  = useState(null)
  const [editCargando,    setEditCargando]    = useState(false)
  const [editError,       setEditError]       = useState(null)

  // Modal de confirmación desactivar/activar
  const [empleadoToggle,  setEmpleadoToggle]  = useState(null)
  const [toggleCargando,  setToggleCargando]  = useState(false)

  // Mensaje de éxito
  const [successMsg,      setSuccessMsg]      = useState(null)
  const successTimer = useRef(null)

  const mostrarExito = (msg) => {
    setSuccessMsg(msg)
    clearTimeout(successTimer.current)
    successTimer.current = setTimeout(() => setSuccessMsg(null), 3500)
  }

  useEffect(() => {
    return () => clearTimeout(successTimer.current)
  }, [])

  /* Carga inicial de empleados */
  useEffect(() => {
    const fetchEmpleados = async () => {
      setLoading(true)
      setError(null)
      try {
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 500))
          setEmpleados(MOCK_EMPLEADOS)
        } else {
          const { getEmpleados } = await import('../api/empleadoService')
          const data = await getEmpleados()
          setEmpleados(data)
        }
      } catch (err) {
        setError(err?.response?.data?.detail || 'No se pudieron cargar los empleados.')
      } finally {
        setLoading(false)
      }
    }
    fetchEmpleados()
  }, [])

  /* Guardar edición */
  const handleGuardarEdicion = async (id, cambios) => {
    setEditCargando(true)
    setEditError(null)
    try {
      if (!USE_MOCK) {
        const { actualizarEmpleado } = await import('../api/empleadoService')
        const actualizado = await actualizarEmpleado(id, cambios)
        setEmpleados((prev) =>
          prev.map((e) => (e.id_empleado === id ? { ...e, ...actualizado } : e))
        )
      } else {
        await new Promise((r) => setTimeout(r, 700))
        setEmpleados((prev) =>
          prev.map((e) => (e.id_empleado === id ? { ...e, ...cambios } : e))
        )
      }
      setEmpleadoEditar(null)
      mostrarExito('Empleado actualizado correctamente.')
    } catch (err) {
      const detail = err?.response?.data?.detail
      setEditError(
        Array.isArray(detail)
          ? detail.map((d) => d.message || d.msg).join(', ')
          : detail || 'Error al guardar los cambios.'
      )
    } finally {
      setEditCargando(false)
    }
  }

  /* Desactivar / Activar */
  const handleToggleEstado = async (id, nuevoEstado) => {
    setToggleCargando(true)
    try {
      if (!USE_MOCK) {
        const { cambiarEstadoEmpleado } = await import('../api/empleadoService')
        const actualizado = await cambiarEstadoEmpleado(id, nuevoEstado)
        setEmpleados((prev) =>
          prev.map((e) => (e.id_empleado === id ? { ...e, estado: actualizado.estado } : e))
        )
      } else {
        await new Promise((r) => setTimeout(r, 600))
        setEmpleados((prev) =>
          prev.map((e) => (e.id_empleado === id ? { ...e, estado: nuevoEstado } : e))
        )
      }
      const accion = nuevoEstado === 'activo' ? 'activado' : 'desactivado'
      mostrarExito(`Empleado ${accion} correctamente.`)
      setEmpleadoToggle(null)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al cambiar el estado del empleado.')
      setEmpleadoToggle(null)
    } finally {
      setToggleCargando(false)
    }
  }

  /* Empleados filtrados */
  const empleadosFiltrados = empleados.filter((e) => {
    const texto = busqueda.toLowerCase()
    const coincideBusqueda =
      !texto ||
      e.nombre.toLowerCase().includes(texto) ||
      e.apellido.toLowerCase().includes(texto) ||
      e.correo.toLowerCase().includes(texto)
    const coincideRol = filtroRol === 'todos' || e.rol === filtroRol
    return coincideBusqueda && coincideRol
  })

  const totalActivos   = empleados.filter((e) => e.estado === 'activo').length
  const totalInactivos = empleados.filter((e) => e.estado === 'inactivo').length

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
        <p className={styles.loadingText}>Cargando empleados...</p>
      </div>
    )
  }

  if (error && empleados.length === 0) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>{error}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* ── Cabecera ─────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.title}>Gestión de Empleados</h1>
          <p className={styles.subtitle}>
            {empleados.length} empleados en total ·{' '}
            <span className={styles.countActivos}>{totalActivos} activos</span>
            {totalInactivos > 0 && (
              <> · <span className={styles.countInactivos}>{totalInactivos} inactivos</span></>
            )}
          </p>
        </div>
      </div>

      {/* ── Mensaje de éxito ─────────────────────────── */}
      {successMsg && (
        <div className={styles.successBanner}>
          <IconCheck />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Error no crítico ─────────────────────────── */}
      {error && empleados.length > 0 && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      {/* ── Barra de búsqueda y filtros ──────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><IconSearch /></span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por nombre, apellido o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className={styles.searchClear} onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
              <IconX />
            </button>
          )}
        </div>

        <div className={styles.filters}>
          <label className={styles.filterLabel}>Filtrar por rol:</label>
          <select
            className={styles.filterSelect}
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROL_LABEL[r]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabla de empleados ───────────────────────── */}
      {empleadosFiltrados.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><IconUser /></div>
          <p className={styles.emptyMsg}>
            {busqueda || filtroRol !== 'todos'
              ? 'No se encontraron empleados con esos criterios.'
              : 'No hay empleados registrados.'}
          </p>
          {(busqueda || filtroRol !== 'todos') && (
            <button
              className={styles.emptyResetBtn}
              onClick={() => { setBusqueda(''); setFiltroRol('todos') }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Empleado</th>
                <th className={styles.th}>Rol</th>
                <th className={styles.th}>Contacto</th>
                <th className={styles.th}>Contratación</th>
                <th className={styles.th}>Estado</th>
                <th className={`${styles.th} ${styles.thAcciones}`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map((emp) => {
                const esActivo = emp.estado === 'activo'
                return (
                  <tr
                    key={emp.id_empleado}
                    className={`${styles.tr} ${!esActivo ? styles.trInactivo : ''}`}
                  >
                    {/* Nombre + correo */}
                    <td className={styles.td}>
                      <div className={styles.empleadoCell}>
                        <div className={`${styles.avatar} ${!esActivo ? styles.avatarInactivo : ''}`}>
                          {emp.nombre[0]?.toUpperCase()}
                          {emp.apellido[0]?.toUpperCase()}
                        </div>
                        <div className={styles.empleadoInfo}>
                          <span className={styles.empleadoNombre}>
                            {emp.nombre} {emp.apellido}
                          </span>
                          <span className={styles.empleadoCorreo}>{emp.correo}</span>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className={styles.td}>
                      <Badge
                        label={ROL_LABEL[emp.rol] ?? emp.rol}
                        variant={ROL_VARIANT[emp.rol] ?? 'muted'}
                      />
                    </td>

                    {/* Contacto */}
                    <td className={styles.td}>
                      <span className={styles.telefonoText}>
                        {emp.telefono || <span className={styles.sinDato}>—</span>}
                      </span>
                    </td>

                    {/* Fecha contratación */}
                    <td className={styles.td}>
                      <span className={styles.fechaText}>
                        {emp.fecha_contratacion
                          ? new Date(emp.fecha_contratacion + 'T12:00:00').toLocaleDateString('es-GT', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : <span className={styles.sinDato}>—</span>}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className={styles.td}>
                      <span className={`${styles.estadoBadge} ${esActivo ? styles.estadoActivo : styles.estadoInactivo}`}>
                        <span className={styles.estadoDot} />
                        {esActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className={`${styles.td} ${styles.tdAcciones}`}>
                      {/* Botón Editar */}
                      <button
                        className={styles.btnEditar}
                        onClick={() => {
                          setEditError(null)
                          setEmpleadoEditar(emp)
                        }}
                        title={`Editar a ${emp.nombre} ${emp.apellido}`}
                      >
                        <IconEdit />
                        <span>Editar</span>
                      </button>

                      {/* Botón Desactivar / Activar */}
                      <button
                        className={`${styles.btnToggle} ${esActivo ? styles.btnDesactivar : styles.btnActivar}`}
                        onClick={() => setEmpleadoToggle(emp)}
                        title={esActivo
                          ? `Desactivar a ${emp.nombre} ${emp.apellido}`
                          : `Activar a ${emp.nombre} ${emp.apellido}`}
                      >
                        {esActivo ? <IconToggleOff /> : <IconToggleOn />}
                        <span>{esActivo ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Contador de resultados */}
          <p className={styles.resultCount}>
            Mostrando {empleadosFiltrados.length} de {empleados.length} empleados
          </p>
        </div>
      )}

      {/* ── Panel de edición ─────────────────────────── */}
      {empleadoEditar && (
        <PanelEditar
          empleado={empleadoEditar}
          onGuardar={handleGuardarEdicion}
          onCerrar={() => { setEmpleadoEditar(null); setEditError(null) }}
          cargando={editCargando}
          errorMsg={editError}
        />
      )}

      {/* ── Modal de confirmación ────────────────────── */}
      {empleadoToggle && (
        <ModalConfirmacion
          empleado={empleadoToggle}
          onConfirmar={handleToggleEstado}
          onCancelar={() => setEmpleadoToggle(null)}
          cargando={toggleCargando}
        />
      )}
    </div>
  )
}