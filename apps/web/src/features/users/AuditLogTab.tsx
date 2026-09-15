import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card.js';
import { Select } from '../../components/ui/Select.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { fetchAuditFilters, fetchAuditLog } from '../../services/audit.service.js';

export function AuditLogTab() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');

  const filtersQuery = useQuery({ queryKey: ['audit', 'filters'], queryFn: fetchAuditFilters });
  const logQuery = useQuery({
    queryKey: ['audit', page, entity, action],
    queryFn: () => fetchAuditLog({ page, pageSize: 20, entity: entity || undefined, action: action || undefined }),
  });

  function updateFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  const entries = logQuery.data?.items ?? [];
  const totalPages = logQuery.data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select
          className="w-auto"
          placeholder="Entidad"
          options={(filtersQuery.data?.entities ?? []).map((e) => ({ value: e, label: e }))}
          value={entity}
          onChange={(e) => updateFilter(setEntity, e.target.value)}
        />
        <Select
          className="w-auto"
          placeholder="Acción"
          options={(filtersQuery.data?.actions ?? []).map((a) => ({ value: a, label: a }))}
          value={action}
          onChange={(e) => updateFilter(setAction, e.target.value)}
        />
      </div>

      {logQuery.isLoading ? (
        <p className="text-sm text-ink-muted">Cargando auditoría...</p>
      ) : entries.length === 0 ? (
        <EmptyState title="Sin actividad registrada" description="Probá cambiar los filtros." />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Acción</th>
                  <th className="px-5 py-3 font-medium">Entidad</th>
                  <th className="px-5 py-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-5 py-3 text-ink-muted">{new Date(entry.createdAt).toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3 text-ink-muted">{entry.user?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge>{entry.action}</Badge>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {entry.entity}
                      {entry.entityId ? ` (${entry.entityId.slice(-8)})` : ''}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-subtle">
                      {entry.metadata ? JSON.stringify(entry.metadata).slice(0, 80) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
