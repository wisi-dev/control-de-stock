import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission.js';
import { SuppliersTab } from '../features/suppliers/SuppliersTab.js';

export function SuppliersPage() {
  const canView = usePermission('suppliers:read');
  if (!canView) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Proveedores</h1>
        <p className="text-sm text-ink-muted">Datos de contacto y estado de cada proveedor.</p>
      </div>
      <SuppliersTab />
    </div>
  );
}
