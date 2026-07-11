import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-xl border border-brand-200/60 bg-white/70 px-4 text-sm text-brand-950 placeholder:text-brand-400 transition-colors',
        'dark:border-white/10 dark:bg-white/[0.04] dark:text-brand-50',
        'focus:border-brand-400 focus:outline-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-2xl border border-brand-200/60 bg-white/70 px-4 py-3 text-sm text-brand-950 placeholder:text-brand-400 transition-colors resize-none',
        'dark:border-white/10 dark:bg-white/[0.04] dark:text-brand-50',
        'focus:border-brand-400 focus:outline-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass rounded-4xl p-6', className)} {...props} />;
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'outline' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        variant === 'default' && 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
        variant === 'outline' && 'border border-brand-300 text-brand-600 dark:text-brand-300',
        className
      )}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>;
}
