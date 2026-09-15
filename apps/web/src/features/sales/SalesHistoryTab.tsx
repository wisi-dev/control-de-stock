import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { usePermission } from '../../hooks/usePermission.js';
import { cancelSale, fetchSales, type Sale } from '../../services/sales.service.js';
import { toast } from '../../store/toastStore.js';
import { SaleDetailModal } from './SaleDetailModal.js';

export function SalesHistoryTab() {
  const canManage = usePermission('sales:*');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Sale | null>(null);

  const salesQuery = useQuery({ queryKey: ['sales', page], queryFn: () => fetchSales({ page, pageSize: 20 }) });

  const cancelMutation = useMutation({
    mutationFn: cancelSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Venta anulada — stock restituido');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (salesQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando ventas...</p>;
  if (salesQuery.isError) {
    return <EmptyState title="No pudimos cargar las ventas" description="Intentá nuevamente en unos segundos." />;
  }

  const sales = salesQuery.data?.items ?? [];
  const totalPages = salesQuery.data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {sales.length === 0 ? (
        <EmptyState title="Todavía no hay ventas" description="Las ventas confirmadas van a aparecer acá." />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Vendedor</th>
                  <th className="px-5 py-3 font-medium">Pago</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-5 py-3 text-ink-muted">{new Date(sale.createdAt).toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3 font-medium text-ink">
                      {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{sale.user?.name}</td>
                    <td className="px-5 py-3 text-ink-muted">{sale.paymentMethod}</td>
                    <td className="px-5 py-3 text-ink-muted">${sale.total.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={sale.status === 'COMPLETADA' ? 'success' : 'danger'}>{sale.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(sale)}
                          aria-label="Ver detalle"
                          className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canManage && sale.status === 'COMPLETADA' && (
                          <Button size="sm" variant="ghost" onClick={() => cancelMutation.mutate(sale.id)}>
                            Anular
                          </Button>
                        )}
                      </div>
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
        </>
      )}

      <SaleDetailModal sale={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
