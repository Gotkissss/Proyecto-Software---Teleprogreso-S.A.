/**
 * components/layout/SupervisorLayout.jsx
 * ---------------------------------------------------------------------------
 * Layout para las rutas del supervisor — diseño desktop a ancho completo.
 * ---------------------------------------------------------------------------
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './SupervisorLayout.module.css'

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const IconAlertas = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const IconReasignar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)
const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)
const IconLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const NAV_ITEMS = [
  { to: '/supervisor/dashboard',    label: 'Panel',     Icon: IconDashboard },
  { to: '/supervisor/alertas',      label: 'Alertas',   Icon: IconAlertas },
  { to: '/supervisor/reasignacion', label: 'Reasignar', Icon: IconReasignar },
]

export default function SupervisorLayout() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.nombre || 'Supervisor'

  return (
    <div className={styles.wrapper}>
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.logo}><IconLogo /></span>
          <span className={styles.appName}>Teleprogreso — Supervisor</span>
        </div>
        <div className={styles.topBarRight}>
          {user && (
            <button className={styles.avatarBtn} title={displayName}>
              <span className={styles.avatarInitial}>
                {displayName[0]?.toUpperCase() ?? 'S'}
              </span>
            </button>
          )}
          <button className={styles.menuBtn} onClick={logoutUser} title="Cerrar sesión">
            <IconMenu />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icon /></span>
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}