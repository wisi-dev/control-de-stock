import type { Request, Response } from 'express';
import { createSaleSchema, saleListQuerySchema } from '@control-stock/shared';
import * as salesService from './sales.service.js';

export async function list(req: Request, res: Response) {
  const query = saleListQuerySchema.parse(req.query);
  res.json({ success: true, data: await salesService.list(query) });
}

export async function getById(req: Request, res: Response) {
  const sale = await salesService.getById(req.params.id!);
  res.json({ success: true, data: sale });
}

export async function create(req: Request, res: Response) {
  const input = createSaleSchema.parse(req.body);
  const sale = await salesService.create(input, req.user!.id);
  res.status(201).json({ success: true, data: sale });
}

export async function cancel(req: Request, res: Response) {
  const sale = await salesService.cancel(req.params.id!, req.user!.id);
  res.json({ success: true, data: sale });
}
