import type { Request, Response } from 'express';
import { auditLogQuerySchema } from '@control-stock/shared';
import * as auditService from './audit.service.js';

export async function list(req: Request, res: Response) {
  const query = auditLogQuerySchema.parse(req.query);
  res.json({ success: true, data: await auditService.list(query) });
}

export async function filters(_req: Request, res: Response) {
  res.json({ success: true, data: await auditService.distinctEntitiesAndActions() });
}
