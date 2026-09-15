import { beforeEach, describe, expect, it } from 'vitest';
import { PaymentMethod } from '@prisma/client';
import { BusinessRuleError } from '../../common/errors/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { createAdminUser, createProduct, ensureBusinessConfig, resetDb } from '../../test/helpers.js';
import * as salesService from './sales.service.js';

describe('sales.service', () => {
  beforeEach(async () => {
    await resetDb();
    await ensureBusinessConfig({ allowNegativeStock: false });
  });

  it('vender 3 unidades de un stock de 10 deja el stock en 7 (ejemplo del brief)', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct({ currentStock: 10, salePrice: 200 });

    await salesService.create(
      { paymentMethod: PaymentMethod.EFECTIVO, discount: 0, tax: 0, items: [{ productId: product.id, quantity: 3 }] },
      user.id,
    );

    const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.currentStock).toBe(7);
  });

  it('calcula el total como cantidad × precio de venta del producto, no un precio mandado por el cliente', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct({ salePrice: 150, currentStock: 20 });

    const sale = await salesService.create(
      {
        paymentMethod: PaymentMethod.EFECTIVO,
        discount: 0,
        tax: 0,
        // @ts-expect-error — a propósito: el schema de venta no acepta unitPrice, pero
        // si alguien lo agregara a mano el service debe ignorarlo igual.
        items: [{ productId: product.id, quantity: 2, unitPrice: 1 }],
      },
      user.id,
    );

    expect(sale.total).toBe(300); // 2 * 150, nunca 2 * 1
  });

  it('aplica descuento e impuesto sobre el subtotal', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct({ salePrice: 100, currentStock: 20 });

    const sale = await salesService.create(
      { paymentMethod: PaymentMethod.EFECTIVO, discount: 20, tax: 10, items: [{ productId: product.id, quantity: 2 }] },
      user.id,
    );

    expect(sale.subtotal).toBe(200);
    expect(sale.total).toBe(190); // 200 - 20 + 10
  });

  it('rechaza vender más stock del disponible cuando no se permite stock negativo', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct({ currentStock: 2 });

    await expect(
      salesService.create(
        { paymentMethod: PaymentMethod.EFECTIVO, discount: 0, tax: 0, items: [{ productId: product.id, quantity: 5 }] },
        user.id,
      ),
    ).rejects.toBeInstanceOf(BusinessRuleError);

    const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(unchanged.currentStock).toBe(2); // no se tocó nada — todo o nada
  });

  it('anular una venta devuelve el stock vendido', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct({ currentStock: 10 });

    const sale = await salesService.create(
      { paymentMethod: PaymentMethod.EFECTIVO, discount: 0, tax: 0, items: [{ productId: product.id, quantity: 4 }] },
      user.id,
    );
    let updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.currentStock).toBe(6);

    await salesService.cancel(sale.id, user.id);
    updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.currentStock).toBe(10);
  });

  it('no permite anular dos veces la misma venta', async () => {
    const { user } = await createAdminUser();
    const product = await createProduct({ currentStock: 10 });

    const sale = await salesService.create(
      { paymentMethod: PaymentMethod.EFECTIVO, discount: 0, tax: 0, items: [{ productId: product.id, quantity: 1 }] },
      user.id,
    );

    await salesService.cancel(sale.id, user.id);
    await expect(salesService.cancel(sale.id, user.id)).rejects.toBeInstanceOf(BusinessRuleError);
  });
});
