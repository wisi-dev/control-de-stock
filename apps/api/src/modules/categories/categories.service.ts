import type { CreateCategoryInput, UpdateCategoryInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

export async function list() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function create(input: CreateCategoryInput, actorId: string) {
  const existing = await prisma.category.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError('Ya existe una categoría con ese nombre');

  const category = await prisma.category.create({ data: input });
  await logAudit({ userId: actorId, action: 'CATEGORY_CREATED', entity: 'Category', entityId: category.id, metadata: input });
  return category;
}

export async function update(id: string, input: UpdateCategoryInput, actorId: string) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Categoría');

  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.category.findUnique({ where: { name: input.name } });
    if (duplicate) throw new ConflictError('Ya existe una categoría con ese nombre');
  }

  const category = await prisma.category.update({ where: { id }, data: input });
  await logAudit({ userId: actorId, action: 'CATEGORY_UPDATED', entity: 'Category', entityId: id, metadata: input });
  return category;
}
