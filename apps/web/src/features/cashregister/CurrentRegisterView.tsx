import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownCircle, ArrowUpCircle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { fetchCurrentCashRegister } from '../../services/cashregister.service.js';
import { usePermission } from '../../hooks/usePermission.js';
import { OpenCashRegisterCard } from './OpenCashRegisterCard.js';
import { CashMovementModal } from './CashMovementModal.js';
import { CloseCashRegisterModal } from './CloseCashRegisterModal.js';

export function CurrentRegisterView() {
  const canManage = usePermission('cashregister:*');
  const registerQuery = useQuery({ queryKey: ['cashregister', 'current'], queryFn: fetchCurrentCashRegister });
  const [movementType, setMovementType] = useState<'INGRESO' | 'EGRESO' | null>(null);
  const [closing, setClosing] = useState(false);

  if (registerQuery.isLoading) return <p className="text-sm text-ink-muted">Cargando caja...</p>;

  const register = registerQuery.data;

  if (!register) {
    return canManage ? (
      <OpenCashRegisterCard />
    ) : (
      <EmptyState icon={Lock} title="No hay una caja abierta" description="Pedile a un administrador o encargado que la abra." />
    );
  }

  const ingresos = register.cashMovements.filter((m) => m.type === 'INGRESO').reduce((s, m) => s + m.amount, 0);
  const egresos = register.cashMovements.filter((m) => m.type === 'EGRESO').reduce((s, m) => s + m.amount, 0);
  const ventas = register.cashMovements.filter((m) => m.type === 'VENTA').reduce((s, m) => s + m.amount, 0);
  const expectedAmount = register.openingAmount + ingresos + ventas - egresos;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              Caja abierta <Badge tone="success">ABIERTA</Badge>
            </p>
            <p className="text-xs text-ink-muted">
              Desde {new Date(register.openedAt).toLocaleString('es-AR')} — {register.user?.name}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setMovementType('INGRESO')}>
                <ArrowUpCircle className="h-4 w-4" /> Ingreso
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setMovementType('EGRESO')}>
                <ArrowDownCircle className="h-4 w-4" /> Egreso
              </Button>
              <Button size="sm" variant="danger" onClick={() => setClosing(true)}>
                Cerrar caja
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <SummaryItem label="Caja inicial" value={register.openingAmount} />
            <SummaryItem label="Ingresos" value={ingresos} />
            <SummaryItem label="Ventas (efectivo)" value={ventas} />
            <SummaryItem label="Egresos" value={-egresos} />
            <SummaryItem label="Caja esperada" value={expectedAmount} emphasis />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-ink">Movimientos de esta caja</p>
        </CardHeader>
        <CardContent>
          {register.cashMovements.length === 0 ? (
            <p className="text-sm text-ink-muted">Todavía no hay movimientos.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium">Descripción</th>
                  <th className="py-2 font-medium">Usuario</th>
                  <th className="py-2 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {register.cashMovements.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 text-ink-muted">{new Date(m.createdAt).toLocaleTimeString('es-AR')}</td>
                    <td className="py-2">
                      <Badge tone={m.type === 'EGRESO' ? 'danger' : 'success'}>{m.type}</Badge>
                    </td>
                    <td className="py-2 text-ink-muted">{m.description || '—'}</td>
                    <td className="py-2 text-ink-muted">{m.user?.name}</td>
                    <td className="py-2 text-right text-ink-muted">
                      {m.type === 'EGRESO' ? '-' : '+'}${m.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {movementType && (
        <CashMovementModal
          open
          registerId={register.id}
          type={movementType}
          onClose={() => setMovementType(null)}
        />
      )}
      {closing && (
        <CloseCashRegisterModal
          open
          register={register}
          expectedAmount={expectedAmount}
          onClose={() => setClosing(false)}
        />
      )}
    </div>
  );
}

function SummaryItem({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={emphasis ? 'text-lg font-semibold text-ink' : 'text-sm text-ink'}>${value.toFixed(2)}</p>
    </div>
  );
}
