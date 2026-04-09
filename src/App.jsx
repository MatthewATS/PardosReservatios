/**
 * src/App.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente raíz de la aplicación Pardos Chicken — Sistema de Reservas.
 * Define la estructura de rutas con React Router v6 y envuelve
 * la app con los providers globales de estado.
 *
 * Estructura de rutas:
 *   /login          → Inicio de sesión (público)
 *   /dashboard      → Dashboard principal (admin, cajero, hostess)
 *   /analiticas     → Gráficos de ingresos y personas (solo admin)
 *   /reservas       → Gestión de reservas en tiempo real (todos los roles)
 *   /mesas          → Mapa de mesas (admin, hostess, mozo)
 *   /clientes       → Gestión de clientes (admin, cajero, hostess)
 *   /caja           → Módulo de cobros y turno (cajero, admin)
 *   /cocina         → Panel Kanban de pedidos (jefe_cocina, admin)
 *   /historial      → Historial de reservas (admin, cajero)
 *   /reportes       → Reportes y métricas (admin, cajero)
 *   /configuracion  → Configuración del sistema (solo admin)
 *   /no-autorizado  → Página de acceso denegado
 *   *               → Página 404
 *
 * Proveedores (de afuera hacia adentro):
 *   BrowserRouter → AuthProvider → ReservationProvider → ClientProvider
 *                → CashProvider → KitchenProvider → Routes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'

// Providers de estado global
import { AuthProvider }        from  '@/domain/context/AuthContext'
import { ReservationProvider } from  '@/domain/context/ReservationContext'
import { ClientProvider }      from  '@/domain/context/ClientContext'
import { CashProvider }        from  '@/domain/context/CashContext'
import { KitchenProvider }     from  '@/domain/context/KitchenContext'

// Route guards
import { ProtectedRoute, PublicOnlyRoute } from  '@/presentation/components/auth/ProtectedRoute'

// Layout principal
import AppLayout from  '@/presentation/components/layout/AppLayout'

// Páginas
import LoginPage    from  '@/presentation/features/auth/LoginPage'
import BookingPage  from  '@/presentation/features/booking/BookingPage'
import DashboardPage    from  '@/presentation/features/dashboard/DashboardPage'
import AnalyticsPage    from  '@/presentation/features/analytics/AnalyticsPage'
import ReservationsPage from  '@/presentation/features/reservations/ReservationsPage'
import TablesPage       from  '@/presentation/features/tables/TablesPage'
import ClientsPage      from  '@/presentation/features/clients/ClientsPage'
import CashPage         from  '@/presentation/features/cash/CashPage'
import KitchenPage      from  '@/presentation/features/kitchen/KitchenPage'
import HistoryPage      from  '@/presentation/features/history/HistoryPage'
import ReportsPage      from  '@/presentation/features/reports/ReportsPage'
import SettingsPage     from  '@/presentation/features/settings/SettingsPage'
import NotFoundPage     from  '@/presentation/pages/NotFoundPage'

// ── Página de acceso denegado ─────────────────────────────────────────────────
function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--color-cream)', padding: '24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px', boxShadow: '0 16px 48px rgba(59,26,26,0.2)',
        padding: '48px 40px', textAlign: 'center', maxWidth: '420px', width: '100%',
        animation: 'fadeIn 0.5s ease both',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b1a1a', marginBottom: '12px' }}>
          Acceso denegado
        </h1>
        <p style={{ fontSize: '14px', color: '#9b6b6b', marginBottom: '28px', lineHeight: 1.6 }}>
          No tienes permisos para acceder a esta sección.
          Contacta al administrador si crees que es un error.
        </p>
        <Link to="/dashboard" style={{
          display: 'inline-block', padding: '10px 24px', background: '#e8453c',
          color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
          textDecoration: 'none',
        }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReservationProvider>
          <ClientProvider>
            <CashProvider>
              <KitchenProvider>
                <Routes>
                  {/* ── Ruta raíz → login ── */}
                  <Route path="/" element={<Navigate to="/login" replace />} />

                  {/* ── Página pública de reservas (sin login) ── */}
                  <Route path="/reservar" element={<BookingPage />} />

                  {/* ── Rutas públicas (solo accesibles sin sesión) ── */}
                  <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                  </Route>

                  {/* ── Rutas protegidas (requieren autenticación) ── */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      {/* Redirigir raíz al login */}
                      <Route index element={<Navigate to="/login" replace />} />

                      {/* Dashboard (admin, cajero, hostess) */}
                      <Route path="/dashboard"  element={<DashboardPage />} />

                      {/* Analíticas — solo admin */}
                      <Route element={<ProtectedRoute requiredPermission="canViewIncomesChart" />}>
                        <Route path="/analiticas" element={<AnalyticsPage />} />
                      </Route>

                      {/* Reservas (todos los roles autenticados) */}
                      <Route path="/reservas"   element={<ReservationsPage />} />

                      {/* Mesas */}
                      <Route path="/mesas"      element={<TablesPage />} />

                      {/* Clientes */}
                      <Route path="/clientes"   element={<ClientsPage />} />

                      {/* Caja — cajero y admin */}
                      <Route element={<ProtectedRoute requiredPermission="canManageCash" />}>
                        <Route path="/caja"     element={<CashPage />} />
                      </Route>

                      {/* Cocina — jefe_cocina, admin y roles de servicio (solo lectura) */}
                      <Route element={<ProtectedRoute requiredPermission="canViewKitchen" />}>
                        <Route path="/cocina"   element={<KitchenPage />} />
                      </Route>

                      {/* Historial */}
                      <Route path="/historial"   element={<HistoryPage />} />

                      {/* Reportes */}
                      <Route path="/reportes"    element={<ReportsPage />} />

                      {/* Configuración — solo admin */}
                      <Route element={<ProtectedRoute requiredPermission="canConfigureSystem" />}>
                        <Route path="/configuracion" element={<SettingsPage />} />
                      </Route>
                    </Route>
                  </Route>

                  {/* ── Páginas de error ── */}
                  <Route path="/no-autorizado" element={<UnauthorizedPage />} />
                  <Route path="*"              element={<NotFoundPage />} />
                </Routes>
              </KitchenProvider>
            </CashProvider>
          </ClientProvider>
        </ReservationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
