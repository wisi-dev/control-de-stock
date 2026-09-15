import { MovementType, Prisma, PurchaseStatus, ReferenceType } from '@prisma/client';
import type { CreatePurchaseInput, PurchaseListQuery } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { BusinessRuleError, NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

const include = {
  supplier: true,
  user: { select: { id: true, name: true } },
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
} satisfies Prisma.PurchaseInclude;

type PurchaseWithRelations = Prisma.PurchaseGetPayload<{ include: typeof include }>;

/** Prisma serializa `Decimal` como string en JSON; convertimos todo a number. */
function serializePurchase(purchase: PurchaseWithRelations) {
  return {
    ...purchase,
    subtotal: Number(purchase.subtotal),
    discount: Number(purchase.discount),
    tax: Number(purchase.tax),
    total: Number(purchase.total),
    items: purchase.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  };
}

export async function list(query: PurchaseListQuery) {
  const where: Prisma.PurchaseWhereInput = {
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.purchase.count({ where }),
  ]);

  return {
    items: items.map(serializePurchase),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getById(id: string) {
  const purchase = await prisma.purchase.findUnique({ where: { id }, include });
  if (!purchase) throw new NotFoundError('Compra');
  return serializePurchase(purchase);
}

export async function create(input: CreatePurchaseInput, actorId: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) throw new NotFoundError('Proveedor');

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) throw new NotFoundError('Producto');

  const itemsData = input.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.quantity * item.unitPrice,
  }));
  const subtotal = itemsData.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Math.max(0, subtotal - input.discount + input.tax);

  const purchase = await prisma.purchase.create({
    data: {
      supplierId: input.supplierId,
      userId: actorId,
      status: PurchaseStatus.PENDIENTE,
      subtotal,
      discount: input.discount,
      tax: input.tax,
      total,
      items: { create: itemsData },
    },
    include,
  });

  await logAudit({
    userId: actorId,
    action: 'PURCHASE_CREATED',
    entity: 'Purchase',
    entityId: purchase.id,
    metadata: { supplierId: input.supplierId, total },
  });

  return serializePurchase(purchase);
}

/** Recibir la compra: acá y solo acá se impacta el stock (sección 8 del brief). */
export async function receive(id: string, actorId: string) {
  const purchase = await prisma.purchase.findUnique({ where: { id }, include: { items: true } });
  if (!purchase) throw new NotFoundError('Compra');
  if (purchase.status !== PurchaseStatus.PENDIENTE) {
    throw new BusinessRuleError('Solo se pueden recibir compras pendientes');
  }

  await prisma.$transaction(async (tx) => {
    for (const item of purchase.items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      const resultingStock = product.currentStock + item.quantity;

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: MovementType.COMPRA,
          quantity: item.quantity,
          previousStock: product.currentStock,
          resultingStock,
          referenceType: ReferenceType.PURCHASE,
          referenceId: purchase.id,
          userId: actorId,
        },
      });

      await tx.product.update({ where: { id: item.productId }, data: { currentStock: resultingStock } });
    }

    await tx.purchase.update({ where: { id }, data: { status: PurchaseStatus.RECIBIDA } });
  });

  await logAudit({ userId: actorId, action: 'PURCHASE_RECEIVED', entity: 'Purchase', entityId: id });
  return getById(id);
}

export async function cancel(id: string, actorId: string) {
  const purchase = await prisma.purchase.findUnique({ where: { id } });
  if (!purchase) throw new NotFoundError('Compra');
  if (purchase.status !== PurchaseStatus.PENDIENTE) {
    throw new BusinessRuleError('Solo se pueden cancelar compras pendientes');
  }

  await prisma.purchase.update({ where: { id }, data: { status: PurchaseStatus.CANCELADA } });
  await logAudit({ userId: actorId, action: 'PURCHASE_CANCELLED', entity: 'Purchase', entityId: id });
  return getById(id);
}
