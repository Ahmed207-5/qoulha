'use client';

import { Input } from '@/components/ui/form-elements';
import { Search } from 'lucide-react';
import { CATEGORY_META, MOOD_META } from '@/constants/message';
import type { MessageCategory, MessageMood } from '@/types/domain';

export interface FilterState {
  search: string;
  category: MessageCategory | 'all';
  mood: MessageMood | 'all';
  status: 'all' | 'unread' | 'favorited' | 'published';
}

export function InboxFilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
        <Input
          placeholder="دور في رسائلك..."
          className="pr-11"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-xl border border-brand-200/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as FilterState['status'] })}
        >
          <option value="all">كل الحالات</option>
          <option value="unread">غير مقروءة</option>
          <option value="favorited">مفضلة</option>
          <option value="published">منشورة</option>
        </select>

        <select
          className="rounded-xl border border-brand-200/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as FilterState['category'] })}
        >
          <option value="all">كل التصنيفات</option>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>

        <select
          className="rounded-xl border border-brand-200/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]"
          value={filters.mood}
          onChange={(e) => onChange({ ...filters, mood: e.target.value as FilterState['mood'] })}
        >
          <option value="all">كل المشاعر</option>
          {Object.entries(MOOD_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.emoji} {meta.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
