import { z } from 'zod';
import { PurchaseStatus } from '../enums.js';

export const purchaseItemInputSchema = z.object({
  productId: z.string().min(1, 'Seleccioná un producto'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a cero'),
  unitPrice: z.number().min(0, 'No puede ser negativo'),
});
export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Seleccioná un proveedor'),
  discount: z.number().min(0, 'No puede ser negativo').default(0),
  tax: z.number().min(0, 'No puede ser negativo').default(0),
  items: z.array(purchaseItemInputSchema).min(1, 'Agregá al menos un producto'),
});
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const purchaseListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  supplierId: z.string().optional(),
  status: z.nativeEnum(PurchaseStatus).optional(),
});
export type PurchaseListQuery = z.infer<typeof purchaseListQuerySchema>;
