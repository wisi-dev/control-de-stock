import { apiClient } from './apiClient.js';

export interface DashboardSummary {
  salesToday: number;
  salesMonth: number;
  pendingPurchases: number;
  recentSales: { id: string; total: number; createdAt: string; paymentMethod: string; customerName: string | null }[];
  recentPurchases: { id: string; total: number; createdAt: string; status: string; supplierName: string }[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get('/reports/dashboard');
  return data.data;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface SalesByPeriodResult {
  periods: { period: string; total: number; count: number }[];
  totalSum: number;
  totalCount: number;
}

export async function fetchSalesByPeriod(
  params: DateRangeParams & { groupBy: 'day' | 'week' | 'month' },
): Promise<SalesByPeriodResult> {
  const { data } = await apiClient.get('/reports/sales-by-period', { params });
  return data.data;
}

export function salesByPeriodExportUrl() {
  return '/reports/sales-by-period/export';
}

export interface TopProductRow {
  productId: string;
  name: string;
  sku: string;
  quantitySold: number;
  totalRevenue: number;
}

export async function fetchTopProducts(
  params: DateRangeParams & { order: 'asc' | 'desc'; limit: number },
): Promise<TopProductRow[]> {
  const { data } = await apiClient.get('/reports/top-products', { params });
  return data.data;
}

export interface SupplierPurchaseRow {
  supplierId: string;
  businessName: string;
  total: number;
  count: number;
}

export async function fetchPurchasesBySupplier(params: DateRangeParams): Promise<SupplierPurchaseRow[]> {
  const { data } = await apiClient.get('/reports/purchases-by-supplier', { params });
  return data.data;
}

export interface ProfitResult {
  revenue: number;
  cost: number;
  estimatedProfit: number;
}

export async function fetchEstimatedProfit(params: DateRangeParams): Promise<ProfitResult> {
  const { data } = await apiClient.get('/reports/profit', { params });
  return data.data;
}

export interface PaymentMethodRow {
  paymentMethod: string;
  total: number;
  count: number;
}

export async function fetchSalesByPaymentMethod(params: DateRangeParams): Promise<PaymentMethodRow[]> {
  const { data } = await apiClient.get('/reports/payment-methods', { params });
  return data.data;
}

async function downloadCsv(url: string, params: object, filename: string) {
  const response = await apiClient.get(url, { params, responseType: 'blob' });
  const blobUrl = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

export function downloadSalesByPeriodCsv(params: DateRangeParams & { groupBy: string }) {
  return downloadCsv('/reports/sales-by-period/export', params, 'ventas_por_periodo.csv');
}

export function downloadTopProductsCsv(params: DateRangeParams & { order: string; limit: number }) {
  return downloadCsv('/reports/top-products/export', params, 'productos_mas_vendidos.csv');
}

export function downloadInventoryMovementsCsv(params: { productId?: string; type?: string }) {
  return downloadCsv('/inventory/movements/export', params, 'movimientos_inventario.csv');
}
