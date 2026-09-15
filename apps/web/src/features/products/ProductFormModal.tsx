import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ProductStatus, type Product } from '@control-stock/shared';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Button } from '../../components/ui/Button.js';
import { fetchCategories } from '../../services/categories.service.js';
import { fetchBrands } from '../../services/brands.service.js';
import { fetchSuppliers } from '../../services/suppliers.service.js';
import { createProduct, updateProduct } from '../../services/products.service.js';
import { toast } from '../../store/toastStore.js';

/**
 * Esquema propio del formulario (no el de `@control-stock/shared`): los
 * selects de categoría/marca/proveedor mandan `''` cuando no hay selección,
 * y acá se acepta como string para transformarlo a `null` recién al enviar.
 */
const productFormSchema = z.object({
  sku: z.string().min(1, 'El SKU es obligatorio').max(50),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  supplierId: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, 'No puede ser negativo'),
  salePrice: z.coerce.number().min(0, 'No puede ser negativo'),
  minStock: z.coerce.number().int().min(0, 'No puede ser negativo'),
  maxStock: z
    .string()
    .optional()
    .refine((val) => !val || (Number.isInteger(Number(val)) && Number(val) >= 0), 'Debe ser un número entero positivo'),
  unit: z.string().min(1, 'La unidad es obligatoria').max(30),
  status: z.nativeEnum(ProductStatus),
});
type ProductFormValues = z.infer<typeof productFormSchema>;

const statusOptions = [
  { value: ProductStatus.ACTIVO, label: 'Activo' },
  { value: ProductStatus.INACTIVO, label: 'Inactivo' },
  { value: ProductStatus.DESCONTINUADO, label: 'Descontinuado' },
];

interface ProductFormModalProps {
  open: boolean;
  /** `null` = crear producto nuevo. */
  product: Product | null;
  onClose: () => void;
}

export function ProductFormModal({ open, product, onClose }: ProductFormModalProps) {
  const isEdit = product !== null;
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories, enabled: open });
  const brandsQuery = useQuery({ queryKey: ['brands'], queryFn: fetchBrands, enabled: open });
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers, enabled: open });

  const { register, handleSubmit, watch, reset, formState } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      sku: product?.sku ?? '',
      barcode: product?.barcode ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      categoryId: product?.categoryId ?? '',
      brandId: product?.brandId ?? '',
      supplierId: product?.supplierId ?? '',
      purchasePrice: product?.purchasePrice ?? 0,
      salePrice: product?.salePrice ?? 0,
      minStock: product?.minStock ?? 0,
      maxStock: product?.maxStock != null ? String(product.maxStock) : '',
      unit: product?.unit ?? 'unidad',
      status: product?.status ?? ProductStatus.ACTIVO,
    });
  }, [open, product, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const payload = {
        ...values,
        barcode: values.barcode || null,
        description: values.description || null,
        categoryId: values.categoryId || null,
        brandId: values.brandId || null,
        supplierId: values.supplierId || null,
        maxStock: values.maxStock === '' || values.maxStock === undefined ? null : Number(values.maxStock),
      };
      return isEdit ? updateProduct(product.id, payload) : createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const purchasePrice = watch('purchasePrice');
  const salePrice = watch('salePrice');
  const margin =
    salePrice > 0 && !Number.isNaN(purchasePrice) && !Number.isNaN(salePrice)
      ? (((salePrice - purchasePrice) / salePrice) * 100).toFixed(1)
      : null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar producto' : 'Nuevo producto'}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="SKU" error={formState.errors.sku?.message} {...register('sku')} />
          <Input label="Código de barras" error={formState.errors.barcode?.message} {...register('barcode')} />
        </div>
        <Input label="Nombre" error={formState.errors.name?.message} {...register('name')} />
        <Input label="Descripción" error={formState.errors.description?.message} {...register('description')} />

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Categoría"
            placeholder="Sin categoría"
            options={(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            {...register('categoryId')}
          />
          <Select
            label="Marca"
            placeholder="Sin marca"
            options={(brandsQuery.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
            {...register('brandId')}
          />
          <Select
            label="Proveedor"
            placeholder="Sin proveedor"
            options={(suppliersQuery.data ?? []).map((s) => ({ value: s.id, label: s.businessName }))}
            {...register('supplierId')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio de compra"
            type="number"
            step="0.01"
            error={formState.errors.purchasePrice?.message}
            {...register('purchasePrice')}
          />
          <Input
            label="Precio de venta"
            type="number"
            step="0.01"
            error={formState.errors.salePrice?.message}
            {...register('salePrice')}
          />
        </div>
        {margin !== null && <p className="text-xs text-ink-muted">Margen estimado: {margin}%</p>}

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Stock mínimo"
            type="number"
            error={formState.errors.minStock?.message}
            {...register('minStock')}
          />
          <Input label="Stock máximo" type="number" {...register('maxStock')} />
          <Input label="Unidad" error={formState.errors.unit?.message} {...register('unit')} />
        </div>

        <Select label="Estado" options={statusOptions} {...register('status')} />

        {isEdit && (
          <p className="text-xs text-ink-subtle">
            El stock actual ({product.currentStock}) se administra desde Inventario, registrando un movimiento.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
