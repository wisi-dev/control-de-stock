import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { createCategorySchema, type Category, type CreateCategoryInput } from '@control-stock/shared';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { createCategory, fetchCategories, updateCategory } from '../../services/categories.service.js';
import { toast } from '../../store/toastStore.js';
import { usePermission } from '../../hooks/usePermission.js';

export function CategoriesTab() {
  const canManage = usePermission('categories:*');
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const [editing, setEditing] = useState<Category | null | undefined>(undefined);

  const toggleActiveMutation = useMutation({
    mutationFn: (category: Category) => updateCategory(category.id, { active: !category.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría actualizada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (categoriesQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando categorías...</p>;
  if (categoriesQuery.isError) {
    return <EmptyState title="No pudimos cargar las categorías" description="Intentá nuevamente en unos segundos." />;
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Nueva categoría
          </Button>
        </div>
      )}

      {categories.length === 0 ? (
        <EmptyState title="Todavía no hay categorías" description="Creá la primera para poder clasificar productos." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Descripción</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-3 font-medium text-ink">{category.name}</td>
                  <td className="px-5 py-3 text-ink-muted">{category.description || '—'}</td>
                  <td className="px-5 py-3">
                    <Badge tone={category.active ? 'success' : 'default'}>
                      {category.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(category)}
                          aria-label="Editar categoría"
                          className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActiveMutation.mutate(category)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100"
                        >
                          {category.active ? 'Desactivar' : 'Activar'}
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

      <CategoryFormModal open={editing !== undefined} category={editing ?? null} onClose={() => setEditing(undefined)} />
    </div>
  );
}

interface CategoryFormModalProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
}

function CategoryFormModal({ open, category, onClose }: CategoryFormModalProps) {
  const isEdit = category !== null;
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
  });

  useEffect(() => {
    if (open) reset({ name: category?.name ?? '', description: category?.description ?? '' });
  }, [open, category, reset]);

  const mutation = useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      isEdit ? updateCategory(category.id, input) : createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar categoría' : 'Nueva categoría'}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input label="Nombre" error={formState.errors.name?.message} {...register('name')} />
        <Input label="Descripción" error={formState.errors.description?.message} {...register('description')} />
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
