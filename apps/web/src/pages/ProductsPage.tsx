import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils.js';
import { usePermission } from '../hooks/usePermission.js';
import { ProductsTab } from '../features/products/ProductsTab.js';
import { CategoriesTab } from '../features/products/CategoriesTab.js';
import { BrandsTab } from '../features/products/BrandsTab.js';

const tabs = [
  { key: 'productos', label: 'Productos' },
  { key: 'categorias', label: 'Categorías' },
  { key: 'marcas', label: 'Marcas' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export function ProductsPage() {
  const [tab, setTab] = useState<TabKey>('productos');
  const canView = usePermission('products:read');

  if (!canView) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Productos</h1>
        <p className="text-sm text-ink-muted">Catálogo, categorías y marcas.</p>
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

      {tab === 'productos' && <ProductsTab />}
      {tab === 'categorias' && <CategoriesTab />}
      {tab === 'marcas' && <BrandsTab />}
    </div>
  );
}
