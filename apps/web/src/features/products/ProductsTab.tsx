import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Pencil,
  Plus,
  Search,
  Upload,
} from 'lucide-react';
import { ProductStatus, type Product } from '@control-stock/shared';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Select } from '../../components/ui/Select.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { fetchCategories } from '../../services/categories.service.js';
import { fetchBrands } from '../../services/brands.service.js';
import { fetchSuppliers } from '../../services/suppliers.service.js';
import {
  downloadProductsCsv,
  fetchProducts,
  importProductsCsv,
  type ProductListParams,
} from '../../services/products.service.js';
import { toast } from '../../store/toastStore.js';
import { usePermission } from '../../hooks/usePermission.js';
import { ProductFormModal } from './ProductFormModal.js';

const statusOptions = [
  { value: ProductStatus.ACTIVO, label: 'Activo' },
  { value: ProductStatus.INACTIVO, label: 'Inactivo' },
  { value: ProductStatus.DESCONTINUADO, label: 'Descontinuado' },
];

const columns: { key: NonNullable<ProductListParams['sortBy']>; label: string }[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Nombre' },
  { key: 'salePrice', label: 'Precio venta' },
  { key: 'currentStock', label: 'Stock' },
];

export function ProductsTab() {
  const canManage = usePermission('products:*');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ProductListParams>({
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortDir: 'asc',
  });
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);

  // Debounce simple de la búsqueda para no refetchear en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const brandsQuery = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });

  const productsQuery = useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });

  function updateFilter(patch: Partial<ProductListParams>) {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  function toggleSort(key: NonNullable<ProductListParams['sortBy']>) {
    setFilters((prev) => ({
      ...prev,
      sortBy: key,
      sortDir: prev.sortBy === key && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }));
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const result = await importProductsCsv(file);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      if (result.errors.length > 0) {
        toast.error(
          `Importados ${result.created + result.updated}, con ${result.errors.length} error(es). Fila ${result.errors[0]!.row}: ${result.errors[0]!.message}`,
        );
      } else {
        toast.success(`Importación completa: ${result.created} creados, ${result.updated} actualizados`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No pudimos importar el archivo');
    }
  }

  async function handleExport() {
    try {
      await downloadProductsCsv();
    } catch {
      toast.error('No pudimos exportar los productos');
    }
  }

  const products = productsQuery.data?.items ?? [];
  const totalPages = productsQuery.data?.totalPages ?? 1;
  const page = filters.page ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-ink-subtle" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="w-full outline-none"
          />
        </div>
        <Select
          className="w-auto"
          placeholder="Categoría"
          options={(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          onChange={(e) => updateFilter({ categoryId: e.target.value || undefined })}
        />
        <Select
          className="w-auto"
          placeholder="Marca"
          options={(brandsQuery.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
          onChange={(e) => updateFilter({ brandId: e.target.value || undefined })}
        />
        <Select
          className="w-auto"
          placeholder="Proveedor"
          options={(suppliersQuery.data ?? []).map((s) => ({ value: s.id, label: s.businessName }))}
          onChange={(e) => updateFilter({ supplierId: e.target.value || undefined })}
        />
        <Select
          className="w-auto"
          placeholder="Estado"
          options={statusOptions}
          onChange={(e) => updateFilter({ status: e.target.value || undefined })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={handleExport}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
        {canManage && (
          <>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Importar CSV
            </Button>
            <Button size="sm" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          </>
        )}
      </div>

      {productsQuery.isLoading ? (
        <p className="text-sm text-ink-muted">Cargando productos...</p>
      ) : productsQuery.isError ? (
        <EmptyState title="No pudimos cargar los productos" description="Intentá nuevamente en unos segundos." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No encontramos productos"
          description="Probá cambiar los filtros o creá el primer producto del catálogo."
        />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                  {columns.map((col) => (
                    <th key={col.key} className="px-5 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="flex items-center gap-1 hover:text-ink"
                      >
                        {col.label}
                        {filters.sortBy === col.key &&
                          (filters.sortDir === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  {canManage && <th className="px-5 py-3 font-medium text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink-muted">{product.sku}</td>
                    <td className="px-5 py-3 font-medium text-ink">{product.name}</td>
                    <td className="px-5 py-3 text-ink-muted">${product.salePrice.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          product.currentStock <= product.minStock ? 'font-medium text-danger' : 'text-ink-muted'
                        }
                      >
                        {product.currentStock} {product.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{product.category?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={
                          product.status === ProductStatus.ACTIVO
                            ? 'success'
                            : product.status === ProductStatus.INACTIVO
                              ? 'default'
                              : 'danger'
                        }
                      >
                        {product.status}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setEditing(product)}
                            aria-label="Editar producto"
                            className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>
                Página {page} de {totalPages} — {productsQuery.data?.total} productos
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ProductFormModal open={editing !== undefined} product={editing ?? null} onClose={() => setEditing(undefined)} />
    </div>
  );
}
