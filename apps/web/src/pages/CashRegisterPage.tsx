import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils.js';
import { usePermission } from '../hooks/usePermission.js';
import { CurrentRegisterView } from '../features/cashregister/CurrentRegisterView.js';
import { CashHistoryTab } from '../features/cashregister/CashHistoryTab.js';

const tabs = [
  { key: 'actual', label: 'Caja actual' },
  { key: 'historial', label: 'Historial' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export function CashRegisterPage() {
  const [tab, setTab] = useState<TabKey>('actual');
  const canView = usePermission('cashregister:read');

  if (!canView) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Caja</h1>
        <p className="text-sm text-ink-muted">Apertura, cierre y movimientos de efectivo.</p>
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

      {tab === 'actual' && <CurrentRegisterView />}
      {tab === 'historial' && <CashHistoryTab />}
    </div>
  );
}
