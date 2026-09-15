import { z } from 'zod';

export const createSupplierSchema = z.object({
  businessName: z.string().min(2, 'La razón social es obligatoria').max(200),
  cuit: z.string().max(20).nullish(),
  phone: z.string().max(30).nullish(),
  email: z.string().max(150).nullish(),
  address: z.string().max(300).nullish(),
  contactName: z.string().max(150).nullish(),
  notes: z.string().max(1000).nullish(),
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
