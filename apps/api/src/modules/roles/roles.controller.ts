import type { Request, Response } from 'express';
import { updateRolePermissionsSchema } from '@control-stock/shared';
import * as rolesService from './roles.service.js';

export async function list(_req: Request, res: Response) {
  const roles = await rolesService.list();
  res.json({ success: true, data: roles });
}

export async function catalog(_req: Request, res: Response) {
  res.json({ success: true, data: rolesService.catalog() });
}

export async function updatePermissions(req: Request, res: Response) {
  const { permissionKeys } = updateRolePermissionsSchema.parse(req.body);
  const roles = await rolesService.updatePermissions(req.params.id!, permissionKeys, req.user!.id);
  res.json({ success: true, data: roles });
}
