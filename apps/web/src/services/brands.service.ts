import type { Brand, CreateBrandInput, UpdateBrandInput } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export async function fetchBrands(): Promise<Brand[]> {
  const { data } = await apiClient.get('/brands');
  return data.data;
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const { data } = await apiClient.post('/brands', input);
  return data.data;
}

export async function updateBrand(id: string, input: UpdateBrandInput): Promise<Brand> {
  const { data } = await apiClient.put(`/brands/${id}`, input);
  return data.data;
}
