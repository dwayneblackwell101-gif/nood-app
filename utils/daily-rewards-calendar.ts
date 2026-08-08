import { getDailyStreakState, recordDailyCheckIn, type DailyStreakState } from './daily-streak';

/**
 * Daily Rewards calendar — the casino-style 7-day check-in grid.
 *
 * Each day in the cycle unlocks an escalating LOCKED reward. Rewards are
 * locked store credit that only move to the wallet after qualifying spend,
 * so the merchant controls the effective discount rate (never real cash).
 *
 * Day 7 is the big payout. Missing a day resets the cycle → the FOMO that
 * brings customers back.
 */

export type DailyRewardTile = {
  day: number;
  amountUsd: number;
  label: string;
  claimed: boolean;
  isToday: boolean;
  isFuture: boolean;
  isBonus: boolean;
};

export const DAILY_REWARD_SCHEDULE: Array<{ day: number; amountUsd: number; label: string }> = [
  { day: 1, amountUsd: 0.5, label: '$0.50' },
  { day: 2, amountUsd: 0.75, label: '$0.75' },
  { day: 3, amountUsd: 1, label: '$1' },
  { day: 4, amountUsd: 1.5, label: '$1.50' },
  { day: 5, amountUsd: 2, label: '$2' },
  { day: 6, amountUsd: 2.5, label: '$2.50' },
  { day: 7, amountUsd: 5, label: '$5 BONUS' },
];

/** Each day's reward requires this much qualifying spend to unlock. */
export const DAILY_REWARD_UNLOCK_REQUIREMENT_USD = 25;
/** Hours before an unclaimed locked reward expires. */
export const DAILY_REWARD_EXPIRY_HOURS = 72;

export const TOTAL_CYCLE_REWARD_USD = DAILY_REWARD_SCHEDULE.reduce(
  (sum, item) => sum + item.amountUsd,
  0
);

/** Cycle position (1..7) from the current streak. */
export function getCyclePosition(streak: number): number {
  return ((Math.max(1, streak) - 1) % 7) + 1;
}

export function buildCalendarTiles(state: DailyStreakState): DailyRewardTile[] {
  const position = getCyclePosition(state.currentStreak);

  return DAILY_REWARD_SCHEDULE.map((item) => {
    // If checked in today, today and all earlier days this cycle are claimed.
    const claimed =
      state.todayCheckedIn && state.currentStreak > 0 ? item.day <= position : item.day < position;
    const isToday = state.currentStreak > 0 && item.day === position;

    return {
      day: item.day,
      amountUsd: item.amountUsd,
      label: item.label,
      claimed,
      isToday,
      isFuture: !claimed && !isToday,
      isBonus: item.day === 7,
    };
  });
}

export async function getDailyRewardsCalendarState(): Promise<{
  tiles: DailyRewardTile[];
  streak: DailyStreakState;
}> {
  const streak = await getDailyStreakState();
  return { tiles: buildCalendarTiles(streak), streak };
}

/**
 * Claim today's reward. Idempotent — only the first call per day grants.
 * Returns the granted reward amount (0 if already claimed today).
 */
export async function claimTodayReward(): Promise<{ grantedUsd: number; streak: DailyStreakState }> {
  const streak = await recordDailyCheckIn();

  // recordDailyCheckIn grants 0 on a repeat call within the same day,
  // so we can rely on it as the single claim gate.
  const position = getCyclePosition(streak.currentStreak);
  const tile = DAILY_REWARD_SCHEDULE.find((item) => item.day === position);
  const grantedUsd = streak.pointsEarned > 0 ? tile?.amountUsd || 0 : 0;

  return { grantedUsd, streak };
}
