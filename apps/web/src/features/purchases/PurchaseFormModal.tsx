import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Button } from '../../components/ui/Button.js';
import { fetchSuppliers } from '../../services/suppliers.service.js';
import { fetchProducts } from '../../services/products.service.js';
import { createPurchase } from '../../services/purchases.service.js';
import { toast } from '../../store/toastStore.js';

const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, 'Seleccioná un proveedor'),
  discount: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  tax: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Seleccioná un producto'),
        quantity: z.coerce.number().int().positive('Debe ser mayor a cero'),
        unitPrice: z.coerce.number().min(0, 'No puede ser negativo'),
      }),
    )
    .min(1, 'Agregá al menos un producto'),
});
type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

interface PurchaseFormModalProps {
  open: boolean;
  onClose: () => void;
}

export function PurchaseFormModal({ open, onClose }: PurchaseFormModalProps) {
  const queryClient = useQueryClient();
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers, enabled: open });
  const productsQuery = useQuery({
    queryKey: ['products', 'all-for-purchase'],
    queryFn: () => fetchProducts({ pageSize: 100, sortBy: 'name', sortDir: 'asc' }),
    enabled: open,
  });

  const { register, control, handleSubmit, watch, reset, setValue, formState } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: { supplierId: '', discount: 0, tax: 0, items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (open) {
      reset({ supplierId: '', discount: 0, tax: 0, items: [{ productId: '', quantity: 1, unitPrice: 0 }] });
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: PurchaseFormValues) => createPurchase(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Compra registrada como pendiente');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const items = watch('items');
  const discount = watch('discount');
  const tax = watch('tax');
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const total = Math.max(0, subtotal - (discount || 0) + (tax || 0));

  const productOptions = (productsQuery.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));

  function handleProductChange(index: number, productId: string) {
    const product = productsQuery.data?.items.find((p) => p.id === productId);
    if (product) setValue(`items.${index}.unitPrice`, product.purchasePrice);
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva compra">
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Select
          label="Proveedor"
          placeholder="Seleccioná un proveedor"
          options={(suppliersQuery.data ?? []).map((s) => ({ value: s.id, label: s.businessName }))}
          error={formState.errors.supplierId?.message}
          {...register('supplierId')}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-muted">Productos</p>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  placeholder="Producto"
                  options={productOptions}
                  {...register(`items.${index}.productId`, {
                    onChange: (e) => handleProductChange(index, e.target.value),
                  })}
                />
              </div>
              <div className="w-20">
                <Input type="number" min={1} placeholder="Cant." {...register(`items.${index}.quantity`)} />
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  {...register(`items.${index}.unitPrice`)}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                aria-label="Quitar producto"
                className="rounded-lg p-2 text-ink-muted hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {formState.errors.items?.message && (
            <p className="text-xs text-danger">{formState.errors.items.message}</p>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
          >
            <Plus className="h-4 w-4" /> Agregar producto
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Descuento" type="number" step="0.01" {...register('discount')} />
          <Input label="Impuestos" type="number" step="0.01" {...register('tax')} />
        </div>

        <div className="rounded-lg bg-surface-subtle px-3 py-2 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-ink">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-ink-subtle">
          La compra se registra como pendiente. El stock se actualiza al recibirla.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Crear compra
          </Button>
        </div>
      </form>
    </Modal>
  );
}
