import bcrypt from 'bcryptjs';
import { RoleName } from '@control-stock/shared';
import { prisma } from '../lib/prisma.js';

/** Vacía todas las tablas de negocio — cada suite arranca de una base limpia. */
export async function resetDb() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.businessConfig.deleteMany();
}

export async function createRole(name: RoleName, permissionKeys: string[] = ['*']) {
  const role = await prisma.role.create({ data: { name } });
  for (const key of permissionKeys) {
    const permission = await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
    await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
  }
  return role;
}

export async function createUser(overrides: { roleId: string; email?: string; password?: string; active?: boolean }) {
  const email = overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const password = overrides.password ?? 'Password123!';
  const passwordHash = await bcrypt.hash(password, 4); // rounds bajos: los tests no necesitan seguridad, solo velocidad
  const user = await prisma.user.create({
    data: {
      name: 'Usuario de prueba',
      email,
      passwordHash,
      roleId: overrides.roleId,
      active: overrides.active ?? true,
    },
  });
  return { user, password };
}

export async function createAdminUser() {
  const role = await createRole(RoleName.ADMINISTRADOR, ['*']);
  const { user, password } = await createUser({ roleId: role.id });
  return { user, role, password };
}

export async function createProduct(overrides: Partial<Parameters<typeof prisma.product.create>[0]['data']> = {}) {
  return prisma.product.create({
    data: {
      sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'Producto de prueba',
      purchasePrice: 100,
      salePrice: 200,
      minStock: 5,
      currentStock: 10,
      unit: 'unidad',
      ...overrides,
    },
  });
}

export async function createSupplier(overrides: Partial<Parameters<typeof prisma.supplier.create>[0]['data']> = {}) {
  return prisma.supplier.create({ data: { businessName: 'Proveedor de prueba', ...overrides } });
}

export async function ensureBusinessConfig(overrides: { allowNegativeStock?: boolean } = {}) {
  const existing = await prisma.businessConfig.findFirst();
  if (existing) {
    return prisma.businessConfig.update({ where: { id: existing.id }, data: overrides });
  }
  return prisma.businessConfig.create({ data: { businessName: 'Negocio de prueba', ...overrides } });
}
