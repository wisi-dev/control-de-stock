import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import type { Customer } from '@control-stock/shared';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { fetchCustomers, updateCustomer } from '../../services/customers.service.js';
import { toast } from '../../store/toastStore.js';
import { usePermission } from '../../hooks/usePermission.js';
import { CustomerFormModal } from './CustomerFormModal.js';

export function CustomersTab() {
  const canManage = usePermission('customers:*');
  const queryClient = useQueryClient();
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });

  const [editing, setEditing] = useState<Customer | null | undefined>(undefined);

  const toggleActiveMutation = useMutation({
    mutationFn: (customer: Customer) => updateCustomer(customer.id, { active: !customer.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (customersQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando clientes...</p>;
  if (customersQuery.isError) {
    return <EmptyState title="No pudimos cargar los clientes" description="Intentá nuevamente en unos segundos." />;
  }

  const customers = customersQuery.data ?? [];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Nuevo cliente
          </Button>
        </div>
      )}

      {customers.length === 0 ? (
        <EmptyState title="Todavía no hay clientes" description="Se crean acá o directamente al hacer una venta." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">DNI/CUIT</th>
                <th className="px-5 py-3 font-medium">Teléfono</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-5 py-3 font-medium text-ink">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{customer.docNumber || '—'}</td>
                  <td className="px-5 py-3 text-ink-muted">{customer.phone || '—'}</td>
                  <td className="px-5 py-3 text-ink-muted">{customer.email || '—'}</td>
                  <td className="px-5 py-3">
                    <Badge tone={customer.active ? 'success' : 'default'}>
                      {customer.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(customer)}
                          aria-label="Editar cliente"
                          className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActiveMutation.mutate(customer)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100"
                        >
                          {customer.active ? 'Desactivar' : 'Activar'}
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

      <CustomerFormModal open={editing !== undefined} customer={editing ?? null} onClose={() => setEditing(undefined)} />
    </div>
  );
}
