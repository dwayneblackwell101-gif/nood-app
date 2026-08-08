import AsyncStorage from '@react-native-async-storage/async-storage';
import { presentLocalNotification } from './push-notifications';

/**
 * Back-in-stock "notify me" requests, stored per customer key.
 * When a product page loads and the product is back in stock, any
 * outstanding request fires a notification and is removed.
 */

const BACK_IN_STOCK_KEY = 'NOOD_BACK_IN_STOCK_V1';

export type BackInStockRequest = {
  productKey: string;
  handle: string;
  title: string;
  variantId?: string;
  createdAt: string;
  notified: boolean;
};

type RequestMap = Record<string, BackInStockRequest>;

async function loadMap(): Promise<RequestMap> {
  try {
    const raw = await AsyncStorage.getItem(BACK_IN_STOCK_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RequestMap;
  } catch {
    return {};
  }
}

async function saveMap(map: RequestMap): Promise<void> {
  try {
    await AsyncStorage.setItem(BACK_IN_STOCK_KEY, JSON.stringify(map));
  } catch {
    // non-fatal
  }
}

export function getBackInStockKey(handle: string, variantId?: string): string {
  return `${handle}${variantId ? `:${variantId}` : ''}`;
}

export async function addBackInStockRequest(options: {
  handle: string;
  title: string;
  variantId?: string;
}): Promise<void> {
  const map = await loadMap();
  const key = getBackInStockKey(options.handle, options.variantId);
  map[key] = {
    productKey: key,
    handle: options.handle,
    title: options.title,
    variantId: options.variantId,
    createdAt: new Date().toISOString(),
    notified: false,
  };
  await saveMap(map);
}

export async function removeBackInStockRequest(handle: string, variantId?: string): Promise<void> {
  const map = await loadMap();
  delete map[getBackInStockKey(handle, variantId)];
  await saveMap(map);
}

export async function hasBackInStockRequest(handle: string, variantId?: string): Promise<boolean> {
  const map = await loadMap();
  return Boolean(map[getBackInStockKey(handle, variantId)]);
}

/**
 * Called whenever a product detail loads and is in stock. Fires pending
 * notifications and clears the requests.
 */
export async function resolveBackInStockRequests(options: {
  handle: string;
  title: string;
  variantId?: string;
  inStock: boolean;
}): Promise<{ fired: number }> {
  if (!options.inStock) return { fired: 0 };

  const map = await loadMap();
  const key = getBackInStockKey(options.handle, options.variantId);
  const pending = Object.entries(map).filter(([k, r]) => {
    if (r.notified) return false;
    if (options.variantId) return k === key;
    return r.handle === options.handle;
  });

  let fired = 0;
  for (const [k, request] of pending) {
    const shown = await presentLocalNotification({
      title: 'Back in stock!',
      body: `${request.title} is back in stock on NOOD.`,
      data: { type: 'back-in-stock', handle: request.handle, productKey: k },
    });
    if (shown) fired += 1;
    map[k] = { ...request, notified: true };
  }

  if (pending.length) await saveMap(map);
  return { fired };
}
