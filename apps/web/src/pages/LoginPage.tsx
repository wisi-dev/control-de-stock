import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@control-stock/shared';
import { Card, CardContent, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { loginRequest } from '../services/auth.service.js';
import { useAuthStore } from '../store/authStore.js';

export function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (result) => {
      setSession(result.token, result.user);
      navigate('/dashboard', { replace: true });
    },
  });

  // Si ya hay sesión (token válido conocido), no tiene sentido ver el login.
  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-base font-bold text-white">
            CS
          </div>
          <h1 className="text-lg font-semibold text-ink">Control de Stock</h1>
        </div>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Iniciar sesión</p>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
            >
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="admin@controldestock.local"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                id="password"
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              {loginMutation.isError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
                  {loginMutation.error.message || 'No pudimos iniciar sesión. Intentá nuevamente.'}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
