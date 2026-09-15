import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_ROLE_PERMISSIONS, RoleName } from '@control-stock/shared';

/**
 * Roles, permisos base y un usuario de ejemplo por rol (Fase 2) para poder
 * probar el sistema con cada nivel de acceso. El seed con productos, clientes,
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
