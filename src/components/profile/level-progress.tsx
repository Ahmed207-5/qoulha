import type { LevelInfo } from '@/types/domain';

export function LevelProgress({ levelInfo }: { levelInfo: LevelInfo }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-brand-600 dark:text-brand-300">{levelInfo.label}</span>
        <span className="text-brand-500/60">
          {levelInfo.currentXp} XP{levelInfo.nextLevelXp ? ` / ${levelInfo.nextLevelXp}` : ' (أعلى مستوى)'}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-500/10">
        <div
          className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-all"
          style={{ width: `${levelInfo.progressPercent}%` }}
        />
      </div>
    </div>
  );
}
