import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get('/categories');
  return data.data;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data } = await apiClient.post('/categories', input);
  return data.data;
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const { data } = await apiClient.put(`/categories/${id}`, input);
  return data.data;
}
