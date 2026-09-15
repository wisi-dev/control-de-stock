import type { Request, Response } from 'express';
import { createSupplierSchema, updateSupplierSchema } from '@control-stock/shared';
import * as suppliersService from './suppliers.service.js';

export async function list(_req: Request, res: Response) {
  res.json({ success: true, data: await suppliersService.list() });
}

export async function getById(req: Request, res: Response) {
  const supplier = await suppliersService.getById(req.params.id!);
  res.json({ success: true, data: supplier });
}

export async function create(req: Request, res: Response) {
  const input = createSupplierSchema.parse(req.body);
  const supplier = await suppliersService.create(input, req.user!.id);
  res.status(201).json({ success: true, data: supplier });
}

export async function update(req: Request, res: Response) {
  const input = updateSupplierSchema.parse(req.body);
  const supplier = await suppliersService.update(req.params.id!, input, req.user!.id);
  res.json({ success: true, data: supplier });
}
