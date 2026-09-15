import { z } from 'zod';

const dateRange = {
  from: z.string().optional(),
  to: z.string().optional(),
};

export const salesByPeriodQuerySchema = z.object({
  ...dateRange,
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});
export type SalesByPeriodQuery = z.infer<typeof salesByPeriodQuerySchema>;

export const topProductsQuerySchema = z.object({
  ...dateRange,
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;

export const reportDateRangeQuerySchema = z.object(dateRange);
export type ReportDateRangeQuery = z.infer<typeof reportDateRangeQuerySchema>;
