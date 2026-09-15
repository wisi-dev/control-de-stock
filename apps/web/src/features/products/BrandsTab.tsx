import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { createBrandSchema, type Brand, type CreateBrandInput } from '@control-stock/shared';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { createBrand, fetchBrands, updateBrand } from '../../services/brands.service.js';
import { toast } from '../../store/toastStore.js';
import { usePermission } from '../../hooks/usePermission.js';

export function BrandsTab() {
  const canManage = usePermission('brands:*');
  const queryClient = useQueryClient();
  const brandsQuery = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });

  const [editing, setEditing] = useState<Brand | null | undefined>(undefined);

  const toggleActiveMutation = useMutation({
    mutationFn: (brand: Brand) => updateBrand(brand.id, { active: !brand.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Marca actualizada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (brandsQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando marcas...</p>;
  if (brandsQuery.isError) {
    return <EmptyState title="No pudimos cargar las marcas" description="Intentá nuevamente en unos segundos." />;
  }

  const brands = brandsQuery.data ?? [];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Nueva marca
          </Button>
        </div>
      )}

      {brands.length === 0 ? (
        <EmptyState title="Todavía no hay marcas" description="Creá la primera para poder clasificar productos." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-5 py-3 font-medium text-ink">{brand.name}</td>
                  <td className="px-5 py-3">
                    <Badge tone={brand.active ? 'success' : 'default'}>{brand.active ? 'Activa' : 'Inactiva'}</Badge>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(brand)}
                          aria-label="Editar marca"
                          className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActiveMutation.mutate(brand)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100"
                        >
                          {brand.active ? 'Desactivar' : 'Activar'}
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

      <BrandFormModal open={editing !== undefined} brand={editing ?? null} onClose={() => setEditing(undefined)} />
    </div>
  );
}

interface BrandFormModalProps {
  open: boolean;
  brand: Brand | null;
  onClose: () => void;
}

function BrandFormModal({ open, brand, onClose }: BrandFormModalProps) {
  const isEdit = brand !== null;
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<CreateBrandInput>({
    resolver: zodResolver(createBrandSchema),
  });

  useEffect(() => {
    if (open) reset({ name: brand?.name ?? '' });
  }, [open, brand, reset]);

  const mutation = useMutation({
    mutationFn: (input: CreateBrandInput) => (isEdit ? updateBrand(brand.id, input) : createBrand(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success(isEdit ? 'Marca actualizada' : 'Marca creada');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar marca' : 'Nueva marca'}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input label="Nombre" error={formState.errors.name?.message} {...register('name')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
