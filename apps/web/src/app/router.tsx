import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.js';
import { PlaceholderPage } from '../pages/PlaceholderPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { LoginPage } from '../pages/LoginPage.js';

/**
 * Mapa de rutas del sistema. Los módulos que todavía no se implementaron
 * (ver Fases 2 a 8) muestran un placeholder con su nombre y la fase en la
 * que se van a construir, para que la navegación completa sea visible desde
 * la Fase 1 sin fingir funcionalidad que todavía no existe.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/productos"
          element={<PlaceholderPage title="Productos" phase="Fase 3" />}
        />
        <Route
          path="/inventario"
          element={<PlaceholderPage title="Inventario y movimientos" phase="Fase 4" />}
        />
        <Route path="/compras" element={<PlaceholderPage title="Compras" phase="Fase 5" />} />
        <Route path="/ventas" element={<PlaceholderPage title="Ventas" phase="Fase 6" />} />
        <Route
          path="/clientes"
          element={<PlaceholderPage title="Clientes" phase="Fase 7" />}
        />
        <Route
          path="/proveedores"
          element={<PlaceholderPage title="Proveedores" phase="Fase 3" />}
        />
        <Route path="/caja" element={<PlaceholderPage title="Caja" phase="Fase 7" />} />
        <Route
          path="/reportes"
          element={<PlaceholderPage title="Reportes" phase="Fase 8" />}
        />
        <Route
          path="/usuarios"
          element={<PlaceholderPage title="Usuarios y roles" phase="Fase 2" />}
        />
        <Route
          path="/configuracion"
          element={<PlaceholderPage title="Configuración del negocio" phase="Fase 2" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
