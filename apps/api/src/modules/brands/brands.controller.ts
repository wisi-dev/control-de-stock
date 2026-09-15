import type { Request, Response } from 'express';
import { createBrandSchema, updateBrandSchema } from '@control-stock/shared';
import * as brandsService from './brands.service.js';

export async function list(_req: Request, res: Response) {
  res.json({ success: true, data: await brandsService.list() });
}

export async function create(req: Request, res: Response) {
  const input = createBrandSchema.parse(req.body);
  const brand = await brandsService.create(input, req.user!.id);
  res.status(201).json({ success: true, data: brand });
}

export async function update(req: Request, res: Response) {
  const input = updateBrandSchema.parse(req.body);
  const brand = await brandsService.update(req.params.id!, input, req.user!.id);
  res.json({ success: true, data: brand });
}
