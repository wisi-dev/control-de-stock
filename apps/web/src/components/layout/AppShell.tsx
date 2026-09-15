import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';

/**
 * Layout general autenticado: sidebar + header + contenido de la ruta activa.
 * La protección de rutas (redirigir a /login si no hay sesión) se agrega en
 * la Fase 2 junto con el store de autenticación.
 */
export function AppShell() {
  return (
    <div className="flex h-screen bg-surface-subtle">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
