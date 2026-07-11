'use client';

import { CATEGORY_META } from '@/constants/message';
import type { MessageCategory } from '@/types/domain';
import { cn } from '@/lib/utils';

export function CategorySelect({
  value,
  onChange,
}: {
  value: MessageCategory;
  onChange: (v: MessageCategory) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {(Object.entries(CATEGORY_META) as [MessageCategory, (typeof CATEGORY_META)[MessageCategory]][]).map(
        ([key, meta]) => {
          const Icon = meta.icon;
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-medium transition-all',
                active
                  ? 'border-brand-400 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                  : 'border-brand-200/50 text-brand-700/70 hover:border-brand-300 dark:border-white/10 dark:text-brand-200/70'
              )}
            >
              <Icon className="h-4 w-4" style={active ? { color: meta.color } : undefined} />
              {meta.label}
            </button>
          );
        }
      )}
    </div>
  );
}
