import type { PermissionModule, Role } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await apiClient.get('/roles');
  return data.data;
}

export async function fetchPermissionCatalog(): Promise<PermissionModule[]> {
  const { data } = await apiClient.get('/roles/permissions/catalog');
  return data.data;
}

export async function updateRolePermissions(roleId: string, permissionKeys: string[]): Promise<Role[]> {
  const { data } = await apiClient.put(`/roles/${roleId}/permissions`, { permissionKeys });
  return data.data;
}
