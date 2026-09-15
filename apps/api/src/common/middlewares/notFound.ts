import type { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { message: `Ruta no encontrada: ${req.method} ${req.path}`, code: 'ROUTE_NOT_FOUND' },
  });
}
