import { z } from 'zod';

export const openCashRegisterSchema = z.object({
  openingAmount: z.number().min(0, 'No puede ser negativo'),
  notes: z.string().max(500).nullish(),
});
export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;

export const closeCashRegisterSchema = z.object({
  closingAmount: z.number().min(0, 'No puede ser negativo'),
  notes: z.string().max(500).nullish(),
});
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;

/** VENTA lo genera automáticamente el módulo de Ventas — acá solo ingresos/egresos manuales. */
export const createCashMovementSchema = z.object({
  type: z.enum(['INGRESO', 'EGRESO']),
  amount: z.number().positive('El monto debe ser mayor a cero'),
  description: z.string().max(500).nullish(),
});
export type CreateCashMovementInput = z.infer<typeof createCashMovementSchema>;
