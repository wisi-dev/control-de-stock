import { describe, expect, it } from 'vitest';
import { hasPermission } from '@control-stock/shared';

describe('hasPermission', () => {
  it('el wildcard "*" (Administrador) siempre pasa', () => {
    expect(hasPermission(['*'], 'users:*')).toBe(true);
    expect(hasPermission(['*'], 'reports:read')).toBe(true);
  });

  it('un permiso exacto pasa', () => {
    expect(hasPermission(['reports:read'], 'reports:read')).toBe(true);
  });

  it('"<recurso>:*" cubre cualquier acción sobre ese recurso, incluyendo "read"', () => {
    expect(hasPermission(['products:*'], 'products:read')).toBe(true);
    expect(hasPermission(['products:*'], 'products:*')).toBe(true);
  });

  it('no cubre un recurso distinto ni un permiso no otorgado', () => {
    expect(hasPermission(['products:read'], 'products:*')).toBe(false);
    expect(hasPermission(['sales:*'], 'users:*')).toBe(false);
    expect(hasPermission([], 'products:read')).toBe(false);
  });
});
