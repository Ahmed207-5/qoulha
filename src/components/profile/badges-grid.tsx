import { getBadgeIcon } from '@/constants/badges';
import { cn } from '@/lib/utils';
import type { EarnedBadge } from '@/types/domain';

export function BadgesGrid({ badges }: { badges: (EarnedBadge & { earned: boolean })[] }) {
  const earnedCount = badges.filter((b) => b.earned).length;
  if (earnedCount === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">
        الأوسمة ({earnedCount}/{badges.length})
      </p>
      <div className="grid grid-cols-4 gap-2">
        {badges.map((badge) => {
          const Icon = getBadgeIcon(badge.icon);
          return (
            <div
              key={badge.id}
              title={badge.earned ? badge.description : `مقفول: ${badge.description}`}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl p-2.5 text-center',
                badge.earned ? 'bg-brand-500/10' : 'bg-brand-500/[0.04] opacity-40'
              )}
            >
              <Icon className="h-5 w-5 text-brand-500" />
              <span className="text-[10px] leading-tight text-brand-700/80 dark:text-brand-200/80">{badge.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
