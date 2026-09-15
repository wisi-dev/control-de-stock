/**
 * Catálogo de módulos permisables y helper de verificación, compartido entre
 * el middleware de autorización del backend y el gating de UI en el frontend
 * (mismo criterio en los dos lados, ver sección 14/15 del brief).
 */

export interface PermissionModule {
  key: string;
  label: string;
}

export const PERMISSION_MODULES: PermissionModule[] = [
  { key: 'products', label: 'Productos' },
  { key: 'categories', label: 'Categorías' },
  { key: 'brands', label: 'Marcas' },
  { key: 'suppliers', label: 'Proveedores' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'purchases', label: 'Compras' },
  { key: 'sales', label: 'Ventas' },
  { key: 'customers', label: 'Clientes' },
  { key: 'cashregister', label: 'Caja' },
  { key: 'reports', label: 'Reportes' },
];

/**
 * `permissions` puede tener `'*'` (todo), `'<recurso>:*'` (todo sobre ese
 * recurso) o claves puntuales como `'reports:read'`. Se evalúa siempre en
 * backend antes de cualquier operación — el frontend solo lo usa para ocultar
 * acciones que el usuario no podría completar.
 */
export function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes('*')) return true;
  if (permissions.includes(required)) return true;
  const resource = required.split(':')[0];
  return permissions.includes(`${resource}:*`);
}
