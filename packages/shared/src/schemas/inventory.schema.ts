import { z } from 'zod';
import { MovementType } from '../enums.js';

export const createMovementSchema = z.object({
  productId: z.string().cuid(),
  type: z.nativeEnum(MovementType),
  quantity: z.number().int().positive('La cantidad debe ser mayor a cero'),
  reason: z.string().max(500).nullish(),
});
export type CreateMovementInput = z.infer<typeof createMovementSchema>;

export const movementListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  productId: z.string().optional(),
  type: z.nativeEnum(MovementType).optional(),
});
export type MovementListQuery = z.infer<typeof movementListQuerySchema>;
