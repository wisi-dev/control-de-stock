import type { Request, Response } from 'express';
import { createUserSchema, setUserPasswordSchema, updateUserSchema } from '@control-stock/shared';
import * as usersService from './users.service.js';

export async function list(_req: Request, res: Response) {
  const users = await usersService.list();
  res.json({ success: true, data: users });
}

export async function getById(req: Request, res: Response) {
  const user = await usersService.getById(req.params.id!);
  res.json({ success: true, data: user });
}

export async function create(req: Request, res: Response) {
  const input = createUserSchema.parse(req.body);
  const user = await usersService.create(input, req.user!.id);
  res.status(201).json({ success: true, data: user });
}

export async function update(req: Request, res: Response) {
  const input = updateUserSchema.parse(req.body);
  const user = await usersService.update(req.params.id!, input, req.user!.id);
  res.json({ success: true, data: user });
}

export async function setPassword(req: Request, res: Response) {
  const input = setUserPasswordSchema.parse(req.body);
  await usersService.setPassword(req.params.id!, input, req.user!.id);
  res.json({ success: true, data: { updated: true } });
}
