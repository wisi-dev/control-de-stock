import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  roleId: z.string().min(1, 'Seleccioná un rol'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio').optional(),
  email: z.string().email('Email inválido').optional(),
  roleId: z.string().min(1).optional(),
  active: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const setUserPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
export type SetUserPasswordInput = z.infer<typeof setUserPasswordSchema>;
