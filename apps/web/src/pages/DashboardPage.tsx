import { AlertTriangle, Boxes, DollarSign, PackageX, Users, Truck } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard.js';
import { Card, CardContent, CardHeader } from '../components/ui/Card.js';
import { EmptyState } from '../components/ui/EmptyState.js';

/**
 * Dashboard con la estructura final de KPIs, alertas y actividad reciente
 * (ver sección 4 del brief). Los datos son de ejemplo — se conectan a la API
 * real (/api/reports/dashboard) en la Fase 8, una vez existan ventas, compras
 * y movimientos de inventario.
 */
export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">Resumen general del negocio</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas del día" value="$0" icon={DollarSign} />
        <StatCard label="Ventas del mes" value="$0" icon={DollarSign} />
        <StatCard label="Productos registrados" value="0" icon={Boxes} />
        <StatCard label="Total de clientes" value="0" icon={Users} />
        <StatCard label="Stock bajo" value="0" icon={AlertTriangle} tone="warning" />
        <StatCard label="Sin stock" value="0" icon={PackageX} tone="danger" />
        <StatCard label="Proveedores" value="0" icon={Truck} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">⚠ Alertas</p>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={AlertTriangle}
              title="Sin alertas por ahora"
              description="Acá vas a ver stock bajo, productos agotados, compras y pagos pendientes en cuanto haya datos cargados."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Últimos movimientos</p>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Todavía no hay movimientos de stock"
              description="Los movimientos de inventario se registran automáticamente al comprar, vender o ajustar stock."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
