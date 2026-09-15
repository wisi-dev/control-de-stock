import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.js';
import { PlaceholderPage } from '../pages/PlaceholderPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { UsersPage } from '../pages/UsersPage.js';
import { ConfiguracionPage } from '../pages/ConfiguracionPage.js';
import { ProductsPage } from '../pages/ProductsPage.js';
import { SuppliersPage } from '../pages/SuppliersPage.js';
import { InventoryPage } from '../pages/InventoryPage.js';
import { RequireAuth } from './RequireAuth.js';

/**
 * Mapa de rutas del sistema. Los módulos que todavía no se implementaron
 * (ver Fases 5 a 8) muestran un placeholder con su nombre y la fase en la
 * que se van a construir, para que la navegación completa sea visible desde
 * la Fase 1 sin fingir funcionalidad que todavía no existe. Todo lo que no
 * sea /login pasa por `RequireAuth`.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/inventario" element={<InventoryPage />} />
          <Route path="/compras" element={<PlaceholderPage title="Compras" phase="Fase 5" />} />
          <Route path="/ventas" element={<PlaceholderPage title="Ventas" phase="Fase 6" />} />
          <Route
            path="/clientes"
            element={<PlaceholderPage title="Clientes" phase="Fase 7" />}
          />
          <Route path="/proveedores" element={<SuppliersPage />} />
          <Route path="/caja" element={<PlaceholderPage title="Caja" phase="Fase 7" />} />
          <Route
            path="/reportes"
            element={<PlaceholderPage title="Reportes" phase="Fase 8" />}
          />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
