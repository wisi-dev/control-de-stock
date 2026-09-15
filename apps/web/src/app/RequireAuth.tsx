import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchMe } from '../services/auth.service.js';
import { useAuthStore } from '../store/authStore.js';

/**
 * Protege las rutas autenticadas. Si hay un token guardado pero todavía no
 * cargamos el usuario (ej: se refrescó la página), valida el token contra
 * `/api/auth/me` antes de decidir si deja pasar o redirige a /login.
 */
export function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: Boolean(token) && !user,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data && token) setSession(token, meQuery.data);
  }, [meQuery.data, token, setSession]);

  useEffect(() => {
    if (meQuery.isError) clearSession();
  }, [meQuery.isError, clearSession]);

  if (!token) return <Navigate to="/login" replace />;

  if (!user) {
    if (meQuery.isError) return <Navigate to="/login" replace />;
    return (
      <div className="flex h-screen items-center justify-center bg-surface-subtle">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return <Outlet />;
}
