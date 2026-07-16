'use client';

import * as React from 'react';
import { X, Hash } from 'lucide-react';
import { Input } from '@/components/ui/form-elements';
import { searchTags } from '@/services/tags-service';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';

const MAX_TAGS = 3;

export function TagPicker({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const debouncedInput = useDebouncedValue(input, 300);

  React.useEffect(() => {
    let cancelled = false;
    if (debouncedInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    searchTags(debouncedInput.trim()).then((tags) => {
      if (!cancelled) setSuggestions(tags.map((t) => t.name));
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedInput]);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || tag.length > 30) return;
    if (value.includes(tag) || value.length >= MAX_TAGS) return;
    onChange([...value, tag]);
    setInput('');
    setSuggestions([]);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      removeTag(value[value.length - 1]!);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600 dark:text-brand-300"
          >
            <Hash className="h-3 w-3" />
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="mr-0.5 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {value.length < MAX_TAGS && (
          <div className="relative flex-1 min-w-[8rem]">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="أضف تاج... (Enter)"
              className="h-9 text-xs"
            />
            {suggestions.length > 0 && (
              <div className="glass-strong absolute top-10 z-20 w-full overflow-hidden rounded-xl py-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTag(s)}
                    className={cn(
                      'flex w-full items-center gap-1.5 px-3 py-1.5 text-right text-xs hover:bg-brand-500/5',
                      value.includes(s) && 'opacity-40'
                    )}
                    disabled={value.includes(s)}
                  >
                    <Hash className="h-3 w-3 text-brand-400" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
