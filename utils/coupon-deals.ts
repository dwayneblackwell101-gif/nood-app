import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Temu-style countdown coupon deals.
 *
 * Users claim a limited-time coupon (e.g. "$5 off orders $25+") that has a
 * visible countdown. When the countdown hits zero, the coupon expires.
 * Coupons are stored per-device and used at checkout.
 *
 * Safety: coupons are a fixed %/amount off, capped, so the effective
 * discount never exceeds a sane margin.
 */

export type CouponDeal = {
  id: string;
  title: string;
  description: string;
  /** Discount amount in USD (or use percentOff instead). */
  amountOff?: number;
  /** Discount percent (1-100). Mutually exclusive with amountOff. */
  percentOff?: number;
  /** Minimum order total to use this coupon. */
  minSpend?: number;
  /** How long the coupon is valid for after claiming (ms). */
  validForMs: number;
  emoji: string;
};

export type ClaimedCoupon = CouponDeal & {
  claimedAt: number;
  expiresAt: number;
  used: boolean;
};

const CLAIMED_COUPONS_KEY = 'NOOD_CLAIMED_COUPONS_V1';

export const COUPON_DEALS: CouponDeal[] = [
  {
    id: 'coupon-5-off-25',
    title: '$5 OFF $25+',
    description: 'Save $5 on any order over $25',
    amountOff: 5,
    minSpend: 25,
    validForMs: 2 * 60 * 60 * 1000, // 2 hours
    emoji: '💵',
  },
  {
    id: 'coupon-10-off-50',
    title: '$10 OFF $50+',
    description: 'Save $10 on any order over $50',
    amountOff: 10,
    minSpend: 50,
    validForMs: 4 * 60 * 60 * 1000, // 4 hours
    emoji: '🔥',
  },
  {
    id: 'coupon-15pct',
    title: '15% OFF',
    description: '15% off your entire order',
    percentOff: 15,
    validForMs: 90 * 60 * 1000, // 90 minutes
    emoji: '⚡',
  },
];

async function loadClaimed(): Promise<Record<string, ClaimedCoupon>> {
  try {
    const raw = await AsyncStorage.getItem(CLAIMED_COUPONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ClaimedCoupon>;
  } catch {
    return {};
  }
}

async function saveClaimed(map: Record<string, ClaimedCoupon>): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAIMED_COUPONS_KEY, JSON.stringify(map));
  } catch {
    // non-fatal
  }
}

/** Claim a coupon deal. Returns the claimed coupon, or null if already claimed & active. */
export async function claimCoupon(dealId: string): Promise<ClaimedCoupon | null> {
  const deal = COUPON_DEALS.find((d) => d.id === dealId);
  if (!deal) return null;

  const map = await loadClaimed();
  const existing = map[dealId];
  const now = Date.now();

  // If there's an active (unexpired, unused) claim, return it.
  if (existing && !existing.used && existing.expiresAt > now) {
    return existing;
  }

  const claimed: ClaimedCoupon = {
    ...deal,
    claimedAt: now,
    expiresAt: now + deal.validForMs,
    used: false,
  };
  map[dealId] = claimed;
  await saveClaimed(map);
  return claimed;
}

/** Get all active (unexpired, unused) coupons. */
export async function getActiveCoupons(): Promise<ClaimedCoupon[]> {
  const map = await loadClaimed();
  const now = Date.now();
  return Object.values(map).filter((c) => !c.used && c.expiresAt > now);
}

/** Whether a coupon has an active claim. */
export async function hasActiveCoupon(dealId: string): Promise<boolean> {
  const map = await loadClaimed();
  const c = map[dealId];
  return Boolean(c && !c.used && c.expiresAt > Date.now());
}

/** Mark a coupon as used at checkout. */
export async function markCouponUsed(dealId: string): Promise<void> {
  const map = await loadClaimed();
  if (map[dealId]) {
    map[dealId].used = true;
    await saveClaimed(map);
  }
}

/** Get remaining ms for an active coupon (for the countdown). */
export async function getCouponRemainingMs(dealId: string): Promise<number> {
  const map = await loadClaimed();
  const c = map[dealId];
  if (!c || c.used) return 0;
  return Math.max(0, c.expiresAt - Date.now());
}
