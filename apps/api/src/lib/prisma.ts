import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * Cliente Prisma como singleton. En `dev`, `tsx watch` puede recargar el módulo
 * varias veces; guardamos la instancia en `globalThis` para no agotar las
 * conexiones a la base de datos con cada recarga.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error', 'warn'] : ['error', 'warn'],
  });

if (!env.isProduction) {
  globalThis.__prisma = prisma;
}
