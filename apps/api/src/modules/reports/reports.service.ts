import { PurchaseStatus, SaleStatus } from '@prisma/client';
import type { SalesByPeriodQuery, TopProductsQuery } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { toCsv } from '../../common/utils/csv.js';

/**
 * `from`/`to` llegan como "YYYY-MM-DD" (input type=date). Se parsean siempre
 * como UTC explícito — nunca con `setHours` sobre un Date ya parseado en UTC,
 * porque `setHours` muta en el timezone local del servidor y puede correr el
 * límite del día a otra fecha en UTC (y excluir ventas de ese mismo día).
 */
function resolveRange(from?: string, to?: string) {
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  const fromDate = from
    ? new Date(`${from}T00:00:00.000Z`)
    : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { fromDate, toDate };
}

function periodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);
  if (groupBy === 'month') return d.toISOString().slice(0, 7);
  if (groupBy === 'day') return d.toISOString().slice(0, 10);
  const isoDay = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - isoDay + 1);
  return d.toISOString().slice(0, 10);
}

export async function dashboardSummary() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [salesToday, salesMonth, pendingPurchases, recentSales, recentPurchases] = await Promise.all([
    prisma.sale.aggregate({ where: { status: SaleStatus.COMPLETADA, createdAt: { gte: startOfDay } }, _sum: { total: true } }),
    prisma.sale.aggregate({ where: { status: SaleStatus.COMPLETADA, createdAt: { gte: startOfMonth } }, _sum: { total: true } }),
    prisma.purchase.count({ where: { status: PurchaseStatus.PENDIENTE } }),
    prisma.sale.findMany({
      where: { status: SaleStatus.COMPLETADA },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, total: true, createdAt: true, paymentMethod: true, customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, total: true, createdAt: true, status: true, supplier: { select: { businessName: true } } },
    }),
  ]);

  return {
    salesToday: Number(salesToday._sum.total ?? 0),
    salesMonth: Number(salesMonth._sum.total ?? 0),
    pendingPurchases,
    recentSales: recentSales.map((s) => ({
      id: s.id,
      total: Number(s.total),
      createdAt: s.createdAt,
      paymentMethod: s.paymentMethod,
      customerName: s.customer ? `${s.customer.firstName} ${s.customer.lastName}` : null,
    })),
    recentPurchases: recentPurchases.map((p) => ({
      id: p.id,
      total: Number(p.total),
      createdAt: p.createdAt,
      status: p.status,
      supplierName: p.supplier.businessName,
    })),
  };
}

export async function salesByPeriod(query: SalesByPeriodQuery) {
  const { fromDate, toDate } = resolveRange(query.from, query.to);
  const sales = await prisma.sale.findMany({
    where: { status: SaleStatus.COMPLETADA, createdAt: { gte: fromDate, lte: toDate } },
    select: { total: true, createdAt: true },
  });

  const buckets = new Map<string, { total: number; count: number }>();
  for (const sale of sales) {
    const key = periodKey(sale.createdAt, query.groupBy);
    const bucket = buckets.get(key) ?? { total: 0, count: 0 };
    bucket.total += Number(sale.total);
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  const periods = [...buckets.entries()]
    .map(([period, v]) => ({ period, ...v }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return {
    periods,
    totalSum: periods.reduce((sum, p) => sum + p.total, 0),
    totalCount: periods.reduce((sum, p) => sum + p.count, 0),
  };
}

export async function salesByPeriodCsv(query: SalesByPeriodQuery) {
  const { periods } = await salesByPeriod(query);
  return toCsv([
    ['periodo', 'total', 'cantidad_ventas'],
    ...periods.map((p) => [p.period, p.total.toFixed(2), p.count]),
  ]);
}

export async function topProducts(query: TopProductsQuery) {
  const { fromDate, toDate } = resolveRange(query.from, query.to);
  const items = await prisma.saleItem.findMany({
    where: { sale: { status: SaleStatus.COMPLETADA, createdAt: { gte: fromDate, lte: toDate } } },
    select: { productId: true, quantity: true, subtotal: true, product: { select: { name: true, sku: true } } },
  });

  const map = new Map<string, { name: string; sku: string; quantitySold: number; totalRevenue: number }>();
  for (const item of items) {
    const entry = map.get(item.productId) ?? { name: item.product.name, sku: item.product.sku, quantitySold: 0, totalRevenue: 0 };
    entry.quantitySold += item.quantity;
    entry.totalRevenue += Number(item.subtotal);
    map.set(item.productId, entry);
  }

  const list = [...map.entries()].map(([productId, v]) => ({ productId, ...v }));
  list.sort((a, b) => (query.order === 'desc' ? b.quantitySold - a.quantitySold : a.quantitySold - b.quantitySold));
  return list.slice(0, query.limit);
}

export async function topProductsCsv(query: TopProductsQuery) {
  const list = await topProducts(query);
  return toCsv([
    ['sku', 'producto', 'cantidad_vendida', 'ingresos'],
    ...list.map((p) => [p.sku, p.name, p.quantitySold, p.totalRevenue.toFixed(2)]),
  ]);
}

export async function purchasesBySupplier(from?: string, to?: string) {
  const { fromDate, toDate } = resolveRange(from, to);
  const purchases = await prisma.purchase.findMany({
    where: { status: PurchaseStatus.RECIBIDA, createdAt: { gte: fromDate, lte: toDate } },
    select: { total: true, supplier: { select: { id: true, businessName: true } } },
  });

  const map = new Map<string, { businessName: string; total: number; count: number }>();
  for (const p of purchases) {
    const entry = map.get(p.supplier.id) ?? { businessName: p.supplier.businessName, total: 0, count: 0 };
    entry.total += Number(p.total);
    entry.count += 1;
    map.set(p.supplier.id, entry);
  }

  return [...map.entries()].map(([supplierId, v]) => ({ supplierId, ...v })).sort((a, b) => b.total - a.total);
}

export async function estimatedProfit(from?: string, to?: string) {
  const { fromDate, toDate } = resolveRange(from, to);
  const items = await prisma.saleItem.findMany({
    where: { sale: { status: SaleStatus.COMPLETADA, createdAt: { gte: fromDate, lte: toDate } } },
    select: { quantity: true, subtotal: true, product: { select: { purchasePrice: true } } },
  });

  let revenue = 0;
  let cost = 0;
  for (const item of items) {
    revenue += Number(item.subtotal);
    cost += Number(item.product.purchasePrice) * item.quantity;
  }

  return { revenue, cost, estimatedProfit: revenue - cost };
}

export async function salesByPaymentMethod(from?: string, to?: string) {
  const { fromDate, toDate } = resolveRange(from, to);
  const sales = await prisma.sale.findMany({
    where: { status: SaleStatus.COMPLETADA, createdAt: { gte: fromDate, lte: toDate } },
    select: { paymentMethod: true, total: true },
  });

  const map = new Map<string, { total: number; count: number }>();
  for (const s of sales) {
    const entry = map.get(s.paymentMethod) ?? { total: 0, count: 0 };
    entry.total += Number(s.total);
    entry.count += 1;
    map.set(s.paymentMethod, entry);
  }

  return [...map.entries()].map(([paymentMethod, v]) => ({ paymentMethod, ...v }));
}
