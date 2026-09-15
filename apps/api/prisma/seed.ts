import { MovementType, PrismaClient, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_ROLE_PERMISSIONS, RoleName } from '@control-stock/shared';

/**
 * Roles, permisos, un usuario de ejemplo por rol (Fase 2) y catálogo demo de
 * categorías/marcas/proveedores/productos (Fase 3) para poder probar el
 * sistema con datos que parecen reales. El seed de ventas y compras de
 * ejemplo se agrega en las Fases 5 y 6.
 */
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando roles y permisos...');

  for (const roleName of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    const permissionKeys = DEFAULT_ROLE_PERMISSIONS[roleName];
    for (const key of permissionKeys) {
      const permission = await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('👤 Creando usuarios de ejemplo...');
  const demoUsers = [
    { name: 'Administrador', email: 'admin@controldestock.local', password: 'Admin123!', role: RoleName.ADMINISTRADOR },
    { name: 'Carla Encargada', email: 'encargado@controldestock.local', password: 'Encargado123!', role: RoleName.ENCARGADO },
    { name: 'Juan Vendedor', email: 'vendedor@controldestock.local', password: 'Vendedor123!', role: RoleName.VENDEDOR },
  ];

  for (const demoUser of demoUsers) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: demoUser.role } });
    const passwordHash = await bcrypt.hash(demoUser.password, 10);
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: { name: demoUser.name, email: demoUser.email, passwordHash, roleId: role.id },
    });
  }

  console.log('🏢 Creando configuración de negocio por defecto...');
  const existingConfig = await prisma.businessConfig.findFirst();
  if (!existingConfig) {
    await prisma.businessConfig.create({
      data: {
        businessName: 'Mi Negocio',
        currency: 'ARS',
        allowNegativeStock: false,
        defaultTaxRate: 21,
      },
    });
  }

  const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@controldestock.local' } });

  console.log('🗂️  Sembrando categorías y marcas...');
  const categoryNames = ['Bebidas', 'Almacén', 'Limpieza', 'Lácteos', 'Snacks'];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categories[name] = category.id;
  }

  const brandNames = ['Coca-Cola', 'Pepsi', 'Arcor', 'Sancor', 'Ala'];
  const brands: Record<string, string> = {};
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
    brands[name] = brand.id;
  }

  console.log('🚚 Sembrando proveedores...');
  const supplierData = [
    { businessName: 'Distribuidora Central S.A.', cuit: '30-11111111-1', phone: '011-4000-1111', contactName: 'Marcelo Ríos' },
    { businessName: 'Mayorista del Sur SRL', cuit: '30-22222222-2', phone: '011-4000-2222', contactName: 'Lucía Fernández' },
    { businessName: 'Proveedora Norte', cuit: '30-33333333-3', phone: '011-4000-3333', contactName: 'Diego Álvarez' },
  ];
  const suppliers: Record<string, string> = {};
  for (const data of supplierData) {
    const existing = await prisma.supplier.findFirst({ where: { businessName: data.businessName } });
    const supplier = existing ?? (await prisma.supplier.create({ data }));
    suppliers[data.businessName] = supplier.id;
  }

  console.log('📦 Sembrando productos...');
  const [central, sur, norte] = supplierData.map((s) => suppliers[s.businessName]!);
  const productData = [
    { sku: 'COCA-225', name: 'Coca-Cola 2.25L', category: 'Bebidas', brand: 'Coca-Cola', supplier: central, purchasePrice: 800, salePrice: 1400, minStock: 10, stock: 4, unit: 'unidad' },
    { sku: 'COCA-500', name: 'Coca-Cola 500ml', category: 'Bebidas', brand: 'Coca-Cola', supplier: central, purchasePrice: 400, salePrice: 750, minStock: 15, stock: 40, unit: 'unidad' },
    { sku: 'PEPSI-225', name: 'Pepsi 2.25L', category: 'Bebidas', brand: 'Pepsi', supplier: central, purchasePrice: 750, salePrice: 1300, minStock: 10, stock: 22, unit: 'unidad' },
    { sku: 'AGUA-500', name: 'Agua Mineral 500ml', category: 'Bebidas', brand: null, supplier: sur, purchasePrice: 150, salePrice: 350, minStock: 20, stock: 0, unit: 'unidad' },
    { sku: 'ALFA-ARCOR', name: 'Alfajor Arcor Triple', category: 'Snacks', brand: 'Arcor', supplier: sur, purchasePrice: 180, salePrice: 350, minStock: 30, stock: 60, unit: 'unidad' },
    { sku: 'GALLETITAS-ARCOR', name: 'Galletitas Arcor Surtidas', category: 'Snacks', brand: 'Arcor', supplier: sur, purchasePrice: 400, salePrice: 750, minStock: 20, stock: 30, unit: 'unidad' },
    { sku: 'CHOCOLATE-ARCOR', name: 'Chocolate Arcor 100g', category: 'Snacks', brand: 'Arcor', supplier: sur, purchasePrice: 300, salePrice: 550, minStock: 15, stock: 0, unit: 'unidad', status: ProductStatus.DESCONTINUADO },
    { sku: 'LECHE-SANCOR', name: 'Leche Entera Sancor 1L', category: 'Lácteos', brand: 'Sancor', supplier: norte, purchasePrice: 500, salePrice: 850, minStock: 20, stock: 8, unit: 'unidad' },
    { sku: 'YOGUR-SANCOR', name: 'Yogur Sancor Bebible 900ml', category: 'Lácteos', brand: 'Sancor', supplier: norte, purchasePrice: 700, salePrice: 1150, minStock: 10, stock: 15, unit: 'unidad' },
    { sku: 'QUESO-CREMOSO', name: 'Queso Cremoso', category: 'Lácteos', brand: null, supplier: norte, purchasePrice: 3500, salePrice: 5200, minStock: 5, stock: 3, unit: 'kg' },
    { sku: 'DETER-ALA', name: 'Detergente Ala 750ml', category: 'Limpieza', brand: 'Ala', supplier: sur, purchasePrice: 600, salePrice: 1050, minStock: 15, stock: 25, unit: 'unidad' },
    { sku: 'LAVANDINA-ALA', name: 'Lavandina Ala 1L', category: 'Limpieza', brand: 'Ala', supplier: sur, purchasePrice: 350, salePrice: 650, minStock: 20, stock: 0, unit: 'unidad' },
    { sku: 'JABON-POLVO', name: 'Jabón en Polvo 800g', category: 'Limpieza', brand: null, supplier: sur, purchasePrice: 900, salePrice: 1600, minStock: 10, stock: 18, unit: 'unidad' },
    { sku: 'ARROZ-1KG', name: 'Arroz Largo Fino 1kg', category: 'Almacén', brand: null, supplier: central, purchasePrice: 700, salePrice: 1200, minStock: 25, stock: 50, unit: 'unidad' },
    { sku: 'FIDEOS-500', name: 'Fideos Guaseros 500g', category: 'Almacén', brand: null, supplier: central, purchasePrice: 350, salePrice: 650, minStock: 30, stock: 45, unit: 'unidad' },
    { sku: 'ACEITE-900', name: 'Aceite de Girasol 900ml', category: 'Almacén', brand: null, supplier: central, purchasePrice: 900, salePrice: 1550, minStock: 15, stock: 6, unit: 'unidad' },
    { sku: 'AZUCAR-1KG', name: 'Azúcar 1kg', category: 'Almacén', brand: null, supplier: central, purchasePrice: 550, salePrice: 950, minStock: 20, stock: 38, unit: 'unidad' },
  ];

  for (const item of productData) {
    const existing = await prisma.product.findUnique({ where: { sku: item.sku } });
    if (existing) continue;

    const product = await prisma.product.create({
      data: {
        sku: item.sku,
        name: item.name,
        categoryId: categories[item.category],
        brandId: item.brand ? brands[item.brand] : null,
        supplierId: item.supplier,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice,
        minStock: item.minStock,
        unit: item.unit,
        status: item.status ?? ProductStatus.ACTIVO,
        currentStock: item.stock,
      },
    });

    if (item.stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: MovementType.ENTRADA,
          quantity: item.stock,
          previousStock: 0,
          resultingStock: item.stock,
          reason: 'Carga inicial de stock (seed)',
          userId: adminUser.id,
        },
      });
    }
  }

  console.log('✅ Seed completo. Logins de prueba:');
  for (const demoUser of demoUsers) {
    console.log(`   ${demoUser.role} -> ${demoUser.email} / ${demoUser.password}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Error al sembrar la base de datos:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
