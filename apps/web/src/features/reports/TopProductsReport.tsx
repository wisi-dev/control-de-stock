import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Card } from '../../components/ui/Card.js';
import { Select } from '../../components/ui/Select.js';
import { Button } from '../../components/ui/Button.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { downloadTopProductsCsv, fetchTopProducts } from '../../services/reports.service.js';
import { toast } from '../../store/toastStore.js';
import { DateRangeFilter, defaultDateRange } from './DateRangeFilter.js';

const orderOptions = [
  { value: 'desc', label: 'Más vendidos' },
  { value: 'asc', label: 'Menos vendidos' },
];

export function TopProductsReport() {
  const [range, setRange] = useState(defaultDateRange());
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const query = useQuery({
    queryKey: ['reports', 'top-products', range, order],
    queryFn: () => fetchTopProducts({ ...range, order, limit: 15 }),
  });

  async function handleExport() {
    try {
      await downloadTopProductsCsv({ ...range, order, limit: 15 });
    } catch {
      toast.error('No pudimos exportar el reporte');
    }
  }

  const products = query.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <DateRangeFilter {...range} onChange={setRange} />
          <Select label="Orden" options={orderOptions} value={order} onChange={(e) => setOrder(e.target.value as typeof order)} />
        </div>
        <Button size="sm" variant="secondary" onClick={handleExport}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-ink-muted">Cargando...</p>
      ) : products.length === 0 ? (
        <EmptyState title="Sin ventas en este período" description="Probá ampliar el rango de fechas." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="px-5 py-3 font-medium">Cantidad vendida</th>
                <th className="px-5 py-3 font-medium text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.productId}>
                  <td className="px-5 py-3 font-mono text-xs text-ink-muted">{p.sku}</td>
                  <td className="px-5 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-5 py-3 text-ink-muted">{p.quantitySold}</td>
                  <td className="px-5 py-3 text-right text-ink-muted">${p.totalRevenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
