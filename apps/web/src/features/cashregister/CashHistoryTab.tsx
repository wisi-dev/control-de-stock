import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { fetchCashRegisterHistory } from '../../services/cashregister.service.js';

export function CashHistoryTab() {
  const [page, setPage] = useState(1);
  const historyQuery = useQuery({
    queryKey: ['cashregister', 'history', page],
    queryFn: () => fetchCashRegisterHistory(page),
  });

  if (historyQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando historial...</p>;

  const registers = historyQuery.data?.items ?? [];
  const totalPages = historyQuery.data?.totalPages ?? 1;

  if (registers.length === 0) {
    return <EmptyState title="Todavía no hay cajas cerradas" description="Las cajas cerradas van a aparecer acá." />;
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
              <th className="px-5 py-3 font-medium">Apertura</th>
              <th className="px-5 py-3 font-medium">Cierre</th>
              <th className="px-5 py-3 font-medium">Usuario</th>
              <th className="px-5 py-3 font-medium">Inicial</th>
              <th className="px-5 py-3 font-medium">Esperado</th>
              <th className="px-5 py-3 font-medium">Contado</th>
              <th className="px-5 py-3 font-medium">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registers.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 text-ink-muted">{new Date(r.openedAt).toLocaleString('es-AR')}</td>
                <td className="px-5 py-3 text-ink-muted">{r.closedAt ? new Date(r.closedAt).toLocaleString('es-AR') : '—'}</td>
                <td className="px-5 py-3 text-ink-muted">{r.user?.name}</td>
                <td className="px-5 py-3 text-ink-muted">${r.openingAmount.toFixed(2)}</td>
                <td className="px-5 py-3 text-ink-muted">${(r.expectedAmount ?? 0).toFixed(2)}</td>
                <td className="px-5 py-3 text-ink-muted">${(r.closingAmount ?? 0).toFixed(2)}</td>
                <td className="px-5 py-3">
                  <Badge tone={r.difference === 0 ? 'success' : 'danger'}>${(r.difference ?? 0).toFixed(2)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
