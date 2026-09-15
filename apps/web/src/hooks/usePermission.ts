import { hasPermission } from '@control-stock/shared';
import { useAuthStore } from '../store/authStore.js';

/** Gating de UI únicamente — el backend vuelve a validar cada permiso en cada request. */
export function usePermission(required: string): boolean {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  return hasPermission(permissions, required);
}
