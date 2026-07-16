import type { LevelInfo, UserLevel } from '@/types/domain';

/** Must stay conceptually in sync with award_xp()'s amounts in the DB, though nothing here reads them directly. */
export const LEVEL_THRESHOLDS: Record<UserLevel, { label: string; floor: number }> = {
  beginner:   { label: 'مبتدئ',  floor: 0 },
  active:     { label: 'نشيط',   floor: 100 },
  influencer: { label: 'مؤثر',   floor: 500 },
  legend:     { label: 'أسطورة', floor: 2000 },
};

const LEVEL_ORDER: UserLevel[] = ['beginner', 'active', 'influencer', 'legend'];

export function getLevelInfo(xp: number): LevelInfo {
  let currentIndex = 0;
  for (let i = LEVEL_ORDER.length - 1; i >= 0; i--) {
    const level = LEVEL_ORDER[i];
    if (level && xp >= LEVEL_THRESHOLDS[level].floor) {
      currentIndex = i;
      break;
    }
  }

  const level = LEVEL_ORDER[currentIndex]!;
  const floorXp = LEVEL_THRESHOLDS[level].floor;
  const nextLevel = LEVEL_ORDER[currentIndex + 1];
  const nextLevelXp = nextLevel ? LEVEL_THRESHOLDS[nextLevel].floor : null;

  const progressPercent = nextLevelXp
    ? Math.min(100, Math.round(((xp - floorXp) / (nextLevelXp - floorXp)) * 100))
    : 100;

  return {
    level,
    label: LEVEL_THRESHOLDS[level].label,
    currentXp: xp,
    floorXp,
    nextLevelXp,
    progressPercent,
  };
}
