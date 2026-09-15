import type { BusinessConfig, UpdateBusinessConfigInput } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export async function fetchSettings(): Promise<BusinessConfig> {
  const { data } = await apiClient.get('/settings');
  return data.data;
}

export async function updateSettings(input: UpdateBusinessConfigInput): Promise<BusinessConfig> {
  const { data } = await apiClient.put('/settings', input);
  return data.data;
}
