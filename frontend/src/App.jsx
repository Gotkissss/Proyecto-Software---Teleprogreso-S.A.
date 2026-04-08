/**
 * App.jsx
 * ---------------------------------------------------------------------------
 * Router principal de la aplicación Teleprogreso.
 * 
 * Rutas:
 *   /login          → LoginPage (pública)
 *   /               → redirige a /ruta
 *   /ruta           → RutaDiariaPage (protegida)
 *   /mapa           → MapaPage (protegida)
 *   /pausas         → PausasPage (protegida)
 *   /equipo         → EquipoPage (protegida)
 * 
 * Todas las rutas protegidas viven dentro de <AppLayout> (top bar + bottom nav).
 * <AuthProvider> envuelve todo para tener acceso a useNavigate dentro del contexto.
 * ---------------------------------------------------------------------------
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext'
import ProtectedRoute      from './components/layout/ProtectedRoute'
import AppLayout           from './components/layout/AppLayout'

/* Páginas */
import LoginPage      from './pages/LoginPage'
import RutaDiariaPage from './pages/RutaDiariaPage'
import MapaPage       from './pages/MapaPage'
import PausasPage     from './pages/PausasPage'
import EquipoPage     from './pages/EquipoPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Pública ────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Protegidas (con layout) ─────────────────── */}
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

          {/* ── 404 → redirige a inicio ─────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
