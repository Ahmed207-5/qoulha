import { Card } from '@/components/ui/form-elements';
import { cn } from '@/lib/utils';

export function AuthCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-8', className)}>
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-brand-700/80 dark:text-brand-200/80">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </Card>
  );
}
