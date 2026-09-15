import type { CreateSupplierInput, Supplier, UpdateSupplierInput } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data } = await apiClient.get('/suppliers');
  return data.data;
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const { data } = await apiClient.post('/suppliers', input);
  return data.data;
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  const { data } = await apiClient.put(`/suppliers/${id}`, input);
  return data.data;
}
