import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils.js';
import { usePermission } from '../hooks/usePermission.js';
import { UsersTab } from '../features/users/UsersTab.js';
import { RolesTab } from '../features/users/RolesTab.js';

const tabs = [
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'roles', label: 'Roles y permisos' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export function UsersPage() {
  const [tab, setTab] = useState<TabKey>('usuarios');
  const canManageUsers = usePermission('users:*');

  if (!canManageUsers) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Usuarios y roles</h1>
        <p className="text-sm text-ink-muted">
          Administrá quién puede acceder al sistema y qué puede hacer cada rol.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' ? <UsersTab /> : <RolesTab />}
    </div>
  );
}
