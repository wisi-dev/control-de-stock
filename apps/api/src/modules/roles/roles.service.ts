import { PERMISSION_MODULES, RoleName } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

export async function list() {
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: 'asc' },
  });
  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((rp) => rp.permission.key),
  }));
}

export function catalog() {
  return PERMISSION_MODULES;
}

export async function updatePermissions(id: string, permissionKeys: string[], actorId: string) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('Rol');
  if (role.name === RoleName.ADMINISTRADOR) {
    throw new ForbiddenError('El rol Administrador siempre tiene acceso total y no se puede modificar');
  }

  const uniqueKeys = [...new Set(permissionKeys)];

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    for (const key of uniqueKeys) {
      const permission = await tx.permission.upsert({ where: { key }, update: {}, create: { key } });
      await tx.rolePermission.create({ data: { roleId: id, permissionId: permission.id } });
    }
  });

  await logAudit({
    userId: actorId,
    action: 'ROLE_PERMISSIONS_UPDATED',
    entity: 'Role',
    entityId: id,
    metadata: { permissionKeys: uniqueKeys },
  });

  return list();
}
