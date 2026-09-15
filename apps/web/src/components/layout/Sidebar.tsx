import {
  Boxes,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  BarChart3,
  Settings,
  ShieldCheck,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { hasPermission } from '@control-stock/shared';
import { cn } from '../../lib/utils.js';
import { useAuthStore } from '../../store/authStore.js';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/inventario', label: 'Inventario', icon: ArrowLeftRight },
  { to: '/compras', label: 'Compras', icon: Truck },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/proveedores', label: 'Proveedores', icon: Boxes },
  { to: '/caja', label: 'Caja', icon: Wallet },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
];

/** `permission` es la clave requerida para ver el ítem — solo el rol Administrador la tiene por defecto. */
const bottomNavItems = [
  { to: '/usuarios', label: 'Usuarios y roles', icon: ShieldCheck, permission: 'users:*' },
  { to: '/configuracion', label: 'Configuración', icon: Settings, permission: 'settings:*' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop: sidebar fija */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-surface md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile: drawer superpuesto con backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
                  CS
                </div>
                <span className="text-sm font-semibold text-ink">Control de Stock</span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Cerrar menú"
                className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  const visibleBottomItems = bottomNavItems.filter((item) => hasPermission(permissions, item.permission));

  return (
    <>
      <div className="hidden h-14 items-center gap-2 border-b border-slate-100 px-5 md:flex">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
          CS
        </div>
        <span className="text-sm font-semibold text-ink">Control de Stock</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={icon} onNavigate={onNavigate} />
        ))}
      </nav>

      {visibleBottomItems.length > 0 && (
        <div className="space-y-0.5 border-t border-slate-100 px-3 py-4">
          {visibleBottomItems.map(({ to, label, icon }) => (
            <SidebarLink key={to} to={to} label={label} icon={icon} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  onNavigate,
}: (typeof navItems)[number] & { onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-ink-muted hover:bg-slate-100 hover:text-ink',
        )
      }
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}
