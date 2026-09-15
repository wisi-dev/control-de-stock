import { LucideIcon } from 'lucide-react';
import { Card } from './Card.js';
import { cn } from '../../lib/utils.js';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'danger';
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-brand-50 text-brand-600',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
};

export function StatCard({ label, value, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="text-2xl font-semibold text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}
