import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { RoleName, type PermissionModule, type Role } from '@control-stock/shared';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { fetchPermissionCatalog, fetchRoles, updateRolePermissions } from '../../services/roles.service.js';
import { toast } from '../../store/toastStore.js';

export function RolesTab() {
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: fetchRoles });
  const catalogQuery = useQuery({ queryKey: ['permissionCatalog'], queryFn: fetchPermissionCatalog });

  if (rolesQuery.isLoading || catalogQuery.isLoading) {
    return <p className="text-sm text-ink-muted">Cargando roles...</p>;
  }

  const roles = rolesQuery.data ?? [];
  const catalog = catalogQuery.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {roles.map((role) => (
        <RoleCard key={role.id} role={role} catalog={catalog} />
      ))}
    </div>
  );
}

interface RoleCardProps {
  role: Role;
  catalog: PermissionModule[];
}

function RoleCard({ role, catalog }: RoleCardProps) {
  const queryClient = useQueryClient();
  const isAdmin = role.name === RoleName.ADMINISTRADOR;
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions ?? []));

  useEffect(() => {
    setSelected(new Set(role.permissions ?? []));
  }, [role.permissions]);

  const mutation = useMutation({
    mutationFn: () => updateRolePermissions(role.id, [...selected]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(`Permisos de ${role.name} actualizados`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{role.name}</span>
          {isAdmin && (
            <Badge tone="default">
              <ShieldCheck className="mr-1 h-3 w-3" /> Acceso total
            </Badge>
          )}
        </div>
        {!isAdmin && (
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Guardar cambios
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdmin ? (
          <p className="text-sm text-ink-muted">
            El Administrador siempre tiene acceso completo a todos los módulos y no se puede modificar.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr,auto,auto] gap-x-4 gap-y-2 text-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Módulo</span>
              <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Ver</span>
              <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Administrar</span>
              {catalog.map((module) => (
                <PermissionRow key={module.key} module={module} selected={selected} onToggle={toggle} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PermissionRow({
  module,
  selected,
  onToggle,
}: {
  module: PermissionModule;
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  const readKey = `${module.key}:read`;
  const fullKey = `${module.key}:*`;

  return (
    <>
      <span className="text-ink-muted">{module.label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        checked={selected.has(readKey)}
        onChange={() => onToggle(readKey)}
        aria-label={`${module.label} — ver`}
      />
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        checked={selected.has(fullKey)}
        onChange={() => onToggle(fullKey)}
        aria-label={`${module.label} — administrar`}
      />
    </>
  );
}
