'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getTrendingMessages, type TrendingPeriod } from '@/services/trending-service';
import { getTrendingTags } from '@/services/tags-service';
import { getLeaderboard } from '@/services/leaderboard-service';
import { WallMessageCard } from '@/components/wall/wall-message-card';
import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

const PERIODS: { value: TrendingPeriod; label: string }[] = [
  { value: 'daily', label: 'اليوم' },
  { value: 'weekly', label: 'الأسبوع' },
  { value: 'monthly', label: 'الشهر' },
];

export function TrendingView({ viewerId }: { viewerId?: string }) {
  const [period, setPeriod] = React.useState<TrendingPeriod>('daily');

  const messagesQuery = useQuery({
    queryKey: ['trending-messages', period],
    queryFn: () => getTrendingMessages(period),
  });
  const tagsQuery = useQuery({ queryKey: ['trending-tags-page'], queryFn: () => getTrendingTags(15) });
  const authorsQuery = useQuery({
    queryKey: ['trending-authors', period],
    queryFn: () => getLeaderboard('reactions', period === 'monthly' ? 'monthly' : 'weekly', 8),
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium',
              period === p.value ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-lg font-bold text-brand-950 dark:text-white">أكتر الرسائل ترند</h2>
          {messagesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass h-40 animate-pulse rounded-3xl" />)}
            </div>
          ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
            <div className="space-y-4">
              {messagesQuery.data.map((msg) => (
                <WallMessageCard key={msg.id} message={msg} viewerId={viewerId} />
              ))}
            </div>
          ) : (
            <div className="glass rounded-3xl p-8 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
              مفيش رسائل ترند للفترة دي لسه
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-brand-950 dark:text-white">أكتر التاجات</h2>
            <div className="glass flex flex-wrap gap-2 rounded-3xl p-4">
              {(tagsQuery.data ?? []).map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-500/20 dark:text-brand-300"
                >
                  <Hash className="h-3 w-3" />
                  {tag.name}
                </Link>
              ))}
              {tagsQuery.data?.length === 0 && (
                <p className="text-xs text-brand-500/60">لسه مفيش تاجات ترند</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-brand-950 dark:text-white">أكتر الكتّاب ترند</h2>
            <div className="space-y-2">
              {(authorsQuery.data ?? []).map((author, i) => (
                <Link key={author.userId} href={`/u/${author.username}`} className="glass flex items-center gap-3 rounded-2xl p-3">
                  <span className="w-4 text-xs font-bold text-brand-500/60">{i + 1}</span>
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-brand-500/10">
                    {author.avatarUrl && <Image src={author.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-brand-950 dark:text-white">{author.fullName}</p>
                  </div>
                  <span className="text-xs text-brand-500/60">{author.score}</span>
                </Link>
              ))}
              {authorsQuery.data?.length === 0 && (
                <p className="text-xs text-brand-500/60">لسه مفيش بيانات كفاية</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
