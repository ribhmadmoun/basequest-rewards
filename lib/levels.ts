const LEVEL_XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

export const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length;

export function getLevel(totalXp: number): number {
  const safeXp = Math.max(0, totalXp);

  for (let index = LEVEL_XP_THRESHOLDS.length - 1; index >= 0; index -= 1) {
    if (safeXp >= LEVEL_XP_THRESHOLDS[index]) {
      return index + 1;
    }
  }

  return 1;
}

export function getCurrentLevelXP(totalXp: number): number {
  return LEVEL_XP_THRESHOLDS[getLevel(totalXp) - 1];
}

export function getNextLevelXP(totalXp: number): number | null {
  const level = getLevel(totalXp);

  if (level >= LEVEL_XP_THRESHOLDS.length) {
    return null;
  }

  return LEVEL_XP_THRESHOLDS[level];
}

export function getProgressPercent(totalXp: number): number {
  const nextLevelXp = getNextLevelXP(totalXp);

  if (nextLevelXp === null) {
    return 100;
  }

  const currentLevelXp = getCurrentLevelXP(totalXp);
  const levelSpan = nextLevelXp - currentLevelXp;

  if (levelSpan <= 0) {
    return 100;
  }

  const progressInLevel = Math.max(0, totalXp - currentLevelXp);

  return Math.min(100, Math.max(0, (progressInLevel / levelSpan) * 100));
}
