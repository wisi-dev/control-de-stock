import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils.js';
import { usePermission } from '../hooks/usePermission.js';
import { MovementsTab } from '../features/inventory/MovementsTab.js';
import { AlertsTab } from '../features/inventory/AlertsTab.js';

const tabs = [
  { key: 'movimientos', label: 'Movimientos' },
  { key: 'alertas', label: 'Alertas' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export function InventoryPage() {
  const [tab, setTab] = useState<TabKey>('movimientos');
  const canView = usePermission('inventory:read');

  if (!canView) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Inventario</h1>
        <p className="text-sm text-ink-muted">Movimientos de stock y alertas de reposición.</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'movimientos' && <MovementsTab />}
      {tab === 'alertas' && <AlertsTab />}
    </div>
  );
}
