import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { UsersPage } from '../pages/UsersPage.js';
import { ConfiguracionPage } from '../pages/ConfiguracionPage.js';
import { ProductsPage } from '../pages/ProductsPage.js';
import { SuppliersPage } from '../pages/SuppliersPage.js';
import { InventoryPage } from '../pages/InventoryPage.js';
import { PurchasesPage } from '../pages/PurchasesPage.js';
import { SalesPage } from '../pages/SalesPage.js';
import { CustomersPage } from '../pages/CustomersPage.js';
import { CashRegisterPage } from '../pages/CashRegisterPage.js';
import { ReportsPage } from '../pages/ReportsPage.js';
import { RequireAuth } from './RequireAuth.js';

/**
 * Mapa de rutas del sistema — todos los módulos de negocio (Fases 1 a 8)
 * están implementados. Lo que queda (Fase 9: testing/seguridad/optimización,
 * Fase 10: Docker de producción/deployment) no agrega rutas nuevas. Todo lo
 * que no sea /login pasa por `RequireAuth`.
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
          <Route path="/compras" element={<PurchasesPage />} />
          <Route path="/ventas" element={<SalesPage />} />
          <Route path="/clientes" element={<CustomersPage />} />
          <Route path="/proveedores" element={<SuppliersPage />} />
          <Route path="/caja" element={<CashRegisterPage />} />
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
