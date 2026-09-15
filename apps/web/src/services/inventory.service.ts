import type { CreateMovementInput, InventoryMovement, PaginatedData, Product } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export interface MovementListParams {
  page?: number;
  pageSize?: number;
  productId?: string;
  type?: string;
}

export async function fetchMovements(params: MovementListParams): Promise<PaginatedData<InventoryMovement>> {
  const { data } = await apiClient.get('/inventory/movements', { params });
  return data.data;
}

export async function createMovement(input: CreateMovementInput): Promise<InventoryMovement> {
  const { data } = await apiClient.post('/inventory/movements', input);
  return data.data;
}

export interface InventoryAlerts {
  lowStock: Product[];
  outOfStock: Product[];
  staleProducts: Product[];
  staleDays: number;
}

export async function fetchAlerts(): Promise<InventoryAlerts> {
  const { data } = await apiClient.get('/inventory/alerts');
  return data.data;
}
