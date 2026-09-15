import type { CreateSaleInput, PaginatedData, PaymentMethod, SaleStatus } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export interface SaleItem {
  id: string;
  productId: string;
  product?: { id: string; sku: string; name: string; unit: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  customerId: string | null;
  customer?: { id: string; firstName: string; lastName: string } | null;
  userId: string;
  user?: { id: string; name: string };
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleListParams {
  page?: number;
  pageSize?: number;
  customerId?: string;
  status?: string;
}

export async function fetchSales(params: SaleListParams): Promise<PaginatedData<Sale>> {
  const { data } = await apiClient.get('/sales', { params });
  return data.data;
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const { data } = await apiClient.post('/sales', input);
  return data.data;
}

export async function cancelSale(id: string): Promise<Sale> {
  const { data } = await apiClient.put(`/sales/${id}/cancel`);
  return data.data;
}
