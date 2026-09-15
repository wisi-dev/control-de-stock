import { beforeEach, describe, expect, it } from 'vitest';
import { BusinessRuleError } from '../../common/errors/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { createAdminUser, createProduct, createSupplier, resetDb } from '../../test/helpers.js';
import * as purchasesService from './purchases.service.js';

describe('purchases.service', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('crear una compra no modifica el stock todavía (queda PENDIENTE)', async () => {
    const { user } = await createAdminUser();
    const supplier = await createSupplier();
    const product = await createProduct({ currentStock: 10 });

    const purchase = await purchasesService.create(
      { supplierId: supplier.id, discount: 0, tax: 0, items: [{ productId: product.id, quantity: 5, unitPrice: 100 }] },
      user.id,
    );

    expect(purchase.status).toBe('PENDIENTE');
    const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(unchanged.currentStock).toBe(10);
  });

  it('recibir una compra de 5 unidades sobre un stock de 10 lo deja en 15 (ejemplo del brief)', async () => {
    const { user } = await createAdminUser();
    const supplier = await createSupplier();
    const product = await createProduct({ currentStock: 10 });

    const purchase = await purchasesService.create(
      { supplierId: supplier.id, discount: 0, tax: 0, items: [{ productId: product.id, quantity: 5, unitPrice: 100 }] },
      user.id,
    );
    await purchasesService.receive(purchase.id, user.id);

    const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.currentStock).toBe(15);
  });

  it('calcula el total como subtotal - descuento + impuesto', async () => {
    const { user } = await createAdminUser();
    const supplier = await createSupplier();
    const product = await createProduct();

    const purchase = await purchasesService.create(
      {
        supplierId: supplier.id,
        discount: 50,
        tax: 25,
        items: [{ productId: product.id, quantity: 3, unitPrice: 100 }],
      },
      user.id,
    );

    expect(purchase.subtotal).toBe(300);
    expect(purchase.total).toBe(275); // 300 - 50 + 25
  });

  it('no permite recibir dos veces la misma compra', async () => {
    const { user } = await createAdminUser();
    const supplier = await createSupplier();
    const product = await createProduct();

    const purchase = await purchasesService.create(
      { supplierId: supplier.id, discount: 0, tax: 0, items: [{ productId: product.id, quantity: 1, unitPrice: 10 }] },
      user.id,
    );
    await purchasesService.receive(purchase.id, user.id);

    await expect(purchasesService.receive(purchase.id, user.id)).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('no permite recibir una compra cancelada', async () => {
    const { user } = await createAdminUser();
    const supplier = await createSupplier();
    const product = await createProduct();

    const purchase = await purchasesService.create(
      { supplierId: supplier.id, discount: 0, tax: 0, items: [{ productId: product.id, quantity: 1, unitPrice: 10 }] },
      user.id,
    );
    await purchasesService.cancel(purchase.id, user.id);

    await expect(purchasesService.receive(purchase.id, user.id)).rejects.toBeInstanceOf(BusinessRuleError);
  });
});
