import { MovementType, Prisma } from '@prisma/client';
import { POSITIVE_MOVEMENTS } from '@control-stock/shared';
import type { CreateMovementInput, MovementListQuery } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { BusinessRuleError, NotFoundError, ValidationError } from '../../common/errors/AppError.js';
import { logAudit } from '../../common/utils/audit.js';
import { serializeProduct } from '../products/products.service.js';

/**
 * COMPRA y VENTA los genera automáticamente el módulo de Compras/Ventas
 * (Fases 5 y 6) al confirmar una operación — acá solo se permiten los tipos
 * que un usuario puede registrar a mano.
 */
const MANUAL_TYPES = new Set<MovementType>([
  MovementType.ENTRADA,
  MovementType.SALIDA,
  MovementType.AJUSTE_POSITIVO,
  MovementType.AJUSTE_NEGATIVO,
  MovementType.DEVOLUCION,
  MovementType.CORRECCION,
]);

const movementInclude = {
  product: { select: { id: true, sku: true, name: true, unit: true } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.InventoryMovementInclude;

export async function listMovements(query: MovementListQuery) {
  const where: Prisma.InventoryMovementWhereInput = {
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.type ? { type: query.type } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: movementInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/**
 * Registra un movimiento y actualiza `Product.currentStock` en la misma
 * transacción — el stock nunca se escribe fuera de acá (sección 6 del brief).
 */
export async function createMovement(input: CreateMovementInput, actorId: string) {
  if (!MANUAL_TYPES.has(input.type)) {
    throw new ValidationError('Este tipo de movimiento se genera automáticamente y no se puede crear a mano');
  }

  const movement = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new NotFoundError('Producto');

    const isPositive = (POSITIVE_MOVEMENTS as string[]).includes(input.type);
    const delta = isPositive ? input.quantity : -input.quantity;
    const resultingStock = product.currentStock + delta;

    if (resultingStock < 0) {
      const config = await tx.businessConfig.findFirst();
      if (!config?.allowNegativeStock) {
        throw new BusinessRuleError(
          `No hay suficiente stock de "${product.name}" (actual: ${product.currentStock}) para este movimiento`,
        );
      }
    }

    const created = await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        type: input.type,
        quantity: input.quantity,
        previousStock: product.currentStock,
        resultingStock,
        reason: input.reason,
        userId: actorId,
      },
      include: movementInclude,
    });

    await tx.product.update({ where: { id: product.id }, data: { currentStock: resultingStock } });

    return created;
  });

  await logAudit({
    userId: actorId,
    action: 'INVENTORY_MOVEMENT_CREATED',
    entity: 'InventoryMovement',
    entityId: movement.id,
    metadata: { productId: movement.productId, type: movement.type, quantity: movement.quantity },
  });

  return movement;
}

const STALE_DAYS = 60;

export async function getAlerts() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVO' },
    include: { category: true, brand: true, supplier: true },
  });

  const lowStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStock = products.filter((p) => p.currentStock === 0);

  const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const lastMovements = await prisma.inventoryMovement.groupBy({ by: ['productId'], _max: { createdAt: true } });
  const lastMovementMap = new Map(lastMovements.map((m) => [m.productId, m._max.createdAt]));

  const staleProducts = products.filter((p) => {
    if (p.currentStock <= 0) return false;
    const last = lastMovementMap.get(p.id);
    return !last || last < staleThreshold;
  });

  return {
    lowStock: lowStock.map(serializeProduct),
    outOfStock: outOfStock.map(serializeProduct),
    staleProducts: staleProducts.map(serializeProduct),
    staleDays: STALE_DAYS,
  };
}
