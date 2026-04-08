/**
 * pages/EquipoPage.jsx
 * Placeholder — se implementará en el próximo sprint.
 */
import styles from './PlaceholderPage.module.css'
const IconEquipo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
export default function EquipoPage() {
  return (
    <div className={styles.page}>
      <div className={styles.icon}><IconEquipo /></div>
      <h2 className={styles.title}>Mi Equipo</h2>
      <p className={styles.desc}>Aquí podrás ver el estado y la ubicación de tu equipo de trabajo en tiempo real.</p>
    </div>
  )
}
