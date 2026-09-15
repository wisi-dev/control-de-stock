import { beforeEach, describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../common/errors/AppError.js';
import { createAdminUser, resetDb } from '../../test/helpers.js';
import { verifyToken } from '../../lib/jwt.js';
import { prisma } from '../../lib/prisma.js';
import * as authService from './auth.service.js';

describe('auth.service', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('login con contraseña correcta devuelve un token válido y los permisos del rol', async () => {
    const { user, password, role } = await createAdminUser();

    const result = await authService.login({ email: user.email, password }, {});

    expect(result.user.id).toBe(user.id);
    expect(result.user.permissions).toContain('*');
    const payload = verifyToken(result.token);
    expect(payload.sub).toBe(user.id);
    expect(payload.roleName).toBe(role.name);
  });

  it('login con contraseña incorrecta rechaza sin revelar si el email existe', async () => {
    const { user } = await createAdminUser();

    await expect(authService.login({ email: user.email, password: 'incorrecta' }, {})).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('login con un email inexistente rechaza con el mismo tipo de error (no enumeración de usuarios)', async () => {
    await expect(
      authService.login({ email: 'no-existe@test.local', password: 'cualquiera' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('login de un usuario desactivado rechaza aunque la contraseña sea correcta', async () => {
    const { user, password } = await createAdminUser();
    await prisma.user.update({ where: { id: user.id }, data: { active: false } });

    await expect(authService.login({ email: user.email, password }, {})).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
