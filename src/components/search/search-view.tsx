'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { searchMessages, searchUsers, type SearchSort } from '@/services/search-service';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Input } from '@/components/ui/form-elements';
import { WallMessageCard } from '@/components/wall/wall-message-card';
import { CATEGORY_META, MOOD_META } from '@/constants/message';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageCategory, MessageMood } from '@/types/domain';

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'most_reacted', label: 'الأكتر تفاعل' },
  { value: 'most_commented', label: 'الأكتر تعليقات' },
  { value: 'most_reposted', label: 'الأكتر ريبوست' },
];

export function SearchView({ viewerId }: { viewerId?: string }) {
  const [tab, setTab] = React.useState<'messages' | 'users'>('messages');
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<MessageCategory | 'all'>('all');
  const [mood, setMood] = React.useState<MessageMood | 'all'>('all');
  const [sort, setSort] = React.useState<SearchSort>('newest');
  const debouncedQuery = useDebouncedValue(query, 350);

  const messagesQuery = useQuery({
    queryKey: ['search-messages', debouncedQuery, category, mood, sort],
    queryFn: () =>
      searchMessages({
        query: debouncedQuery || undefined,
        category: category === 'all' ? undefined : category,
        mood: mood === 'all' ? undefined : mood,
        sort,
      }),
    enabled: tab === 'messages',
  });

  const usersQuery = useQuery({
    queryKey: ['search-users', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: tab === 'users' && debouncedQuery.length >= 2,
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('messages')}
          className={cn('rounded-full px-4 py-1.5 text-sm font-medium', tab === 'messages' ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300')}
        >
          الرسائل
        </button>
        <button
          onClick={() => setTab('users')}
          className={cn('rounded-full px-4 py-1.5 text-sm font-medium', tab === 'users' ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300')}
        >
          المستخدمين
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
        <Input
          placeholder={tab === 'messages' ? 'دور في محتوى الرسائل...' : 'دور باسم المستخدم أو الاسم...'}
          className="pr-11"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {tab === 'messages' && (
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-xl border border-brand-200/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]"
            value={category}
            onChange={(e) => setCategory(e.target.value as MessageCategory | 'all')}
          >
            <option value="all">كل التصنيفات</option>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-brand-200/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]"
            value={mood}
            onChange={(e) => setMood(e.target.value as MessageMood | 'all')}
          >
            <option value="all">كل المشاعر</option>
            {Object.entries(MOOD_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.emoji} {meta.label}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-brand-200/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]"
            value={sort}
            onChange={(e) => setSort(e.target.value as SearchSort)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {tab === 'messages' ? (
        messagesQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass h-40 animate-pulse rounded-3xl" />)}
          </div>
        ) : messagesQuery.data && messagesQuery.data.messages.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {messagesQuery.data.messages.map((msg) => (
              <WallMessageCard key={msg.id} message={msg} viewerId={viewerId} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-10 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
            مفيش نتايج
          </div>
        )
      ) : usersQuery.data && usersQuery.data.length > 0 ? (
        <div className="space-y-2">
          {usersQuery.data.map((u) => (
            <Link key={u.id} href={`/u/${u.username}`} className="glass flex items-center gap-3 rounded-2xl p-4">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-500/10">
                {u.avatar_url && <Image src={u.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-950 dark:text-white">{u.full_name}</p>
                <p className="truncate text-xs text-brand-500" dir="ltr">@{u.username}</p>
              </div>
              <span className="text-xs text-brand-500/60">{u.message_count} رسالة</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl p-10 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
          {debouncedQuery.length < 2 ? 'اكتب حرفين على الأقل عشان تدور' : 'مفيش نتايج'}
        </div>
      )}
    </div>
  );
}
