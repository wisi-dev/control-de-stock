import { z } from 'zod';
import { MovementType } from '../enums.js';

export const createMovementSchema = z.object({
  productId: z.string().cuid(),
  type: z.nativeEnum(MovementType),
  quantity: z.number().int().positive('La cantidad debe ser mayor a cero'),
  reason: z.string().max(500).nullish(),
});
export type CreateMovementInput = z.infer<typeof createMovementSchema>;
