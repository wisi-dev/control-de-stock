import type { CreateProductInput, PaginatedData, Product, UpdateProductInput } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  status?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function fetchProducts(params: ProductListParams): Promise<PaginatedData<Product>> {
  const { data } = await apiClient.get('/products', { params });
  return data.data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await apiClient.post('/products', input);
  return data.data;
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const { data } = await apiClient.put(`/products/${id}`, input);
  return data.data;
}

export interface ImportProductsResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export async function importProductsCsv(file: File): Promise<ImportProductsResult> {
  const csv = await file.text();
  const { data } = await apiClient.post('/products/import', { csv });
  return data.data;
}

export async function downloadProductsCsv(): Promise<void> {
  const response = await apiClient.get('/products/export', { responseType: 'blob' });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'productos.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
