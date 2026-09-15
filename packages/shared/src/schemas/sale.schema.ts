import { z } from 'zod';
import { PaymentMethod, SaleStatus } from '../enums.js';

/**
 * A diferencia de Compras, el precio NUNCA lo manda el cliente: se toma
 * `Product.salePrice` en el servidor al confirmar, para que nadie pueda
 * vender a un precio manipulado desde el frontend.
 */
export const saleItemInputSchema = z.object({
  productId: z.string().min(1, 'Seleccioná un producto'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a cero'),
});
export type SaleItemInput = z.infer<typeof saleItemInputSchema>;

export const createSaleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  discount: z.number().min(0, 'No puede ser negativo').default(0),
  tax: z.number().min(0, 'No puede ser negativo').default(0),
  items: z.array(saleItemInputSchema).min(1, 'Agregá al menos un producto'),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const saleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  customerId: z.string().optional(),
  status: z.nativeEnum(SaleStatus).optional(),
});
export type SaleListQuery = z.infer<typeof saleListQuerySchema>;
