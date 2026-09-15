import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { POSITIVE_MOVEMENTS } from '@control-stock/shared';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { usePermission } from '../../hooks/usePermission.js';
import { fetchMovements } from '../../services/inventory.service.js';
import { MovementFormModal } from './MovementFormModal.js';

export function MovementsTab() {
  const canManage = usePermission('inventory:*');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const movementsQuery = useQuery({
    queryKey: ['inventory', 'movements', page],
    queryFn: () => fetchMovements({ page, pageSize: 20 }),
  });

  if (movementsQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando movimientos...</p>;
  if (movementsQuery.isError) {
    return <EmptyState title="No pudimos cargar los movimientos" description="Intentá nuevamente en unos segundos." />;
  }

  const movements = movementsQuery.data?.items ?? [];
  const totalPages = movementsQuery.data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo movimiento
          </Button>
        </div>
      )}

      {movements.length === 0 ? (
        <EmptyState
          title="Todavía no hay movimientos de stock"
          description="Se registran automáticamente al comprar, vender o ajustar stock."
        />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Producto</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Cantidad</th>
                  <th className="px-5 py-3 font-medium">Stock ant. → final</th>
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const isPositive = (POSITIVE_MOVEMENTS as string[]).includes(m.type);
                  return (
                    <tr key={m.id}>
                      <td className="px-5 py-3 text-ink-muted">{new Date(m.createdAt).toLocaleString('es-AR')}</td>
                      <td className="px-5 py-3 font-medium text-ink">
                        {m.product?.name} <span className="text-ink-subtle">({m.product?.sku})</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={isPositive ? 'success' : 'danger'}>{m.type}</Badge>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {isPositive ? '+' : '-'}
                        {m.quantity}
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {m.previousStock} → {m.resultingStock}
                      </td>
                      <td className="px-5 py-3 text-ink-muted">{m.user?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-ink-muted">{m.reason || '—'}</td>
                    </tr>
                  );
                })}
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

      <MovementFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
