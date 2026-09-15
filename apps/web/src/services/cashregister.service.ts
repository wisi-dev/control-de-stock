import type {
  CloseCashRegisterInput,
  CreateCashMovementInput,
  OpenCashRegisterInput,
  PaginatedData,
} from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  type: 'INGRESO' | 'EGRESO' | 'VENTA';
  amount: number;
  description: string | null;
  userId: string;
  user?: { id: string; name: string };
  createdAt: string;
}

export interface CashRegister {
  id: string;
  userId: string;
  user?: { id: string; name: string };
  status: 'ABIERTA' | 'CERRADA';
  openingAmount: number;
  expectedAmount: number | null;
  closingAmount: number | null;
  difference: number | null;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  cashMovements: CashMovement[];
}

export async function fetchCurrentCashRegister(): Promise<CashRegister | null> {
  const { data } = await apiClient.get('/cashregister/current');
  return data.data;
}

export async function fetchCashRegisterHistory(page: number, pageSize = 20): Promise<PaginatedData<CashRegister>> {
  const { data } = await apiClient.get('/cashregister/history', { params: { page, pageSize } });
  return data.data;
}

export async function openCashRegister(input: OpenCashRegisterInput): Promise<CashRegister> {
  const { data } = await apiClient.post('/cashregister/open', input);
  return data.data;
}

export async function closeCashRegister(id: string, input: CloseCashRegisterInput): Promise<CashRegister> {
  const { data } = await apiClient.put(`/cashregister/${id}/close`, input);
  return data.data;
}

export async function addCashMovement(id: string, input: CreateCashMovementInput): Promise<CashRegister> {
  const { data } = await apiClient.post(`/cashregister/${id}/movements`, input);
  return data.data;
}
