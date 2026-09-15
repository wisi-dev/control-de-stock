import { beforeEach, describe, expect, it } from 'vitest';
import { MovementType } from '@prisma/client';
import { BusinessRuleError, ValidationError } from '../../common/errors/AppError.js';
import { createAdminUser, createProduct, ensureBusinessConfig, resetDb } from '../../test/helpers.js';
import * as inventoryService from './inventory.service.js';

describe('inventory.service', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('ENTRADA suma stock y deja registro de previousStock/resultingStock', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct({ currentStock: 10 });

    const movement = await inventoryService.createMovement(
      { productId: product.id, type: MovementType.ENTRADA, quantity: 5 },
      user.id,
    );

    expect(movement.previousStock).toBe(10);
    expect(movement.resultingStock).toBe(15);

    const updated = await inventoryService.listMovements({ page: 1, pageSize: 10, productId: product.id });
    expect(updated.items[0]!.resultingStock).toBe(15);
  });

  it('SALIDA resta stock', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct({ currentStock: 10 });

    const movement = await inventoryService.createMovement(
      { productId: product.id, type: MovementType.SALIDA, quantity: 3 },
      user.id,
    );

    expect(movement.resultingStock).toBe(7);
  });

  it('rechaza dejar el stock en negativo si el negocio no lo permite', async () => {
    const { user } = await createAdminUser();
    await ensureBusinessConfig({ allowNegativeStock: false });
    const product = await createProduct({ currentStock: 5 });

    await expect(
      inventoryService.createMovement({ productId: product.id, type: MovementType.SALIDA, quantity: 10 }, user.id),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('permite dejar el stock en negativo si el negocio lo permite explícitamente', async () => {
    const { user } = await createAdminUser();
    await ensureBusinessConfig({ allowNegativeStock: true });
    const product = await createProduct({ currentStock: 5 });

    const movement = await inventoryService.createMovement(
      { productId: product.id, type: MovementType.SALIDA, quantity: 10 },
      user.id,
    );

    expect(movement.resultingStock).toBe(-5);
  });

  it('rechaza crear a mano un movimiento de tipo COMPRA o VENTA (son automáticos)', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct();

    await expect(
      inventoryService.createMovement({ productId: product.id, type: MovementType.VENTA, quantity: 1 }, user.id),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
