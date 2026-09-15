import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Boxes, DollarSign, PackageX, Truck, Users } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard.js';
import { Card, CardContent, CardHeader } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { fetchProducts } from '../services/products.service.js';
import { fetchSuppliers } from '../services/suppliers.service.js';
import { fetchCustomers } from '../services/customers.service.js';
import { fetchAlerts, fetchMovements } from '../services/inventory.service.js';
import { fetchDashboardSummary } from '../services/reports.service.js';

/** Dashboard con KPIs, alertas y actividad reciente (sección 4 del brief), todo con datos reales. */
export function DashboardPage() {
  const productsQuery = useQuery({
    queryKey: ['products', 'dashboard-count'],
    queryFn: () => fetchProducts({ pageSize: 1 }),
  });
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });
  const alertsQuery = useQuery({ queryKey: ['inventory', 'alerts'], queryFn: fetchAlerts });
  const summaryQuery = useQuery({ queryKey: ['reports', 'dashboard'], queryFn: fetchDashboardSummary });
  const movementsQuery = useQuery({
    queryKey: ['inventory', 'movements', 'dashboard-recent'],
    queryFn: () => fetchMovements({ page: 1, pageSize: 5 }),
  });

  const lowStockCount = alertsQuery.data?.lowStock.length ?? 0;
  const outOfStockCount = alertsQuery.data?.outOfStock.length ?? 0;
  const hasStockAlerts = lowStockCount > 0 || outOfStockCount > 0;
  const pendingPurchases = summaryQuery.data?.pendingPurchases ?? 0;
  const hasAlerts = hasStockAlerts || pendingPurchases > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">Resumen general del negocio</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas del día" value={`$${(summaryQuery.data?.salesToday ?? 0).toFixed(2)}`} icon={DollarSign} />
        <StatCard label="Ventas del mes" value={`$${(summaryQuery.data?.salesMonth ?? 0).toFixed(2)}`} icon={DollarSign} />
        <StatCard label="Productos registrados" value={String(productsQuery.data?.total ?? '—')} icon={Boxes} />
        <StatCard label="Total de clientes" value={String(customersQuery.data?.length ?? '—')} icon={Users} />
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
        <StatCard
          label="Compras pendientes"
          value={String(pendingPurchases)}
          icon={AlertTriangle}
          tone={pendingPurchases > 0 ? 'warning' : 'default'}
        />
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
                {pendingPurchases > 0 && (
                  <li className="flex items-center justify-between">
                    <span className="text-ink">Compras esperando recepción</span>
                    <span className="font-medium text-warning">{pendingPurchases}</span>
                  </li>
                )}
              </ul>
            ) : (
              <EmptyState
                icon={AlertTriangle}
                title="Sin alertas por ahora"
                description="Acá vas a ver stock bajo, productos agotados y compras pendientes en cuanto haya datos cargados."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Ventas recientes</p>
          </CardHeader>
          <CardContent>
            {(summaryQuery.data?.recentSales.length ?? 0) === 0 ? (
              <EmptyState title="Todavía no hay ventas" description="Las ventas confirmadas van a aparecer acá." />
            ) : (
              <ul className="space-y-2 text-sm">
                {summaryQuery.data!.recentSales.map((s) => (
                  <li key={s.id} className="flex items-center justify-between">
                    <span className="text-ink">{s.customerName ?? 'Sin cliente'}</span>
                    <span className="text-ink-muted">
                      ${s.total.toFixed(2)} · {new Date(s.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Compras recientes</p>
          </CardHeader>
          <CardContent>
            {(summaryQuery.data?.recentPurchases.length ?? 0) === 0 ? (
              <EmptyState title="Todavía no hay compras" description="Las compras registradas van a aparecer acá." />
            ) : (
              <ul className="space-y-2 text-sm">
                {summaryQuery.data!.recentPurchases.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="text-ink">{p.supplierName}</span>
                    <div className="flex items-center gap-2">
                      <Badge tone={p.status === 'RECIBIDA' ? 'success' : p.status === 'CANCELADA' ? 'danger' : 'default'}>
                        {p.status}
                      </Badge>
                      <span className="text-ink-muted">${p.total.toFixed(2)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Últimos movimientos</p>
          </CardHeader>
          <CardContent>
            {(movementsQuery.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                title="Todavía no hay movimientos de stock"
                description="Se registran automáticamente al comprar, vender o ajustar stock."
              />
            ) : (
              <ul className="space-y-2 text-sm">
                {movementsQuery.data!.items.map((m) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
