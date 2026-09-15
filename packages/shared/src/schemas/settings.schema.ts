import { z } from 'zod';

export const updateBusinessConfigSchema = z.object({
  businessName: z.string().min(2, 'El nombre del negocio es obligatorio').optional(),
  currency: z.string().min(1).optional(),
  allowNegativeStock: z.boolean().optional(),
  defaultTaxRate: z.number().min(0, 'No puede ser negativo').max(100, 'No puede superar 100').optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});
export type UpdateBusinessConfigInput = z.infer<typeof updateBusinessConfigSchema>;
