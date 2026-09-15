import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Boxes, DollarSign, PackageX, Truck, Users } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard.js';
import { Card, CardContent, CardHeader } from '../components/ui/Card.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { fetchProducts } from '../services/products.service.js';
import { fetchSuppliers } from '../services/suppliers.service.js';
import { fetchAlerts, fetchMovements } from '../services/inventory.service.js';

/**
 * Dashboard con la estructura final de KPIs, alertas y actividad reciente
 * (sección 4 del brief). Productos/Stock/Proveedores ya usan datos reales
 * (Fases 3-4); Ventas del día/mes y Total de clientes quedan en $0/0 hasta
 * que existan Ventas y Clientes (Fases 6-7) — mostrar un número simulado
 * ahí sería peor que mostrar el estado real.
 */
export function DashboardPage() {
  const productsQuery = useQuery({
    queryKey: ['products', 'dashboard-count'],
    queryFn: () => fetchProducts({ pageSize: 1 }),
  });
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });
  const alertsQuery = useQuery({ queryKey: ['inventory', 'alerts'], queryFn: fetchAlerts });
  const movementsQuery = useQuery({
    queryKey: ['inventory', 'movements', 'dashboard-recent'],
    queryFn: () => fetchMovements({ page: 1, pageSize: 5 }),
  });

  const lowStockCount = alertsQuery.data?.lowStock.length ?? 0;
  const outOfStockCount = alertsQuery.data?.outOfStock.length ?? 0;
  const hasAlerts = lowStockCount > 0 || outOfStockCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">Resumen general del negocio</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas del día" value="$0" icon={DollarSign} />
        <StatCard label="Ventas del mes" value="$0" icon={DollarSign} />
        <StatCard label="Productos registrados" value={String(productsQuery.data?.total ?? '—')} icon={Boxes} />
        <StatCard label="Total de clientes" value="0" icon={Users} />
        <StatCard
          label="Stock bajo"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          tone={lowStockCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Sin stock"
          value={String(outOfStockCount)}
          icon={PackageX}
          tone={outOfStockCount > 0 ? 'danger' : 'default'}
        />
        <StatCard label="Proveedores" value={String(suppliersQuery.data?.length ?? '—')} icon={Truck} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">⚠ Alertas</p>
          </CardHeader>
          <CardContent>
            {hasAlerts ? (
              <ul className="space-y-2 text-sm">
                {alertsQuery.data!.outOfStock.slice(0, 3).map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="text-ink">{p.name}</span>
                    <span className="font-medium text-danger">Sin stock</span>
                  </li>
                ))}
                {alertsQuery.data!.lowStock.slice(0, 3).map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="text-ink">{p.name}</span>
                    <span className="font-medium text-warning">
                      Stock bajo ({p.currentStock}/{p.minStock})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={AlertTriangle}
                title="Sin alertas por ahora"
                description="Acá vas a ver stock bajo, productos agotados, compras y pagos pendientes en cuanto haya datos cargados."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Últimos movimientos</p>
          </CardHeader>
          <CardContent>
            {movementsQuery.data && movementsQuery.data.items.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {movementsQuery.data.items.map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <span className="text-ink">
                      {m.product?.name} <span className="text-ink-subtle">({m.type})</span>
                    </span>
                    <span className="text-ink-muted">
                      {m.previousStock} → {m.resultingStock}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Todavía no hay movimientos de stock"
                description="Los movimientos de inventario se registran automáticamente al comprar, vender o ajustar stock."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
