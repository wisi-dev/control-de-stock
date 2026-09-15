import type { PaginatedData } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  user?: { id: string; name: string; email: string } | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  entity?: string;
  action?: string;
  userId?: string;
}

export async function fetchAuditLog(params: AuditLogParams): Promise<PaginatedData<AuditLogEntry>> {
  const { data } = await apiClient.get('/audit', { params });
  return data.data;
}

export async function fetchAuditFilters(): Promise<{ entities: string[]; actions: string[] }> {
  const { data } = await apiClient.get('/audit/filters');
  return data.data;
}
