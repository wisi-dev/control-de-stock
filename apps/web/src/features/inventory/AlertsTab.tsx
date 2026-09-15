import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, PackageX } from 'lucide-react';
import type { Product } from '@control-stock/shared';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { usePermission } from '../../hooks/usePermission.js';
import { fetchAlerts } from '../../services/inventory.service.js';
import { MovementFormModal } from './MovementFormModal.js';

export function AlertsTab() {
  const canManage = usePermission('inventory:*');
  const alertsQuery = useQuery({ queryKey: ['inventory', 'alerts'], queryFn: fetchAlerts });
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  if (alertsQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando alertas...</p>;
  if (alertsQuery.isError) {
    return <EmptyState title="No pudimos cargar las alertas" description="Intentá nuevamente en unos segundos." />;
  }

  const { lowStock, outOfStock, staleProducts, staleDays } = alertsQuery.data!;

  return (
    <div className="space-y-4">
      <AlertSection
        icon={AlertTriangle}
        tone="warning"
        title="Stock bajo"
        description="Productos en o por debajo de su stock mínimo."
        products={lowStock}
        emptyText="Ningún producto está en stock bajo por ahora."
        canManage={canManage}
        onAdjust={setAdjusting}
        renderExtra={(p) => `mínimo ${p.minStock}`}
      />
      <AlertSection
        icon={PackageX}
        tone="danger"
        title="Sin stock"
        description="Productos agotados, activos para la venta."
        products={outOfStock}
        emptyText="No hay productos agotados."
        canManage={canManage}
        onAdjust={setAdjusting}
      />
      <AlertSection
        icon={Clock}
        tone="default"
        title={`Sin movimiento en ${staleDays} días`}
        description="Puede indicar productos de baja rotación."
        products={staleProducts}
        emptyText="Todos los productos con stock tuvieron movimientos recientes."
        canManage={canManage}
        onAdjust={setAdjusting}
      />

      <MovementFormModal
        open={adjusting !== null}
        product={adjusting ?? undefined}
        onClose={() => setAdjusting(null)}
      />
    </div>
  );
}

interface AlertSectionProps {
  icon: typeof AlertTriangle;
  tone: 'warning' | 'danger' | 'default';
  title: string;
  description: string;
  products: Product[];
  emptyText: string;
  canManage: boolean;
  onAdjust: (product: Product) => void;
  renderExtra?: (product: Product) => string;
}

function AlertSection({
  icon: Icon,
  tone,
  title,
  description,
  products,
  emptyText,
  canManage,
  onAdjust,
  renderExtra,
}: AlertSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-ink-muted" />
          <p className="text-sm font-medium text-ink">{title}</p>
          {products.length > 0 && <Badge tone={tone}>{products.length}</Badge>}
        </div>
        <p className="text-xs text-ink-muted">{description}</p>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-ink-muted">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {products.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-ink">{product.name}</p>
                  <p className="text-ink-muted">
                    SKU {product.sku} — stock {product.currentStock} {product.unit}
                    {renderExtra ? ` (${renderExtra(product)})` : ''}
                  </p>
                </div>
                {canManage && (
                  <Button size="sm" variant="secondary" onClick={() => onAdjust(product)}>
                    Ajustar stock
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
