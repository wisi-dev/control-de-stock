import type { Request, Response } from 'express';
import { createCustomerSchema, updateCustomerSchema } from '@control-stock/shared';
import * as customersService from './customers.service.js';

export async function list(_req: Request, res: Response) {
  res.json({ success: true, data: await customersService.list() });
}

export async function getById(req: Request, res: Response) {
  const customer = await customersService.getById(req.params.id!);
  res.json({ success: true, data: customer });
}

export async function create(req: Request, res: Response) {
  const input = createCustomerSchema.parse(req.body);
  const customer = await customersService.create(input, req.user!.id);
  res.status(201).json({ success: true, data: customer });
}

export async function update(req: Request, res: Response) {
  const input = updateCustomerSchema.parse(req.body);
  const customer = await customersService.update(req.params.id!, input, req.user!.id);
  res.json({ success: true, data: customer });
}
