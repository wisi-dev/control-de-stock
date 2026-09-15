import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { usePermission } from '../../hooks/usePermission.js';
import {
  cancelPurchase,
  fetchPurchases,
  receivePurchase,
  type Purchase,
} from '../../services/purchases.service.js';
import { toast } from '../../store/toastStore.js';
import { PurchaseFormModal } from './PurchaseFormModal.js';
import { PurchaseDetailModal } from './PurchaseDetailModal.js';

const statusTone: Record<Purchase['status'], 'default' | 'success' | 'danger'> = {
  PENDIENTE: 'default',
  RECIBIDA: 'success',
  CANCELADA: 'danger',
};

export function PurchasesTab() {
  const canManage = usePermission('purchases:*');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Purchase | null>(null);

  const purchasesQuery = useQuery({
    queryKey: ['purchases', page],
    queryFn: () => fetchPurchases({ page, pageSize: 20 }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }

  const receiveMutation = useMutation({
    mutationFn: receivePurchase,
    onSuccess: () => {
      invalidate();
      toast.success('Compra recibida — stock actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelPurchase,
    onSuccess: () => {
      invalidate();
      toast.success('Compra cancelada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (purchasesQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando compras...</p>;
  if (purchasesQuery.isError) {
    return <EmptyState title="No pudimos cargar las compras" description="Intentá nuevamente en unos segundos." />;
  }

  const purchases = purchasesQuery.data?.items ?? [];
  const totalPages = purchasesQuery.data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva compra
          </Button>
        </div>
      )}

      {purchases.length === 0 ? (
        <EmptyState title="Todavía no hay compras" description="Registrá la primera compra a un proveedor." />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Proveedor</th>
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-5 py-3 text-ink-muted">
                      {new Date(purchase.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-5 py-3 font-medium text-ink">{purchase.supplier?.businessName}</td>
                    <td className="px-5 py-3 text-ink-muted">{purchase.user?.name}</td>
                    <td className="px-5 py-3 text-ink-muted">${purchase.total.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[purchase.status]}>{purchase.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(purchase)}
                          aria-label="Ver detalle"
                          className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canManage && purchase.status === 'PENDIENTE' && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => receiveMutation.mutate(purchase.id)}>
                              Recibir
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => cancelMutation.mutate(purchase.id)}>
                              Cancelar
                            </Button>
                          </>
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

      <PurchaseFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <PurchaseDetailModal purchase={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
