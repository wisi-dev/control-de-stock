import { z } from 'zod';
import { ProductStatus } from '../enums.js';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'El SKU es obligatorio').max(50),
  barcode: z.string().max(50).nullish(),
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().max(2000).nullish(),
  imageUrl: z.string().url('URL de imagen inválida').nullish(),
  categoryId: z.string().cuid().nullish(),
  brandId: z.string().cuid().nullish(),
  supplierId: z.string().cuid().nullish(),
  purchasePrice: z.number().min(0, 'El precio de compra no puede ser negativo'),
  salePrice: z.number().min(0, 'El precio de venta no puede ser negativo'),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).nullish(),
  unit: z.string().min(1).max(30).default('unidad'),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVO),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  sortBy: z.enum(['name', 'sku', 'salePrice', 'currentStock', 'createdAt']).default('name'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
