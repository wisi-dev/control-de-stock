import { PropsWithChildren } from 'react';
import { cn } from '../../lib/utils.js';

interface BadgeProps extends PropsWithChildren {
  tone?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  default: 'bg-slate-100 text-ink-muted',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
};

export function Badge({ tone = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
