import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  entity: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
});
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
