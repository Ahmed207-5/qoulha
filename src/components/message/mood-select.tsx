'use client';

import { MOOD_META } from '@/constants/message';
import type { MessageMood } from '@/types/domain';
import { cn } from '@/lib/utils';

export function MoodSelect({ value, onChange }: { value: MessageMood; onChange: (v: MessageMood) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(MOOD_META) as [MessageMood, (typeof MOOD_META)[MessageMood]][]).map(([key, meta]) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
              active
                ? 'border-brand-400 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                : 'border-brand-200/50 text-brand-700/70 hover:border-brand-300 dark:border-white/10 dark:text-brand-200/70'
            )}
          >
            <span>{meta.emoji}</span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
