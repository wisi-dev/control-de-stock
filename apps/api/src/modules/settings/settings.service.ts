import type { UpdateBusinessConfigInput } from '@control-stock/shared';
import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../common/utils/audit.js';

/** Fila única (singleton) — la crea el seed, pero por si falta la creamos con defaults. */
export async function get() {
  const existing = await prisma.businessConfig.findFirst();
  if (existing) return existing;
  return prisma.businessConfig.create({ data: { businessName: 'Mi Negocio' } });
}

export async function update(input: UpdateBusinessConfigInput, actorId: string) {
  const current = await get();
  const config = await prisma.businessConfig.update({ where: { id: current.id }, data: input });
  await logAudit({
    userId: actorId,
    action: 'BUSINESS_CONFIG_UPDATED',
    entity: 'BusinessConfig',
    entityId: config.id,
    metadata: input,
  });
  return config;
}
