import type { CreateSupplierInput, UpdateSupplierInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

export async function list() {
  return prisma.supplier.findMany({ orderBy: { businessName: 'asc' } });
}

export async function getById(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw new NotFoundError('Proveedor');
  return supplier;
}

export async function create(input: CreateSupplierInput, actorId: string) {
  const supplier = await prisma.supplier.create({ data: input });
  await logAudit({
    userId: actorId,
    action: 'SUPPLIER_CREATED',
    entity: 'Supplier',
    entityId: supplier.id,
    metadata: { businessName: supplier.businessName },
  });
  return supplier;
}

export async function update(id: string, input: UpdateSupplierInput, actorId: string) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Proveedor');

  const supplier = await prisma.supplier.update({ where: { id }, data: input });
  await logAudit({ userId: actorId, action: 'SUPPLIER_UPDATED', entity: 'Supplier', entityId: id, metadata: input });
  return supplier;
}
