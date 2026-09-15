import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission.js';
import { CustomersTab } from '../features/customers/CustomersTab.js';

export function CustomersPage() {
  const canView = usePermission('customers:read');
  if (!canView) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Clientes</h1>
        <p className="text-sm text-ink-muted">Datos de contacto e historial de compras.</p>
      </div>
      <CustomersTab />
    </div>
  );
}
