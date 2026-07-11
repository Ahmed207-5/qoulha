import { Card } from '@/components/ui/form-elements';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-brand-700/70 dark:text-brand-200/70">{label}</p>
        <div
          className={cn('flex h-8 w-8 items-center justify-center rounded-xl', accent ?? 'bg-brand-500/10')}
        >
          <Icon className="h-4 w-4 text-brand-500" />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-brand-950 dark:text-white">{value}</p>
    </Card>
  );
}
