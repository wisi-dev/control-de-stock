import bcrypt from 'bcryptjs';
import type { LoginInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { signToken } from '../../lib/jwt.js';
import { UnauthorizedError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

/**
 * Hash bcrypt de un valor aleatorio, usado solo para que `bcrypt.compare`
 * tarde lo mismo exista o no el email — evita que un atacante distinga
 * "email no existe" de "contraseña incorrecta" por tiempo de respuesta.
 */
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8kO6QAmZ9zTz6vaWFxa8xxDBUcXlmC';

export async function login(input: LoginInput, ctx: { ip?: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.active || !passwordMatches) {
    await logAudit({
      userId: user?.id,
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: user?.id,
      metadata: { email: input.email, ip: ctx.ip },
    });
    throw new UnauthorizedError('Email o contraseña incorrectos');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logAudit({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    entity: 'User',
    entityId: user.id,
    metadata: { ip: ctx.ip },
  });

  const permissions = user.role.permissions.map((rp) => rp.permission.key);
  const token = signToken({ sub: user.id, roleId: user.roleId, roleName: user.role.name });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions,
    },
  };
}
