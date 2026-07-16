'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getLeaderboard, type LeaderboardMetric, type LeaderboardPeriod } from '@/services/leaderboard-service';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const METRICS: { value: LeaderboardMetric; label: string }[] = [
  { value: 'xp', label: 'أعلى XP' },
  { value: 'reactions', label: 'أكتر تفاعل' },
  { value: 'comments', label: 'أكتر تعليقات' },
  { value: 'followers', label: 'أكتر متابعين' },
  { value: 'reposts', label: 'أكتر ريبوست' },
  { value: 'visits', label: 'أكتر زيارات' },
];

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'monthly', label: 'شهري' },
  { value: 'all_time', label: 'كل الأوقات' },
];

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function LeaderboardView() {
  const [metric, setMetric] = React.useState<LeaderboardMetric>('xp');
  const [period, setPeriod] = React.useState<LeaderboardPeriod>('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', metric, period],
    queryFn: () => getLeaderboard(metric, period),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMetric(m.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium',
              metric === m.value ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-medium',
              period === p.value ? 'bg-brand-950 text-white dark:bg-white dark:text-brand-950' : 'glass text-brand-600 dark:text-brand-300'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass h-16 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
          مفيش بيانات كفاية للفترة دي لسه
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((entry, index) => (
            <Link
              key={entry.userId}
              href={`/u/${entry.username}`}
              className="glass flex items-center gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                {index < 3 ? (
                  <Trophy className="h-5 w-5" style={{ color: MEDAL_COLORS[index] }} />
                ) : (
                  <span className="text-sm font-bold text-brand-500/60">{index + 1}</span>
                )}
              </div>
              <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-500/10">
                {entry.avatarUrl && (
                  <Image src={entry.avatarUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-950 dark:text-white">{entry.fullName}</p>
                <p className="truncate text-xs text-brand-500" dir="ltr">@{entry.username}</p>
              </div>
              <span className="font-display text-lg font-bold text-brand-600 dark:text-brand-300">{entry.score}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
