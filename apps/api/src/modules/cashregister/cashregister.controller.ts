import type { Request, Response } from 'express';
import { closeCashRegisterSchema, createCashMovementSchema, openCashRegisterSchema } from '@control-stock/shared';
import * as cashRegisterService from './cashregister.service.js';

export async function getCurrent(_req: Request, res: Response) {
  res.json({ success: true, data: await cashRegisterService.getCurrent() });
}

export async function history(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  res.json({ success: true, data: await cashRegisterService.history(page, pageSize) });
}

export async function open(req: Request, res: Response) {
  const input = openCashRegisterSchema.parse(req.body);
  const register = await cashRegisterService.open(input, req.user!.id);
  res.status(201).json({ success: true, data: register });
}

export async function close(req: Request, res: Response) {
  const input = closeCashRegisterSchema.parse(req.body);
  const register = await cashRegisterService.close(req.params.id!, input, req.user!.id);
  res.json({ success: true, data: register });
}

export async function addMovement(req: Request, res: Response) {
  const input = createCashMovementSchema.parse(req.body);
  const register = await cashRegisterService.addMovement(req.params.id!, input, req.user!.id);
  res.status(201).json({ success: true, data: register });
}
