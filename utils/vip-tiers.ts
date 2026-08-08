/**
 * VIP tier system — status customers don't want to lose.
 *
 * Tiers are driven by lifetime qualifying spend (orders > $10).
 * Higher tiers = better perks, which is the "don't leave us" hook.
 * All perks stay within locked-store-credit / bonus mechanics so the
 * merchant controls the effective discount.
 */

export type VipTier = {
  level: number;
  name: string;
  minSpendUsd: number;
  perk: string;
  /** Extra reward multiplier (1.0 = base). */
  rewardMultiplier: number;
};

export const VIP_TIERS: VipTier[] = [
  { level: 1, name: 'Bronze', minSpendUsd: 0, perk: 'Daily rewards & scratch tokens', rewardMultiplier: 1.0 },
  { level: 2, name: 'Silver', minSpendUsd: 100, perk: '1.2× reward value + early deal access', rewardMultiplier: 1.2 },
  { level: 3, name: 'Gold', minSpendUsd: 300, perk: '1.5× reward value + free shipping always', rewardMultiplier: 1.5 },
  { level: 4, name: 'Platinum', minSpendUsd: 750, perk: '2× reward value + VIP-only flash drops', rewardMultiplier: 2.0 },
];

export function getVipTier(qualifyingSpendUsd: number): VipTier {
  let tier = VIP_TIERS[0];
  for (const candidate of VIP_TIERS) {
    if (qualifyingSpendUsd >= candidate.minSpendUsd) {
      tier = candidate;
    }
  }
  return tier;
}

export function getNextVipTier(qualifyingSpendUsd: number): VipTier | null {
  return VIP_TIERS.find((t) => qualifyingSpendUsd < t.minSpendUsd) || null;
}

export function getVipProgress(qualifyingSpendUsd: number): {
  current: VipTier;
  next: VipTier | null;
  progressPct: number;
  spendToNext: number;
} {
  const current = getVipTier(qualifyingSpendUsd);
  const next = getNextVipTier(qualifyingSpendUsd);

  if (!next) {
    return { current, next: null, progressPct: 100, spendToNext: 0 };
  }

  const span = next.minSpendUsd - current.minSpendUsd;
  const spentInTier = qualifyingSpendUsd - current.minSpendUsd;
  const progressPct = Math.min(100, Math.max(0, (spentInTier / Math.max(span, 1)) * 100));

  return {
    current,
    next,
    progressPct,
    spendToNext: Math.max(0, next.minSpendUsd - qualifyingSpendUsd),
  };
}
