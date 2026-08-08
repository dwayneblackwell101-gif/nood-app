import AsyncStorage from '@react-native-async-storage/async-storage';
import { presentLocalNotification } from './push-notifications';

/**
 * Wishlist price-drop alerts.
 *
 * When the wishlist refreshes, we compare the current Shopify price to the
 * price captured when the item was saved. If the price dropped by >= 10%,
 * we record a "drop" (once per price level) and fire a local notification.
 */

const PRICE_DROP_STORAGE_KEY = 'NOOD_WISHLIST_PRICE_DROPS_V1';

export type PriceDropRecord = {
  itemKey: string;
  title: string;
  handle: string;
  oldPrice: number;
  newPrice: number;
  dropPercent: number;
  detectedAt: string;
  notified: boolean;
};

type DropMap = Record<string, PriceDropRecord>;

async function loadDropMap(): Promise<DropMap> {
  try {
    const raw = await AsyncStorage.getItem(PRICE_DROP_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DropMap;
  } catch {
    return {};
  }
}

async function saveDropMap(map: DropMap): Promise<void> {
  try {
    await AsyncStorage.setItem(PRICE_DROP_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // non-fatal
  }
}

export function getWishlistItemKey(item: any): string {
  return String(item?.handle || item?.id || '').trim();
}

/**
 * Compare current prices against the saved wishlist snapshot.
 * Returns the list of newly-detected drops (and fires notifications for them).
 */
export async function checkWishlistPriceDrops(
  wishlistItems: any[]
): Promise<{ drops: PriceDropRecord[]; alertsShown: number }> {
  const map = await loadDropMap();
  const drops: PriceDropRecord[] = [];
  let alertsShown = 0;

  for (const item of wishlistItems || []) {
    const itemKey = getWishlistItemKey(item);
    if (!itemKey) continue;

    const savedPrice = Number(item?.price);
    const currentPrice = Number(item?.currentPrice ?? item?.newPrice);
    if (!savedPrice || !currentPrice) continue;
    if (currentPrice >= savedPrice) continue;

    const dropPercent = Math.round(((savedPrice - currentPrice) / savedPrice) * 100);
    if (dropPercent < 10) continue;

    const existing = map[itemKey];
    if (existing && Math.abs(existing.newPrice - currentPrice) < 0.01 && existing.notified) {
      continue; // already alerted for this price level
    }

    const record: PriceDropRecord = {
      itemKey,
      title: String(item?.title || 'Wishlist item'),
      handle: String(item?.handle || ''),
      oldPrice: savedPrice,
      newPrice: currentPrice,
      dropPercent,
      detectedAt: new Date().toISOString(),
      notified: true,
    };
    map[itemKey] = record;
    drops.push(record);

    const shown = await presentLocalNotification({
      title: `Price drop: ${dropPercent}% off`,
      body: `${record.title} is now $${currentPrice.toFixed(2)} (was $${savedPrice.toFixed(2)}) on your wishlist.`,
      data: { type: 'wishlist-price-drop', handle: record.handle, itemKey },
    });
    if (shown) alertsShown += 1;
  }

  await saveDropMap(map);
  return { drops, alertsShown };
}

/** Number of drops detected in the last 7 days (for a badge on the wishlist). */
export async function getRecentPriceDropCount(days = 7): Promise<number> {
  const map = await loadDropMap();
  const cutoff = Date.now() - days * 86_400_000;
  return Object.values(map).filter((d) => new Date(d.detectedAt).getTime() >= cutoff).length;
}

/** Admin/testing. */
export async function resetPriceDropAlerts(): Promise<void> {
  await AsyncStorage.removeItem(PRICE_DROP_STORAGE_KEY);
}
