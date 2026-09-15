import type { Request, Response } from 'express';
import { createMovementSchema, movementListQuerySchema } from '@control-stock/shared';
import * as inventoryService from './inventory.service.js';

export async function listMovements(req: Request, res: Response) {
  const query = movementListQuerySchema.parse(req.query);
  res.json({ success: true, data: await inventoryService.listMovements(query) });
}

export async function createMovement(req: Request, res: Response) {
  const input = createMovementSchema.parse(req.body);
  const movement = await inventoryService.createMovement(input, req.user!.id);
  res.status(201).json({ success: true, data: movement });
}

export async function getAlerts(_req: Request, res: Response) {
  res.json({ success: true, data: await inventoryService.getAlerts() });
}

export async function exportMovements(req: Request, res: Response) {
  const query = movementListQuerySchema.parse(req.query);
  const csv = await inventoryService.exportMovementsCsv(query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="movimientos_inventario.csv"');
  res.send(csv);
}
