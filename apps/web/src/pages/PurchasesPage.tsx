import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission.js';
import { PurchasesTab } from '../features/purchases/PurchasesTab.js';

export function PurchasesPage() {
  const canView = usePermission('purchases:read');
  if (!canView) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Compras</h1>
        <p className="text-sm text-ink-muted">Órdenes a proveedores y su impacto en el stock.</p>
      </div>
      <PurchasesTab />
    </div>
  );
}
