import { SaleStatus } from '@prisma/client';
import type { CreateCustomerInput, UpdateCustomerInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

export async function list() {
  return prisma.customer.findMany({ orderBy: { lastName: 'asc' } });
}

export async function getById(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new NotFoundError('Cliente');

  const sales = await prisma.sale.findMany({
    where: { customerId: id, status: SaleStatus.COMPLETADA },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalPurchased = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const lastPurchaseAt = sales[0]?.createdAt ?? null;

  return { ...customer, totalPurchased, lastPurchaseAt, purchaseCount: sales.length };
}

export async function create(input: CreateCustomerInput, actorId: string) {
  const customer = await prisma.customer.create({ data: input });
  await logAudit({
    userId: actorId,
    action: 'CUSTOMER_CREATED',
    entity: 'Customer',
    entityId: customer.id,
    metadata: { name: `${customer.firstName} ${customer.lastName}` },
  });
  return customer;
}

export async function update(id: string, input: UpdateCustomerInput, actorId: string) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Cliente');

  const customer = await prisma.customer.update({ where: { id }, data: input });
  await logAudit({ userId: actorId, action: 'CUSTOMER_UPDATED', entity: 'Customer', entityId: id, metadata: input });
  return customer;
}
