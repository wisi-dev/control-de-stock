import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';

/**
 * Pantalla de login. La lógica real de autenticación (llamada a /api/auth/login,
 * manejo de token, store de sesión) se conecta en la Fase 2. Por ahora solo
 * define la estructura visual y el formulario controlado.
 */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
            <form className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-ink-muted">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="admin@controldestock.local"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-ink-muted">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled>
                Ingresar (se conecta en Fase 2)
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
