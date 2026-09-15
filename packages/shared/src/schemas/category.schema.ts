import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).nullish(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio').max(100).optional(),
  description: z.string().max(500).nullish(),
  active: z.boolean().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
