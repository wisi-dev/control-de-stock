import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '@control-stock/shared';
import { apiClient } from './apiClient.js';

export interface CustomerDetail extends Customer {
  totalPurchased: number;
  lastPurchaseAt: string | null;
  purchaseCount: number;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await apiClient.get('/customers');
  return data.data;
}

export async function fetchCustomer(id: string): Promise<CustomerDetail> {
  const { data } = await apiClient.get(`/customers/${id}`);
  return data.data;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const { data } = await apiClient.post('/customers', input);
  return data.data;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const { data } = await apiClient.put(`/customers/${id}`, input);
  return data.data;
}
