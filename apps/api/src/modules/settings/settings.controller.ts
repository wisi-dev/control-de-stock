import type { Request, Response } from 'express';
import { updateBusinessConfigSchema } from '@control-stock/shared';
import * as settingsService from './settings.service.js';

export async function get(_req: Request, res: Response) {
  const config = await settingsService.get();
  res.json({ success: true, data: config });
}

export async function update(req: Request, res: Response) {
  const input = updateBusinessConfigSchema.parse(req.body);
  const config = await settingsService.update(input, req.user!.id);
  res.json({ success: true, data: config });
}
