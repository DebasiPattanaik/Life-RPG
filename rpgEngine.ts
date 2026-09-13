// Client display helpers mirror the server-side rpg_level_config curve.

const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
  4000, 5000, 6200, 7600, 9200,
];

export function xpForLevel(level: number): number {
  const current = LEVEL_THRESHOLDS[Math.max(0, level - 1)] ?? (LEVEL_THRESHOLDS.at(-1)! + (level - 15) * 1400);
  const next = LEVEL_THRESHOLDS[Math.max(0, level)] ?? current + 1400;
  return Math.max(0, next - current);
}

export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (LEVEL_THRESHOLDS[level - 1] !== undefined) return LEVEL_THRESHOLDS[level - 1];
  return LEVEL_THRESHOLDS.at(-1)! + (level - 15) * 1400;
}

export function getLevelFromXp(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const currentThreshold = totalXpForLevel(level);
  const nextThreshold = totalXpForLevel(level + 1);
  const currentLevelXp = Math.max(0, totalXp - currentThreshold);
  const xpToNextLevel = Math.max(1, nextThreshold - currentThreshold);
  return {
    level,
    currentLevelXp,
    xpToNextLevel,
    progressPercent: Math.min(100, Math.round((currentLevelXp / xpToNextLevel) * 100)),
  };
}

export interface CharacterState {
  id: string;
  username: string;
  total_xp: number;
  currency: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  attributes: { Intellect: number; Vitality: number; Serenity: number; Craft: number };
}

// Display-only fallback. Actual rewards/streaks are calculated by Supabase.
export function calculateStreakMultiplier(streak: number): number {
  if (streak >= 100) return 1.5;
  if (streak >= 60) return 1.35;
  if (streak >= 30) return 1.25;
  if (streak >= 14) return 1.15;
  if (streak >= 7) return 1.10;
  if (streak >= 3) return 1.05;
  return 1;
}

export function mapCategoryToAttribute(category: string): 'Intellect' | 'Vitality' | 'Serenity' | 'Craft' {
  switch (category.toLowerCase()) {
    case 'intellect':
    case 'study':
    case 'coding': return 'Intellect';
    case 'vitality':
    case 'body':
    case 'health': return 'Vitality';
    case 'serenity':
    case 'soul':
    case 'mindfulness': return 'Serenity';
    default: return 'Craft';
  }
}
