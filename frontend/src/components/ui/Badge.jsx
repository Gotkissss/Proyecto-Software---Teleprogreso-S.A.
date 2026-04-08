/**
 * components/ui/Badge.jsx
 * Etiqueta de estado/prioridad colorida.
 */

import styles from './Badge.module.css'

const variantMap = {
  completado:  'success',
  en_progreso: 'info',
  pendiente:   'warning',
  cancelado:   'danger',
  urgente:     'danger',
  alta:        'warning',
  media:       'info',
  baja:        'muted',
}

export default function Badge({ label, variant }) {
  const v = variant || variantMap[label?.toLowerCase()] || 'muted'
  return <span className={`${styles.badge} ${styles[v]}`}>{label}</span>
}
