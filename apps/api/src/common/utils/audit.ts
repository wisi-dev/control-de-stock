import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

interface AuditInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Registra una acción de auditoría (sección 22 del brief). Nunca debe romper
 * el flujo principal: si falla la escritura del log, se registra el error
 * y se sigue — perder una fila de auditoría es preferible a que un login o
 * una venta fallen por eso.
 */
export async function logAudit({ userId = null, action, entity, entityId = null, metadata }: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata: metadata as Prisma.InputJsonValue },
    });
  } catch (err) {
    logger.warn({ err, action, entity, entityId }, 'No se pudo registrar el log de auditoría');
  }
}
