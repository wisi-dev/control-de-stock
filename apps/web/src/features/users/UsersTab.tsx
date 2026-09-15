import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, Plus, UserX2 } from 'lucide-react';
import type { UserWithRole } from '@control-stock/shared';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { fetchUsers, updateUser } from '../../services/users.service.js';
import { toast } from '../../store/toastStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { UserFormModal } from './UserFormModal.js';
import { PasswordModal } from './PasswordModal.js';

export function UsersTab() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  const [formUser, setFormUser] = useState<UserWithRole | null | undefined>(undefined);
  const [passwordUser, setPasswordUser] = useState<UserWithRole | null>(null);

  const toggleActiveMutation = useMutation({
    mutationFn: (user: UserWithRole) => updateUser(user.id, { active: !user.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado del usuario actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (usersQuery.isLoading) {
    return <p className="text-sm text-ink-muted">Cargando usuarios...</p>;
  }

  if (usersQuery.isError) {
    return (
      <EmptyState
        title="No pudimos cargar los usuarios"
        description="Intentá nuevamente en unos segundos."
      />
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormUser(null)}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-subtle">
              <th className="px-5 py-3 font-medium">Nombre</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Rol</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Último acceso</th>
              <th className="px-5 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-3 font-medium text-ink">{user.name}</td>
                <td className="px-5 py-3 text-ink-muted">{user.email}</td>
                <td className="px-5 py-3">
                  <Badge>{user.role.name}</Badge>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={user.active ? 'success' : 'default'}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-ink-muted">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('es-AR') : '—'}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setFormUser(user)}
                      aria-label="Editar usuario"
                      className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordUser(user)}
                      aria-label="Cambiar contraseña"
                      className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={user.id === currentUserId}
                      onClick={() => toggleActiveMutation.mutate(user)}
                      aria-label={user.active ? 'Desactivar usuario' : 'Activar usuario'}
                      className="rounded-lg p-2 text-ink-muted hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
                      title={user.id === currentUserId ? 'No podés desactivar tu propio usuario' : undefined}
                    >
                      <UserX2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <UserFormModal
        open={formUser !== undefined}
        user={formUser ?? null}
        onClose={() => setFormUser(undefined)}
      />
      <PasswordModal
        open={passwordUser !== null}
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
      />
    </div>
  );
}
