import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { downloadProductsCsv } from '../../services/products.service.js';
import { downloadInventoryMovementsCsv } from '../../services/reports.service.js';
import { toast } from '../../store/toastStore.js';

export function InventoryReports() {
  async function exportStock() {
    try {
      await downloadProductsCsv();
    } catch {
      toast.error('No pudimos exportar el stock');
    }
  }

  async function exportMovements() {
    try {
      await downloadInventoryMovementsCsv({});
    } catch {
      toast.error('No pudimos exportar los movimientos');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-ink">Stock actual</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-muted">
            Catálogo completo con stock, precios y estado de cada producto. Para ver stock bajo o agotado en
            detalle, entrá a Inventario → Alertas.
          </p>
          <Button size="sm" variant="secondary" onClick={exportStock}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-ink">Movimientos de inventario</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-muted">
            Historial completo de entradas, salidas, compras, ventas, devoluciones y ajustes. Para filtrar por
            producto, entrá a Inventario → Movimientos.
          </p>
          <Button size="sm" variant="secondary" onClick={exportMovements}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
