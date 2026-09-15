import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils.js';
import { usePermission } from '../hooks/usePermission.js';
import { SalesByPeriodReport } from '../features/reports/SalesByPeriodReport.js';
import { TopProductsReport } from '../features/reports/TopProductsReport.js';
import { SummaryReports } from '../features/reports/SummaryReports.js';
import { InventoryReports } from '../features/reports/InventoryReports.js';

const tabs = [
  { key: 'ventas', label: 'Ventas' },
  { key: 'productos', label: 'Productos' },
  { key: 'resumen', label: 'Ganancias y métodos de pago' },
  { key: 'inventario', label: 'Inventario' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export function ReportsPage() {
  const [tab, setTab] = useState<TabKey>('ventas');
  const canView = usePermission('reports:read');

  if (!canView) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Reportes</h1>
        <p className="text-sm text-ink-muted">Ventas, productos, compras y stock con exportación a CSV.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
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

      {tab === 'ventas' && <SalesByPeriodReport />}
      {tab === 'productos' && <TopProductsReport />}
      {tab === 'resumen' && <SummaryReports />}
      {tab === 'inventario' && <InventoryReports />}
    </div>
  );
}
