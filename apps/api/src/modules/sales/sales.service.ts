import { CashMovementType, CashRegisterStatus, MovementType, PaymentMethod, Prisma, ReferenceType, SaleStatus } from '@prisma/client';
import type { CreateSaleInput, SaleListQuery } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { BusinessRuleError, NotFoundError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';

const include = {
  customer: true,
  user: { select: { id: true, name: true } },
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
} satisfies Prisma.SaleInclude;

type SaleWithRelations = Prisma.SaleGetPayload<{ include: typeof include }>;

/** Prisma serializa `Decimal` como string en JSON; convertimos todo a number. */
function serializeSale(sale: SaleWithRelations) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    tax: Number(sale.tax),
    total: Number(sale.total),
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  };
}

export async function list(query: SaleListQuery) {
  const where: Prisma.SaleWhereInput = {
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    items: items.map(serializeSale),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getById(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include });
  if (!sale) throw new NotFoundError('Venta');
  return serializeSale(sale);
}

/**
 * Confirma una venta: valida stock disponible, calcula todo en el servidor
 * (el precio SIEMPRE es `Product.salePrice` vigente, nunca el que mande el
 * cliente) y descuenta stock con su movimiento en la misma transacción.
 */
export async function create(input: CreateSaleInput, actorId: string) {
  if (input.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new NotFoundError('Cliente');
  }

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) throw new NotFoundError('Producto');
  const productMap = new Map(products.map((p) => [p.id, p]));

  const config = await prisma.businessConfig.findFirst();
  const allowNegativeStock = config?.allowNegativeStock ?? false;

  for (const item of input.items) {
    const product = productMap.get(item.productId)!;
    if (!allowNegativeStock && product.currentStock - item.quantity < 0) {
      throw new BusinessRuleError(
        `No hay suficiente stock de "${product.name}" (disponible: ${product.currentStock})`,
      );
    }
  }

  const itemsData = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.salePrice);
    return { productId: item.productId, quantity: item.quantity, unitPrice, subtotal: unitPrice * item.quantity };
  });
  const subtotal = itemsData.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Math.max(0, subtotal - input.discount + input.tax);

  // Si hay una caja abierta, la venta queda asociada (para reportes por método
  // de pago); solo las ventas en efectivo generan un movimiento de caja, ya
  // que son las únicas que cambian el efectivo físico en el cajón.
  const openRegister = await prisma.cashRegister.findFirst({ where: { status: CashRegisterStatus.ABIERTA } });

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        customerId: input.customerId ?? null,
        userId: actorId,
        cashRegisterId: openRegister?.id ?? null,
        status: SaleStatus.COMPLETADA,
        paymentMethod: input.paymentMethod,
        subtotal,
        discount: input.discount,
        tax: input.tax,
        total,
        items: { create: itemsData },
      },
      include,
    });

    if (openRegister && input.paymentMethod === PaymentMethod.EFECTIVO) {
      await tx.cashMovement.create({
        data: {
          cashRegisterId: openRegister.id,
          type: CashMovementType.VENTA,
          amount: total,
          description: `Venta #${created.id.slice(-8)}`,
          userId: actorId,
        },
      });
    }

    for (const item of itemsData) {
      const product = productMap.get(item.productId)!;
      const resultingStock = product.currentStock - item.quantity;

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: MovementType.VENTA,
          quantity: item.quantity,
          previousStock: product.currentStock,
          resultingStock,
          referenceType: ReferenceType.SALE,
          referenceId: created.id,
          userId: actorId,
        },
      });

      await tx.product.update({ where: { id: item.productId }, data: { currentStock: resultingStock } });
    }

    return created;
  });

  await logAudit({
    userId: actorId,
    action: 'SALE_CREATED',
    entity: 'Sale',
    entityId: sale.id,
    metadata: { total, customerId: input.customerId },
  });

  return serializeSale(sale);
}

/** Anular una venta devuelve el stock vendido (movimiento DEVOLUCION). */
export async function cancel(id: string, actorId: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
  if (!sale) throw new NotFoundError('Venta');
  if (sale.status !== SaleStatus.COMPLETADA) {
    throw new BusinessRuleError('Solo se pueden anular ventas completadas');
  }

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      const resultingStock = product.currentStock + item.quantity;

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: MovementType.DEVOLUCION,
          quantity: item.quantity,
          previousStock: product.currentStock,
          resultingStock,
          referenceType: ReferenceType.SALE,
          referenceId: sale.id,
          userId: actorId,
          reason: 'Anulación de venta',
        },
      });

      await tx.product.update({ where: { id: item.productId }, data: { currentStock: resultingStock } });
    }

    if (sale.cashRegisterId && sale.paymentMethod === PaymentMethod.EFECTIVO) {
      const register = await tx.cashRegister.findUnique({ where: { id: sale.cashRegisterId } });
      if (register?.status === CashRegisterStatus.ABIERTA) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId: sale.cashRegisterId,
            type: CashMovementType.EGRESO,
            amount: sale.total,
            description: `Anulación de venta #${sale.id.slice(-8)}`,
            userId: actorId,
          },
        });
      }
    }

    await tx.sale.update({ where: { id }, data: { status: SaleStatus.ANULADA } });
  });

  await logAudit({ userId: actorId, action: 'SALE_CANCELLED', entity: 'Sale', entityId: id });
  return getById(id);
}
