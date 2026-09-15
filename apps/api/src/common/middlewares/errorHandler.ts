import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { logger } from '../../lib/logger.js';

/**
 * Middleware centralizado de errores. Traduce cualquier excepción (de negocio,
 * de validación Zod, o de Prisma) a una respuesta JSON consistente y segura:
 * el mensaje técnico nunca llega al cliente final, solo se loguea en el servidor.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error({ err }, 'Error de aplicación');
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code, fields: err.fields },
    });
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      fields[issue.path.join('.') || '_'] = issue.message;
    }
    return res.status(400).json({
      success: false,
      error: { message: 'Datos inválidos', code: 'VALIDATION_ERROR', fields },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'campo único';
      return res.status(409).json({
        success: false,
        error: { message: `Ya existe un registro con ese ${target}`, code: 'DUPLICATE' },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { message: 'Registro no encontrado', code: 'NOT_FOUND' },
      });
    }
  }

  logger.error({ err, path: req.path, method: req.method }, 'Error no controlado');
  return res.status(500).json({
    success: false,
    error: { message: 'Ocurrió un error inesperado. Intentá nuevamente.', code: 'INTERNAL_ERROR' },
  });
}
