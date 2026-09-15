import type { Request, Response } from 'express';
import { loginSchema } from '@control-stock/shared';
import * as authService from './auth.service.js';

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input, { ip: req.ip });
  res.json({ success: true, data: result });
}

export async function me(req: Request, res: Response) {
  res.json({ success: true, data: req.user });
}
