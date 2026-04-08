/**
 * pages/MapaPage.jsx
 * Placeholder — se implementará en el próximo sprint.
 */
import styles from './PlaceholderPage.module.css'
const IconMapa = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
export default function MapaPage() {
  return (
    <div className={styles.page}>
      <div className={styles.icon}><IconMapa /></div>
      <h2 className={styles.title}>Mapa de Ruta</h2>
      <p className={styles.desc}>Próximamente podrás ver tu ruta diaria en el mapa con navegación en tiempo real.</p>
    </div>
  )
}
