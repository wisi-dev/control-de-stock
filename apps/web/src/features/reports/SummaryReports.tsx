import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import {
  fetchEstimatedProfit,
  fetchPurchasesBySupplier,
  fetchSalesByPaymentMethod,
} from '../../services/reports.service.js';
import { DateRangeFilter, defaultDateRange } from './DateRangeFilter.js';

export function SummaryReports() {
  const [range, setRange] = useState(defaultDateRange());

  const profitQuery = useQuery({ queryKey: ['reports', 'profit', range], queryFn: () => fetchEstimatedProfit(range) });
  const suppliersQuery = useQuery({
    queryKey: ['reports', 'purchases-by-supplier', range],
    queryFn: () => fetchPurchasesBySupplier(range),
  });
  const paymentQuery = useQuery({
    queryKey: ['reports', 'payment-methods', range],
    queryFn: () => fetchSalesByPaymentMethod(range),
  });

  return (
    <div className="space-y-4">
      <DateRangeFilter {...range} onChange={setRange} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Ganancias estimadas</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Ingresos por ventas</span>
              <span>${(profitQuery.data?.revenue ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Costo estimado</span>
              <span>${(profitQuery.data?.cost ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-ink">
              <span>Ganancia estimada</span>
              <span>${(profitQuery.data?.estimatedProfit ?? 0).toFixed(2)}</span>
            </div>
            <p className="pt-1 text-xs text-ink-subtle">
              Calculada con el precio de compra actual de cada producto — es una estimación, no el costo histórico exacto.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Ventas por método de pago</p>
          </CardHeader>
          <CardContent>
            {(paymentQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-muted">Sin ventas en este período.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {paymentQuery.data!.map((p) => (
                  <li key={p.paymentMethod} className="flex justify-between">
                    <span className="text-ink">
                      {p.paymentMethod} <span className="text-ink-subtle">({p.count})</span>
                    </span>
                    <span className="text-ink-muted">${p.total.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Compras por proveedor</p>
          </CardHeader>
          <CardContent>
            {(suppliersQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-muted">Sin compras recibidas en este período.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {suppliersQuery.data!.map((s) => (
                  <li key={s.supplierId} className="flex justify-between">
                    <span className="text-ink">
                      {s.businessName} <span className="text-ink-subtle">({s.count})</span>
                    </span>
                    <span className="text-ink-muted">${s.total.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {profitQuery.isError && (
        <EmptyState title="No pudimos cargar los reportes" description="Intentá nuevamente en unos segundos." />
      )}
    </div>
  );
}
