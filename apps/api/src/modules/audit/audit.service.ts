import { Prisma } from '@prisma/client';
import type { AuditLogQuery } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';

export async function list(query: AuditLogQuery) {
  const where: Prisma.AuditLogWhereInput = {
    ...(query.entity ? { entity: query.entity } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** Para poblar los filtros del frontend con valores realmente usados. */
export async function distinctEntitiesAndActions() {
  const rows = await prisma.auditLog.findMany({ select: { entity: true, action: true }, distinct: ['entity', 'action'] });
  const entities = [...new Set(rows.map((r) => r.entity))].sort();
  const actions = [...new Set(rows.map((r) => r.action))].sort();
  return { entities, actions };
}
