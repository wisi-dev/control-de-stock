import { z } from 'zod';

export const updateRolePermissionsSchema = z.object({
  permissionKeys: z.array(z.string()),
});
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
