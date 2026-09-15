import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { MovementType, type Product } from '@control-stock/shared';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Button } from '../../components/ui/Button.js';
import { fetchProducts } from '../../services/products.service.js';
import { createMovement } from '../../services/inventory.service.js';
import { toast } from '../../store/toastStore.js';

const manualTypeOptions = [
  { value: MovementType.ENTRADA, label: 'Entrada' },
  { value: MovementType.SALIDA, label: 'Salida' },
  { value: MovementType.AJUSTE_POSITIVO, label: 'Ajuste positivo' },
  { value: MovementType.AJUSTE_NEGATIVO, label: 'Ajuste negativo' },
  { value: MovementType.DEVOLUCION, label: 'Devolución' },
  { value: MovementType.CORRECCION, label: 'Corrección' },
];

const movementFormSchema = z.object({
  productId: z.string().min(1, 'Seleccioná un producto'),
  type: z.nativeEnum(MovementType),
  quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a cero'),
  reason: z.string().max(500).optional(),
});
type MovementFormValues = z.infer<typeof movementFormSchema>;

interface MovementFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Si se pasa, el producto queda fijo (ej: "Ajustar stock" desde la fila de un producto). */
  product?: Product;
}

export function MovementFormModal({ open, onClose, product }: MovementFormModalProps) {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ['products', 'all-for-movement'],
    queryFn: () => fetchProducts({ pageSize: 100, sortBy: 'name', sortDir: 'asc' }),
    enabled: open && !product,
  });

  const { register, handleSubmit, watch, reset, formState } = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
  });

  useEffect(() => {
    if (open) reset({ productId: product?.id ?? '', type: MovementType.ENTRADA, quantity: 1, reason: '' });
  }, [open, product, reset]);

  const mutation = useMutation({
    mutationFn: (values: MovementFormValues) => createMovement(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Movimiento registrado correctamente');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const selectedProductId = watch('productId');
  const selectedProduct =
    product ?? productsQuery.data?.items.find((p) => p.id === selectedProductId);

  return (
    <Modal open={open} onClose={onClose} title="Nuevo movimiento de stock">
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        {product ? (
          <div className="rounded-lg bg-surface-subtle px-3 py-2 text-sm">
            <p className="font-medium text-ink">{product.name}</p>
            <p className="text-ink-muted">SKU {product.sku}</p>
          </div>
        ) : (
          <Select
            label="Producto"
            placeholder="Seleccioná un producto"
            options={(productsQuery.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            error={formState.errors.productId?.message}
            {...register('productId')}
          />
        )}

        {selectedProduct && (
          <p className="text-xs text-ink-muted">
            Stock actual: {selectedProduct.currentStock} {selectedProduct.unit}
          </p>
        )}

        <Select label="Tipo de movimiento" options={manualTypeOptions} {...register('type')} />
        <Input
          label="Cantidad"
          type="number"
          min={1}
          error={formState.errors.quantity?.message}
          {...register('quantity')}
        />
        <Input label="Motivo (opcional)" {...register('reason')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Registrar movimiento
          </Button>
        </div>
      </form>
    </Modal>
  );
}
