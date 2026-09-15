import bcrypt from 'bcryptjs';
import type { CreateUserInput, SetUserPasswordInput, UpdateUserInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

function serialize<T extends { passwordHash: string }>(user: T) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function list() {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'asc' },
  });
  return users.map(serialize);
}

export async function getById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) throw new NotFoundError('Usuario');
  return serialize(user);
}

async function assertRoleExists(roleId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new ValidationError('El rol seleccionado no existe', { roleId: 'Rol inválido' });
}

export async function create(input: CreateUserInput, actorId: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Ya existe un usuario con ese email');
  await assertRoleExists(input.roleId);

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, roleId: input.roleId },
    include: { role: true },
  });

  await logAudit({
    userId: actorId,
    action: 'USER_CREATED',
    entity: 'User',
    entityId: user.id,
    metadata: { email: user.email, roleId: user.roleId },
  });
  return serialize(user);
}

export async function update(id: string, input: UpdateUserInput, actorId: string) {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new NotFoundError('Usuario');

  if (input.active === false && id === actorId) {
    throw new ValidationError('No podés desactivar tu propio usuario');
  }

  if (input.email && input.email !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Ya existe un usuario con ese email');
  }

  if (input.roleId) {
    await assertRoleExists(input.roleId);
  }

  const user = await prisma.user.update({ where: { id }, data: input, include: { role: true } });
  await logAudit({ userId: actorId, action: 'USER_UPDATED', entity: 'User', entityId: id, metadata: input });
  return serialize(user);
}

export async function setPassword(id: string, input: SetUserPasswordInput, actorId: string) {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new NotFoundError('Usuario');

  if (actorId === id) {
    if (!input.currentPassword) {
      throw new ValidationError('Ingresá tu contraseña actual', { currentPassword: 'Obligatoria' });
    }
    const matches = await bcrypt.compare(input.currentPassword, target.passwordHash);
    if (!matches) throw new UnauthorizedError('La contraseña actual no es correcta');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  await logAudit({ userId: actorId, action: 'USER_PASSWORD_CHANGED', entity: 'User', entityId: id });
}
