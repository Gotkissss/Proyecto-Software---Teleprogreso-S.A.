/**
 * SupervisorRoutes.jsx
 * ---------------------------------------------------------------------------
 * Define las rutas del supervisor para integrar en el App.jsx principal.
 * Wilson debe agregar esto al router de React en App.jsx o main.jsx.
 *
 * INSTRUCCIONES:
 * En tu App.jsx importa SupervisorRoutes y agrégalo al BrowserRouter
 * junto a las rutas de Diego.
 * ---------------------------------------------------------------------------
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import SupervisorLayout from './components/layout/SupervisorLayout'
import DashboardPage from './pages/DashboardPage'
import AlertasPage from './pages/AlertasPage'
import ReasignacionPage from './pages/ReasignacionPage'

export default function SupervisorRoutes() {
  return (
    <Route
      path="/supervisor"
      element={
        <ProtectedRoute>
          <SupervisorLayout />
        </ProtectedRoute>
      }
    >
      {/* Redirige /supervisor → /supervisor/dashboard */}
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard"    element={<DashboardPage />} />
      <Route path="alertas"      element={<AlertasPage />} />
      <Route path="reasignacion" element={<ReasignacionPage />} />
    </Route>
  )
}

