import type { CreateBrandInput, UpdateBrandInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

export async function list() {
  return prisma.brand.findMany({ orderBy: { name: 'asc' } });
}

export async function create(input: CreateBrandInput, actorId: string) {
  const existing = await prisma.brand.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError('Ya existe una marca con ese nombre');

  const brand = await prisma.brand.create({ data: input });
  await logAudit({ userId: actorId, action: 'BRAND_CREATED', entity: 'Brand', entityId: brand.id, metadata: input });
  return brand;
}

export async function update(id: string, input: UpdateBrandInput, actorId: string) {
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Marca');

  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.brand.findUnique({ where: { name: input.name } });
    if (duplicate) throw new ConflictError('Ya existe una marca con ese nombre');
  }

  const brand = await prisma.brand.update({ where: { id }, data: input });
  await logAudit({ userId: actorId, action: 'BRAND_UPDATED', entity: 'Brand', entityId: id, metadata: input });
  return brand;
}
