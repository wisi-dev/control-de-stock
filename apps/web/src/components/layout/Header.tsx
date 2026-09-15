import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="Abrir menú"
        className="rounded-lg p-2 text-ink-muted hover:bg-slate-100 md:hidden"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-surface-subtle px-3 py-1.5 text-sm text-ink-subtle">
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Buscar productos, clientes, ventas...</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-ink-muted hover:bg-slate-100"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initial}
          </div>
          <div className="hidden text-sm leading-tight sm:block">
            <p className="font-medium text-ink">{user?.name ?? 'Usuario'}</p>
            <p className="text-ink-subtle">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="rounded-lg p-2 text-ink-muted hover:bg-slate-100"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
