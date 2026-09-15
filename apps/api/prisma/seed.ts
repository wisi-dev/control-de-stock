import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_ROLE_PERMISSIONS, RoleName } from '@control-stock/shared';

/**
 * Seed mínimo de la Fase 1: roles, permisos base y un usuario administrador
 * para poder levantar el sistema. El seed completo con productos, clientes,
 * proveedores, ventas y compras de ejemplo se agrega en la Fase 3 en adelante.
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

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.ADMINISTRADOR } });

  console.log('👤 Creando usuario administrador...');
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@controldestock.local' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@controldestock.local',
      passwordHash,
      roleId: adminRole.id,
    },
  });

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

  console.log('✅ Seed completo.');
  console.log('   Login de prueba -> admin@controldestock.local / Admin123!');
}

main()
  .catch((err) => {
    console.error('❌ Error al sembrar la base de datos:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
