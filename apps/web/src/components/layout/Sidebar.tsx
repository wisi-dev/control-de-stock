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
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils.js';

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

const bottomNavItems = [
  { to: '/usuarios', label: 'Usuarios y roles', icon: ShieldCheck },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-surface md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
          CS
        </div>
        <span className="text-sm font-semibold text-ink">Control de Stock</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-slate-100 px-3 py-4">
        {bottomNavItems.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon: Icon }: (typeof navItems)[number]) {
  return (
    <NavLink
      to={to}
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
