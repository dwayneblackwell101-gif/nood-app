/**
 * Daily flash sale engine.
 *
 * Three windows a day (store-local time), 4h on / 2h+ off:
 *   06:00–10:00, 14:00–18:00, 22:00–26:00 (wraps to 02:00 next day)
 *
 * Pure/deterministic given a clock, so it behaves identically on every
 * screen and survives re-renders.
 */
export interface FlashSaleWindow {
  startHour: number;
  endHour: number;
}

export const FLASH_SALE_WINDOWS: FlashSaleWindow[] = [
  { startHour: 6, endHour: 10 },
  { startHour: 14, endHour: 18 },
  { startHour: 22, endHour: 26 },
];

export interface FlashSaleState {
  active: boolean;
  windowIndex: number;
  startsAt: number;
  endsAt: number;
  nextStartsAt: number;
  /** 0..1 progress through the active window. */
  progressPct: number;
}

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function isInWindow(hour: number, w: FlashSaleWindow): boolean {
  if (w.endHour > 24) {
    // Wraps past midnight, e.g. 22:00 → 02:00 next day.
    return hour >= w.startHour || hour < w.endHour - 24;
  }
  return hour >= w.startHour && hour < w.endHour;
}

export function getFlashSaleState(now: Date = new Date()): FlashSaleState {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayStartMs = dayStart.getTime();
  const nowMs = now.getTime();
  const hourOfDay = (nowMs - dayStartMs) / HOUR_MS;

  for (let i = 0; i < FLASH_SALE_WINDOWS.length; i += 1) {
    const w = FLASH_SALE_WINDOWS[i];
    if (!isInWindow(hourOfDay, w)) continue;

    const startsAt = dayStartMs + w.startHour * HOUR_MS;
    const endsAt = dayStartMs + w.endHour * HOUR_MS;
    const nextWindowIndex = (i + 1) % FLASH_SALE_WINDOWS.length;
    const nextWindow = FLASH_SALE_WINDOWS[nextWindowIndex];
    const nextDayOffset = nextWindowIndex <= i ? 1 : 0;

    return {
      active: true,
      windowIndex: i,
      startsAt,
      endsAt,
      nextStartsAt: dayStartMs + nextDayOffset * DAY_MS + nextWindow.startHour * HOUR_MS,
      progressPct: Math.min(1, Math.max(0, (nowMs - startsAt) / (endsAt - startsAt))),
    };
  }

  // Inactive — find the next upcoming window (same day or tomorrow).
  let nextIndex = 0;
  for (let i = 0; i < FLASH_SALE_WINDOWS.length; i += 1) {
    if (FLASH_SALE_WINDOWS[i].startHour > hourOfDay) {
      nextIndex = i;
      break;
    }
  }
  const nextWindow = FLASH_SALE_WINDOWS[nextIndex];
  const nextDayOffset = nextWindow.startHour > hourOfDay ? 0 : 1;

  return {
    active: false,
    windowIndex: nextIndex,
    startsAt: 0,
    endsAt: 0,
    nextStartsAt: dayStartMs + nextDayOffset * DAY_MS + nextWindow.startHour * HOUR_MS,
    progressPct: 0,
  };
}

export interface CountdownParts {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function splitDuration(ms: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalSeconds };
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Pick a deterministic subset of deals products for the current flash window. */
export function pickFlashSaleProducts<T extends { id?: string; handle?: string }>(
  products: T[],
  count = 8,
  seed?: number
): T[] {
  if (!products?.length) return [];
  const effectiveSeed = seed ?? new Date().getDate();

  const indexed = products.map((p, index) => {
    const key = String(p?.handle || p?.id || index);
    let hash = effectiveSeed;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return { product: p, hash: Math.abs(hash) };
  });

  indexed.sort((a, b) => a.hash - b.hash);
  return indexed.slice(0, Math.min(count, indexed.length)).map((entry) => entry.product);
}
