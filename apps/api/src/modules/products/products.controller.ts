import type { Request, Response } from 'express';
import { z } from 'zod';
import { createProductSchema, productListQuerySchema, updateProductSchema } from '@control-stock/shared';
import { ValidationError } from '../../common/errors/AppError.js';
import * as productsService from './products.service.js';

export async function list(req: Request, res: Response) {
  const query = productListQuerySchema.parse(req.query);
  const result = await productsService.list(query);
  res.json({ success: true, data: result });
}

export async function getById(req: Request, res: Response) {
  const product = await productsService.getById(req.params.id!);
  res.json({ success: true, data: product });
}

export async function create(req: Request, res: Response) {
  const input = createProductSchema.parse(req.body);
  const product = await productsService.create(input, req.user!.id);
  res.status(201).json({ success: true, data: product });
}

export async function update(req: Request, res: Response) {
  const input = updateProductSchema.parse(req.body);
  const product = await productsService.update(req.params.id!, input, req.user!.id);
  res.json({ success: true, data: product });
}

export async function exportCsv(_req: Request, res: Response) {
  const csv = await productsService.exportCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="productos.csv"');
  res.send(csv);
}

const importSchema = z.object({ csv: z.string().min(1, 'El archivo está vacío') });

export async function importCsv(req: Request, res: Response) {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('El archivo CSV es inválido');

  const result = await productsService.importCsv(parsed.data.csv, req.user!.id);
  res.json({ success: true, data: result });
}
