import type { CreateUserInput, SetUserPasswordInput, UpdateUserInput, UserWithRole } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export async function fetchUsers(): Promise<UserWithRole[]> {
  const { data } = await apiClient.get('/users');
  return data.data;
}

export async function createUser(input: CreateUserInput): Promise<UserWithRole> {
  const { data } = await apiClient.post('/users', input);
  return data.data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserWithRole> {
  const { data } = await apiClient.put(`/users/${id}`, input);
  return data.data;
}

export async function setUserPassword(id: string, input: SetUserPasswordInput): Promise<void> {
  await apiClient.put(`/users/${id}/password`, input);
}
