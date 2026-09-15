import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio').max(100),
});
export type CreateBrandInput = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio').max(100).optional(),
  active: z.boolean().optional(),
});
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
