import { z } from 'zod';

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(100),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(100),
  docNumber: z.string().max(30).nullish(),
  phone: z.string().max(30).nullish(),
  email: z.string().max(150).nullish(),
  address: z.string().max(300).nullish(),
  notes: z.string().max(1000).nullish(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
