import type { NextFunction, Request, Response } from 'express';
import { hasPermission } from '@control-stock/shared';
import { verifyToken } from '../../lib/jwt.js';
import { prisma } from '../../lib/prisma.js';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Verifica el JWT y carga el usuario (con rol y permisos) desde la base de
 * datos en cada request — no solo se confía en el payload del token, así un
 * usuario desactivado o con el rol cambiado pierde acceso de inmediato, sin
 * esperar a que expire el token.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  let payload;
  try {
    payload = verifyToken(header.slice('Bearer '.length));
  } catch {
    return next(new UnauthorizedError('Sesión inválida o expirada'));
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  if (!user || !user.active) {
    return next(new UnauthorizedError('Sesión inválida o expirada'));
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
  };
  next();
}

/** Debe usarse después de `authenticate`. */
export function authorize(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!hasPermission(req.user.permissions, permission)) {
      return next(new ForbiddenError());
    }
    next();
  };
}
