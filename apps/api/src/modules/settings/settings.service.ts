import type { BusinessConfig } from '@prisma/client';
import type { UpdateBusinessConfigInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../common/utils/audit.js';

/** Prisma serializa `Decimal` como string en JSON; lo convertimos a number acá. */
function serialize(config: BusinessConfig) {
  return { ...config, defaultTaxRate: Number(config.defaultTaxRate) };
}

/** Fila única (singleton) — la crea el seed, pero por si falta la creamos con defaults. */
async function getRaw() {
  const existing = await prisma.businessConfig.findFirst();
  if (existing) return existing;
  return prisma.businessConfig.create({ data: { businessName: 'Mi Negocio' } });
}

export async function get() {
  return serialize(await getRaw());
}

export async function update(input: UpdateBusinessConfigInput, actorId: string) {
  const current = await getRaw();
  const config = await prisma.businessConfig.update({ where: { id: current.id }, data: input });
  await logAudit({
    userId: actorId,
    action: 'BUSINESS_CONFIG_UPDATED',
    entity: 'BusinessConfig',
    entityId: config.id,
    metadata: input,
  });
  return serialize(config);
}
