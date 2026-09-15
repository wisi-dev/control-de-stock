import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';

/**
 * Layout general autenticado: sidebar + header + contenido de la ruta activa.
 * En mobile el sidebar se muestra como drawer (ver Sidebar.tsx), controlado
 * acá para que el botón de Header y el propio Sidebar compartan el estado.
 * La protección de rutas (redirigir a /login si no hay sesión) se agrega en
 * la Fase 2 junto con el store de autenticación.
 */
export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface-subtle">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
