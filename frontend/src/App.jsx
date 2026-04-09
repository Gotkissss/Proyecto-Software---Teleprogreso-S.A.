/**
 * App.jsx
 * ---------------------------------------------------------------------------
 * Router principal de la aplicación Teleprogreso.
 * 
 * Rutas Técnico:
 *   /login          → LoginPage (pública)
 *   /               → redirige a /ruta
 *   /ruta           → RutaDiariaPage (protegida)
 *   /mapa           → MapaPage (protegida)
 *   /pausas         → PausasPage (protegida)
 *   /equipo         → EquipoPage (protegida)
 * 
 * Rutas Supervisor:
 *   /supervisor              → redirige a /supervisor/dashboard
 *   /supervisor/dashboard    → DashboardPage
 *   /supervisor/alertas      → AlertasPage
 *   /supervisor/reasignacion → ReasignacionPage
 * ---------------------------------------------------------------------------
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext'
import ProtectedRoute      from './components/layout/ProtectedRoute'
import AppLayout           from './components/layout/AppLayout'
import SupervisorLayout    from './components/layout/SupervisorLayout'

/* Páginas Técnico */
import LoginPage      from './pages/LoginPage'
import RutaDiariaPage from './pages/RutaDiariaPage'
import MapaPage       from './pages/MapaPage'
import PausasPage     from './pages/PausasPage'
import EquipoPage     from './pages/EquipoPage'

/* Páginas Supervisor */
import DashboardPage    from './pages/DashboardPage'
import AlertasPage      from './pages/AlertasPage'
import ReasignacionPage from './pages/ReasignacionPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Pública ────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Rutas Técnico (con AppLayout) ────────────── */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/ruta" replace />} />
            <Route path="/ruta"   element={<RutaDiariaPage />} />
            <Route path="/mapa"   element={<MapaPage />} />
            <Route path="/pausas" element={<PausasPage />} />
            <Route path="/equipo" element={<EquipoPage />} />
          </Route>

          {/* ── Rutas Supervisor (con SupervisorLayout) ──── */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute>
                <SupervisorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"    element={<DashboardPage />} />
            <Route path="alertas"      element={<AlertasPage />} />
            <Route path="reasignacion" element={<ReasignacionPage />} />
          </Route>

          {/* ── 404 → redirige a inicio ─────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}