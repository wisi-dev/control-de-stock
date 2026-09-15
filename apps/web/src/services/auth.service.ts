import type { LoginInput, SessionUser } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export interface LoginResult {
  token: string;
  user: SessionUser;
}

export async function loginRequest(input: LoginInput): Promise<LoginResult> {
  const { data } = await apiClient.post('/auth/login', input);
  return data.data;
}

export async function fetchMe(): Promise<SessionUser> {
  const { data } = await apiClient.get('/auth/me');
  return data.data;
}
