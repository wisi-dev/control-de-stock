import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Select } from '../../components/ui/Select.js';
import { Button } from '../../components/ui/Button.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { downloadSalesByPeriodCsv, fetchSalesByPeriod } from '../../services/reports.service.js';
import { toast } from '../../store/toastStore.js';
import { DateRangeFilter, defaultDateRange } from './DateRangeFilter.js';

const groupByOptions = [
  { value: 'day', label: 'Por día' },
  { value: 'week', label: 'Por semana' },
  { value: 'month', label: 'Por mes' },
];

export function SalesByPeriodReport() {
  const [range, setRange] = useState(defaultDateRange());
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const query = useQuery({
    queryKey: ['reports', 'sales-by-period', range, groupBy],
    queryFn: () => fetchSalesByPeriod({ ...range, groupBy }),
  });

  const maxTotal = Math.max(1, ...(query.data?.periods.map((p) => p.total) ?? [0]));

  async function handleExport() {
    try {
      await downloadSalesByPeriodCsv({ ...range, groupBy });
    } catch {
      toast.error('No pudimos exportar el reporte');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <DateRangeFilter {...range} onChange={setRange} />
          <Select
            label="Agrupar"
            options={groupByOptions}
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
          />
        </div>
        <Button size="sm" variant="secondary" onClick={handleExport}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-ink-muted">Cargando...</p>
      ) : (query.data?.periods.length ?? 0) === 0 ? (
        <EmptyState title="Sin ventas en este período" description="Probá ampliar el rango de fechas." />
      ) : (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm text-ink-muted">
              <span>{query.data!.totalCount} ventas</span>
              <span className="font-semibold text-ink">Total: ${query.data!.totalSum.toFixed(2)}</span>
            </div>
            <div className="space-y-2">
              {query.data!.periods.map((p) => (
                <div key={p.period} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-ink-muted">{p.period}</span>
                  <div className="h-5 flex-1 rounded bg-slate-100">
                    <div
                      className="h-5 rounded bg-brand-500"
                      style={{ width: `${(p.total / maxTotal) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-ink-muted">${p.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
