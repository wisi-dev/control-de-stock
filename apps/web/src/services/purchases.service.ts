import type { CreatePurchaseInput, PaginatedData } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export interface PurchaseItem {
  id: string;
  productId: string;
  product?: { id: string; sku: string; name: string; unit: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier?: { id: string; businessName: string };
  userId: string;
  user?: { id: string; name: string };
  status: 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseListParams {
  page?: number;
  pageSize?: number;
  supplierId?: string;
  status?: string;
}

export async function fetchPurchases(params: PurchaseListParams): Promise<PaginatedData<Purchase>> {
  const { data } = await apiClient.get('/purchases', { params });
  return data.data;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const { data } = await apiClient.post('/purchases', input);
  return data.data;
}

export async function receivePurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.put(`/purchases/${id}/receive`);
  return data.data;
}

export async function cancelPurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.put(`/purchases/${id}/cancel`);
  return data.data;
}
