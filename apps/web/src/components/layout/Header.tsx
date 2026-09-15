import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-surface px-6">
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-surface-subtle px-3 py-1.5 text-sm text-ink-subtle">
        <Search className="h-4 w-4" />
        <span>Buscar productos, clientes, ventas...</span>
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
            A
          </div>
          <div className="hidden text-sm leading-tight sm:block">
            <p className="font-medium text-ink">Administrador</p>
            <p className="text-ink-subtle">admin@controldestock.local</p>
          </div>
        </div>
      </div>
    </header>
  );
}
