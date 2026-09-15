import type { Request, Response } from 'express';
import { createCategorySchema, updateCategorySchema } from '@control-stock/shared';
import * as categoriesService from './categories.service.js';

export async function list(_req: Request, res: Response) {
  res.json({ success: true, data: await categoriesService.list() });
}

export async function create(req: Request, res: Response) {
  const input = createCategorySchema.parse(req.body);
  const category = await categoriesService.create(input, req.user!.id);
  res.status(201).json({ success: true, data: category });
}

export async function update(req: Request, res: Response) {
  const input = updateCategorySchema.parse(req.body);
  const category = await categoriesService.update(req.params.id!, input, req.user!.id);
  res.json({ success: true, data: category });
}
