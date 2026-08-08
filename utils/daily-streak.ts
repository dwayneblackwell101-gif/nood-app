import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Daily check-in streak — the "open the app every day" habit loop.
 *
 * A streak increments when the user opens/checks in on consecutive days.
 * Missing a day resets it to 1. Reward points accrue per day in the streak,
 * and milestones (day 3 / 7 / 14) unlock a bonus NOOD Balance reward that
 * is handed back to the caller to grant via `addLockedReward`.
 */

export type DailyStreakState = {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInAt: string | null;
  todayCheckedIn: boolean;
  /** Points earned by today's check-in (0 if already checked in). */
  pointsEarned: number;
  /** NOOD Balance reward (USD) unlocked by today's check-in, or null. */
  milestoneRewardUsd: number | null;
  milestoneLabel: string | null;
  nextMilestoneDay: number;
  daysToNextMilestone: number;
  /** Streak protectors available (auto-save the streak when a day is missed). */
  streakProtectors: number;
  /** True when a protector was consumed on this check-in. */
  protectorUsed: boolean;
};

const STORAGE_KEY = 'NOOD_DAILY_STREAK_V1';
export const STREAK_POINTS_PER_DAY = 10;
export const STREAK_MILESTONES: Array<{ day: number; rewardUsd: number; label: string }> = [
  { day: 3, rewardUsd: 1, label: 'Day 3 streak bonus' },
  { day: 7, rewardUsd: 3, label: '1-week streak bonus' },
  { day: 14, rewardUsd: 7, label: '2-week streak bonus' },
  { day: 30, rewardUsd: 20, label: '30-day streak bonus' },
];

/**
 * Every completed 7-day cycle earns a streak protector ("freeze"). If a day
 * is missed, the protector is consumed and the streak is preserved instead
 * of resetting to 1. This is the FOMO safety net that keeps streaks alive.
 */
export const STREAK_PROTECTOR_CYCLE_DAYS = 7;
export const MAX_STREAK_PROTECTORS = 3;

type StoredStreak = {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInAt: string | null;
  streakProtectors: number;
};

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseStored(raw: string | null): StoredStreak {
  if (!raw) {
    return { currentStreak: 0, longestStreak: 0, totalCheckIns: 0, lastCheckInAt: null, streakProtectors: 0 };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      currentStreak: Number(parsed?.currentStreak) || 0,
      longestStreak: Number(parsed?.longestStreak) || 0,
      totalCheckIns: Number(parsed?.totalCheckIns) || 0,
      lastCheckInAt: typeof parsed?.lastCheckInAt === 'string' ? parsed.lastCheckInAt : null,
      streakProtectors: Math.min(
        MAX_STREAK_PROTECTORS,
        Math.max(0, Number(parsed?.streakProtectors) || 0)
      ),
    };
  } catch {
    return { currentStreak: 0, longestStreak: 0, totalCheckIns: 0, lastCheckInAt: null, streakProtectors: 0 };
  }
}

export async function getDailyStreakState(now: Date = new Date()): Promise<DailyStreakState> {
  const stored = parseStored(await AsyncStorage.getItem(STORAGE_KEY));
  const lastCheckIn = stored.lastCheckInAt ? new Date(stored.lastCheckInAt) : null;
  const todayStart = startOfLocalDay(now);

  const todayCheckedIn = Boolean(lastCheckIn && startOfLocalDay(lastCheckIn) === todayStart);

  const nextMilestone = STREAK_MILESTONES.find((m) => m.day > stored.currentStreak);
  const daysToNextMilestone = nextMilestone ? nextMilestone.day - stored.currentStreak : 0;

  return {
    currentStreak: stored.currentStreak,
    longestStreak: stored.longestStreak,
    totalCheckIns: stored.totalCheckIns,
    lastCheckInAt: stored.lastCheckInAt,
    todayCheckedIn,
    pointsEarned: 0,
    milestoneRewardUsd: null,
    milestoneLabel: null,
    nextMilestoneDay: nextMilestone?.day ?? 0,
    daysToNextMilestone,
    streakProtectors: stored.streakProtectors,
    protectorUsed: false,
  };
}

/**
 * Record a check-in. Returns the updated state plus any reward earned.
 * Safe to call multiple times per day — only the first counts.
 */
export async function recordDailyCheckIn(now: Date = new Date()): Promise<DailyStreakState> {
  const stored = parseStored(await AsyncStorage.getItem(STORAGE_KEY));
  const lastCheckIn = stored.lastCheckInAt ? new Date(stored.lastCheckInAt) : null;
  const todayStart = startOfLocalDay(now);

  if (lastCheckIn && startOfLocalDay(lastCheckIn) === todayStart) {
    // Already checked in today — no-op.
    return getDailyStreakState(now);
  }

  const yesterdayStart = todayStart - 86_400_000;
  const lastCheckInDay = lastCheckIn ? startOfLocalDay(lastCheckIn) : null;
  const consecutive = lastCheckInDay === yesterdayStart;

  let nextStreak: number;
  let protectors = stored.streakProtectors;
  let protectorUsed = false;

  if (consecutive) {
    nextStreak = stored.currentStreak + 1;
  } else if (lastCheckInDay && lastCheckInDay < yesterdayStart && stored.currentStreak > 0) {
    // Missed a day. Use a streak protector if one is available.
    if (protectors > 0) {
      protectors -= 1;
      protectorUsed = true;
      nextStreak = stored.currentStreak + 1; // preserve the streak
    } else {
      nextStreak = 1;
    }
  } else {
    nextStreak = 1;
  }

  // Completing a 7-day cycle earns a protector (capped).
  if (nextStreak > 0 && nextStreak % STREAK_PROTECTOR_CYCLE_DAYS === 0) {
    protectors = Math.min(MAX_STREAK_PROTECTORS, protectors + 1);
  }

  const milestone = STREAK_MILESTONES.find((m) => m.day === nextStreak) ?? null;

  const updated: StoredStreak = {
    currentStreak: nextStreak,
    longestStreak: Math.max(stored.longestStreak, nextStreak),
    totalCheckIns: stored.totalCheckIns + 1,
    lastCheckInAt: now.toISOString(),
    streakProtectors: protectors,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  const nextMilestone = STREAK_MILESTONES.find((m) => m.day > nextStreak);

  return {
    currentStreak: nextStreak,
    longestStreak: updated.longestStreak,
    totalCheckIns: updated.totalCheckIns,
    lastCheckInAt: updated.lastCheckInAt,
    todayCheckedIn: true,
    pointsEarned: STREAK_POINTS_PER_DAY,
    milestoneRewardUsd: milestone?.rewardUsd ?? null,
    milestoneLabel: milestone?.label ?? null,
    nextMilestoneDay: nextMilestone?.day ?? 0,
    daysToNextMilestone: nextMilestone ? nextMilestone.day - nextStreak : 0,
    streakProtectors: protectors,
    protectorUsed,
  };
}

/** For testing / admin reset. */
export async function resetDailyStreak(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Milestone dots UI helper: which of the 7-day week dots are filled. */
export function getStreakWeekDots(state: DailyStreakState): boolean[] {
  const withinWeek = ((state.currentStreak - 1) % 7) + 1;
  return Array.from({ length: 7 }, (_, i) => i < withinWeek);
}
