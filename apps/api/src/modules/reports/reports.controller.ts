import type { Request, Response } from 'express';
import { reportDateRangeQuerySchema, salesByPeriodQuerySchema, topProductsQuerySchema } from '@control-stock/shared';
import * as reportsService from './reports.service.js';

export async function dashboard(_req: Request, res: Response) {
  res.json({ success: true, data: await reportsService.dashboardSummary() });
}

export async function salesByPeriod(req: Request, res: Response) {
  const query = salesByPeriodQuerySchema.parse(req.query);
  res.json({ success: true, data: await reportsService.salesByPeriod(query) });
}

export async function salesByPeriodExport(req: Request, res: Response) {
  const query = salesByPeriodQuerySchema.parse(req.query);
  const csv = await reportsService.salesByPeriodCsv(query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ventas_por_periodo.csv"');
  res.send(csv);
}

export async function topProducts(req: Request, res: Response) {
  const query = topProductsQuerySchema.parse(req.query);
  res.json({ success: true, data: await reportsService.topProducts(query) });
}

export async function topProductsExport(req: Request, res: Response) {
  const query = topProductsQuerySchema.parse(req.query);
  const csv = await reportsService.topProductsCsv(query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="productos_mas_vendidos.csv"');
  res.send(csv);
}

export async function purchasesBySupplier(req: Request, res: Response) {
  const query = reportDateRangeQuerySchema.parse(req.query);
  res.json({ success: true, data: await reportsService.purchasesBySupplier(query.from, query.to) });
}

export async function profit(req: Request, res: Response) {
  const query = reportDateRangeQuerySchema.parse(req.query);
  res.json({ success: true, data: await reportsService.estimatedProfit(query.from, query.to) });
}

export async function paymentMethods(req: Request, res: Response) {
  const query = reportDateRangeQuerySchema.parse(req.query);
  res.json({ success: true, data: await reportsService.salesByPaymentMethod(query.from, query.to) });
}
