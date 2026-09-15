import { Construction } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState.js';

interface PlaceholderPageProps {
  title: string;
  phase: string;
}

/**
 * Página temporal para módulos aún no implementados. Se reemplaza por la
 * pantalla real en la fase indicada — ver README raíz y src/modules/README.md
 * en el backend para el plan completo.
 */
export function PlaceholderPage({ title, phase }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <EmptyState
        icon={Construction}
        title={`${title} — próximamente`}
        description={`Este módulo se construye en la ${phase} del proyecto.`}
      />
    </div>
  );
}
