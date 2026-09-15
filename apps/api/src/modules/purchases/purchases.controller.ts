import type { Request, Response } from 'express';
import { createPurchaseSchema, purchaseListQuerySchema } from '@control-stock/shared';
import * as purchasesService from './purchases.service.js';

export async function list(req: Request, res: Response) {
  const query = purchaseListQuerySchema.parse(req.query);
  res.json({ success: true, data: await purchasesService.list(query) });
}

export async function getById(req: Request, res: Response) {
  const purchase = await purchasesService.getById(req.params.id!);
  res.json({ success: true, data: purchase });
}

export async function create(req: Request, res: Response) {
  const input = createPurchaseSchema.parse(req.body);
  const purchase = await purchasesService.create(input, req.user!.id);
  res.status(201).json({ success: true, data: purchase });
}

export async function receive(req: Request, res: Response) {
  const purchase = await purchasesService.receive(req.params.id!, req.user!.id);
  res.json({ success: true, data: purchase });
}

export async function cancel(req: Request, res: Response) {
  const purchase = await purchasesService.cancel(req.params.id!, req.user!.id);
  res.json({ success: true, data: purchase });
}
