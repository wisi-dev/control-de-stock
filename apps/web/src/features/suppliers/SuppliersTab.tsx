import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import type { Supplier } from '@control-stock/shared';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { fetchSuppliers, updateSupplier } from '../../services/suppliers.service.js';
import { toast } from '../../store/toastStore.js';
import { usePermission } from '../../hooks/usePermission.js';
import { SupplierFormModal } from './SupplierFormModal.js';

export function SuppliersTab() {
  const canManage = usePermission('suppliers:*');
  const queryClient = useQueryClient();
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });

  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined);

  const toggleActiveMutation = useMutation({
    mutationFn: (supplier: Supplier) => updateSupplier(supplier.id, { active: !supplier.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (suppliersQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando proveedores...</p>;
  if (suppliersQuery.isError) {
    return <EmptyState title="No pudimos cargar los proveedores" description="Intentá nuevamente en unos segundos." />;
  }

  const suppliers = suppliersQuery.data ?? [];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </Button>
        </div>
      )}

      {suppliers.length === 0 ? (
        <EmptyState
          title="Todavía no hay proveedores"
          description="Creá el primero para poder asociarlo a tus productos y compras."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-3 font-medium">Razón social</th>
                <th className="px-5 py-3 font-medium">Contacto</th>
                <th className="px-5 py-3 font-medium">Teléfono</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-5 py-3 font-medium text-ink">{supplier.businessName}</td>
                  <td className="px-5 py-3 text-ink-muted">{supplier.contactName || '—'}</td>
                  <td className="px-5 py-3 text-ink-muted">{supplier.phone || '—'}</td>
                  <td className="px-5 py-3 text-ink-muted">{supplier.email || '—'}</td>
                  <td className="px-5 py-3">
                    <Badge tone={supplier.active ? 'success' : 'default'}>
                      {supplier.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(supplier)}
                          aria-label="Editar proveedor"
                          className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActiveMutation.mutate(supplier)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100"
                        >
                          {supplier.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SupplierFormModal open={editing !== undefined} supplier={editing ?? null} onClose={() => setEditing(undefined)} />
    </div>
  );
}
