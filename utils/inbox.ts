/**
 * NOOD Inbox — frontend client for the backend notification inbox.
 *
 * Backend (Supabase) is the source of truth. Local AsyncStorage is only an
 * offline/startup cache so Home never looks empty. Read state is
 * server-side (mark read / mark all read / unread count endpoints).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendJson, postBackendJson } from './backend';
import {
  parseNotificationData,
  notificationToRoute,
  type NoodNotificationData,
} from './notification-handling';
import { getOrCreateDeviceId } from './push-notifications';

export type InboxItem = {
  id: string;
  campaignId: string | null;
  type: string;
  title: string;
  body: string;
  route?: string;
  productHandle?: string;
  orderId?: string;
  campaign?: string;
  data: Record<string, unknown>;
  userId?: string;
  createdAt: string;
  expiresAt?: string;
  read?: boolean;
};

const INBOX_CACHE_KEY = 'NOOD_INBOX_CACHE_V1';
const INBOX_UNREAD_CACHE_KEY = 'NOOD_INBOX_UNREAD_CACHE_V1';

export type InboxCategoryMeta = {
  label: string;
  icon: string;
  color: string;
};

const TYPE_META: Record<string, InboxCategoryMeta> = {
  // Arrivals / products
  new_product: { label: 'New Arrival', icon: 'bag-add-outline', color: '#ff8a00' },
  new_brand: { label: 'New Brand', icon: 'storefront-outline', color: '#ff8a00' },
  restock: { label: 'Restocked', icon: 'refresh-outline', color: '#1686d9' },
  'size-restock': { label: 'Size Restocked', icon: 'refresh-outline', color: '#1686d9' },
  'color-restock': { label: 'Color Restocked', icon: 'refresh-outline', color: '#1686d9' },
  'price-drop': { label: 'Price Drop', icon: 'trending-down-outline', color: '#ff3b30' },
  'wishlist-sale': { label: 'Wishlist Sale', icon: 'heart-outline', color: '#ff3b30' },
  'wishlist-restock': { label: 'Wishlist Restock', icon: 'heart-outline', color: '#1686d9' },
  'wishlist-low-stock': { label: 'Wishlist Low Stock', icon: 'heart-outline', color: '#ff6a00' },
  'low-stock': { label: 'Low Stock', icon: 'alert-circle-outline', color: '#ff6a00' },
  'hot-product': { label: 'Hot Product', icon: 'flame-outline', color: '#ff6a00' },
  'trending-product': { label: 'Trending', icon: 'trending-up-outline', color: '#ff6a00' },
  'personalized-pick': { label: 'For You', icon: 'sparkles-outline', color: '#6a2cff' },
  'recently-viewed': { label: 'Recently Viewed', icon: 'time-outline', color: '#6a2cff' },
  'similar-product': { label: 'Similar Picks', icon: 'git-compare-outline', color: '#6a2cff' },
  'recommended-restock': { label: 'Back in Stock', icon: 'refresh-outline', color: '#1686d9' },

  // Deals
  'deal-live': { label: 'Deal Live', icon: 'pricetag-outline', color: '#ff6a00' },
  'deal-ending': { label: 'Deal Ending', icon: 'timer-outline', color: '#ff6a00' },
  'deal-upgraded': { label: 'Deal Upgraded', icon: 'trending-up-outline', color: '#ff6a00' },
  'flash-live': { label: 'Flash Sale', icon: 'flash-outline', color: '#ff3b30' },
  'flash-ending': { label: 'Flash Ending', icon: 'flash-outline', color: '#ff3b30' },
  'coupon-ready': { label: 'Coupon Ready', icon: 'ticket-outline', color: '#ff6a00' },
  'coupon-expiring': { label: 'Coupon Expiring', icon: 'ticket-outline', color: '#ff6a00' },
  'coupon-applied': { label: 'Coupon Applied', icon: 'ticket-outline', color: '#2e7d32' },
  'free-shipping': { label: 'Free Shipping', icon: 'cube-outline', color: '#1686d9' },
  'free-shipping-close': { label: 'Almost Free Shipping', icon: 'cube-outline', color: '#1686d9' },
  'cart-discount': { label: 'Cart Discount', icon: 'cart-outline', color: '#ff6a00' },
  'brand-sale': { label: 'Brand Sale', icon: 'pricetag-outline', color: '#ff6a00' },
  'category-sale': { label: 'Category Sale', icon: 'pricetag-outline', color: '#ff6a00' },
  'personalized-deal': { label: 'Deal for You', icon: 'sparkles-outline', color: '#6a2cff' },

  // Games / rewards
  'spin-ready': { label: 'Spin Ready', icon: 'color-wand-outline', color: '#6a2cff' },
  'scratch-ready': { label: 'Scratch Ready', icon: 'ticket-outline', color: '#ff8a00' },
  'game-live': { label: 'Game Live', icon: 'game-controller-outline', color: '#6a2cff' },
  'game-ending': { label: 'Game Ending', icon: 'timer-outline', color: '#6a2cff' },
  'streak-reminder': { label: 'Streak', icon: 'flame-outline', color: '#ff6a00' },
  'streak-at-risk': { label: 'Streak At Risk', icon: 'warning-outline', color: '#ff3b30' },
  'streak-completed': { label: 'Streak Complete', icon: 'checkmark-done-outline', color: '#2e7d32' },
  'reward-unlocked': { label: 'Reward Unlocked', icon: 'gift-outline', color: '#6a2cff' },
  'reward-expiring': { label: 'Reward Expiring', icon: 'timer-outline', color: '#6a2cff' },
  'reward-won': { label: 'Reward Won', icon: 'gift-outline', color: '#2e7d32' },
  'daily-reward': { label: 'Daily Reward', icon: 'gift-outline', color: '#6a2cff' },
  'bonus-unlocked': { label: 'Bonus Unlocked', icon: 'gift-outline', color: '#2e7d32' },
  'points-earned': { label: 'Points Earned', icon: 'star-outline', color: '#ff8a00' },
  'points-expiring': { label: 'Points Expiring', icon: 'timer-outline', color: '#ff8a00' },
  'credit-earned': { label: 'Credit Earned', icon: 'wallet-outline', color: '#2e7d32' },
  'credit-expiring': { label: 'Credit Expiring', icon: 'timer-outline', color: '#ff8a00' },

  // Cart
  'cart-nudge': { label: 'Cart Reminder', icon: 'cart-outline', color: '#ff6a00' },
  'cart-price-drop': { label: 'Cart Price Drop', icon: 'trending-down-outline', color: '#ff3b30' },
  'cart-low-stock': { label: 'Cart Low Stock', icon: 'alert-circle-outline', color: '#ff6a00' },
  'cart-restock': { label: 'Cart Restock', icon: 'refresh-outline', color: '#1686d9' },
  'cart-reward-ready': { label: 'Cart Reward', icon: 'gift-outline', color: '#6a2cff' },
  'cart-coupon-ready': { label: 'Cart Coupon', icon: 'ticket-outline', color: '#ff6a00' },
  'cart-free-shipping-close': { label: 'Free Shipping Close', icon: 'cube-outline', color: '#1686d9' },

  // Orders / payment / tracking — transactional
  'order-confirmed': { label: 'Order Confirmed', icon: 'receipt-outline', color: '#2e7d32' },
  'payment-confirmed': { label: 'Payment Confirmed', icon: 'card-outline', color: '#2e7d32' },
  'payment-failed': { label: 'Payment Failed', icon: 'alert-circle-outline', color: '#ff3b30' },
  'payment-action-needed': { label: 'Action Needed', icon: 'warning-outline', color: '#ff3b30' },
  'order-processing': { label: 'Processing', icon: 'cog-outline', color: '#ff6a00' },
  'order-packed': { label: 'Packed', icon: 'cube-outline', color: '#1686d9' },
  'order-ready': { label: 'Order Ready', icon: 'checkmark-circle-outline', color: '#2e7d32' },
  'order-shipped': { label: 'Shipped', icon: 'cube-outline', color: '#1686d9' },
  'order-in-transit': { label: 'In Transit', icon: 'car-outline', color: '#1686d9' },
  'order-local-facility': { label: 'At Local Facility', icon: 'business-outline', color: '#1686d9' },
  'order-out-for-delivery': { label: 'Out for Delivery', icon: 'car-sport-outline', color: '#1686d9' },
  'delivery-attempted': { label: 'Delivery Attempted', icon: 'alert-circle-outline', color: '#ff6a00' },
  'order-delivered': { label: 'Delivered', icon: 'checkmark-done-circle-outline', color: '#2e7d32' },
  'order-delayed': { label: 'Delayed', icon: 'time-outline', color: '#ff6a00' },
  'order-exception': { label: 'Delivery Exception', icon: 'warning-outline', color: '#ff3b30' },
  'address-action-needed': { label: 'Address Needed', icon: 'location-outline', color: '#ff3b30' },
  'pickup-ready': { label: 'Pickup Ready', icon: 'business-outline', color: '#2e7d32' },
  'pickup-reminder': { label: 'Pickup Reminder', icon: 'business-outline', color: '#ff6a00' },
  'order-update': { label: 'Order Update', icon: 'cube-outline', color: '#1686d9' },

  // Returns / refunds
  'return-requested': { label: 'Return Requested', icon: 'return-down-back-outline', color: '#ff6a00' },
  'return-approved': { label: 'Return Approved', icon: 'checkmark-circle-outline', color: '#2e7d32' },
  'return-rejected': { label: 'Return Rejected', icon: 'close-circle-outline', color: '#ff3b30' },
  'return-in-transit': { label: 'Return In Transit', icon: 'car-outline', color: '#1686d9' },
  'return-received': { label: 'Return Received', icon: 'checkmark-circle-outline', color: '#2e7d32' },
  'exchange-approved': { label: 'Exchange Approved', icon: 'swap-horizontal-outline', color: '#2e7d32' },
  'exchange-shipped': { label: 'Exchange Shipped', icon: 'cube-outline', color: '#1686d9' },
  'refund-started': { label: 'Refund Started', icon: 'wallet-outline', color: '#1686d9' },
  'refund-processing': { label: 'Refund Processing', icon: 'time-outline', color: '#ff6a00' },
  'refund-completed': { label: 'Refund Completed', icon: 'wallet-outline', color: '#2e7d32' },
  'refund-failed': { label: 'Refund Failed', icon: 'close-circle-outline', color: '#ff3b30' },

  // Account / support / security
  'support-reply': { label: 'Support Reply', icon: 'chatbubble-ellipses-outline', color: '#6a2cff' },
  'support-case-update': { label: 'Support Update', icon: 'chatbubble-ellipses-outline', color: '#6a2cff' },
  'security-alert': { label: 'Security Alert', icon: 'shield-checkmark-outline', color: '#ff3b30' },
  'new-login': { label: 'New Login', icon: 'log-in-outline', color: '#ff6a00' },
  'password-changed': { label: 'Password Changed', icon: 'key-outline', color: '#ff6a00' },
  'email-changed': { label: 'Email Changed', icon: 'mail-outline', color: '#ff6a00' },
  'phone-changed': { label: 'Phone Changed', icon: 'call-outline', color: '#ff6a00' },
  'account-warning': { label: 'Account Warning', icon: 'warning-outline', color: '#ff3b30' },

  // Referrals / loyalty
  'referral-invite': { label: 'Invite', icon: 'people-outline', color: '#6a2cff' },
  'referral-joined': { label: 'Friend Joined', icon: 'person-add-outline', color: '#2e7d32' },
  'referral-qualified': { label: 'Referral Qualified', icon: 'checkmark-circle-outline', color: '#2e7d32' },
  'referral-reward': { label: 'Referral Reward', icon: 'gift-outline', color: '#2e7d32' },
  'vip-tier-up': { label: 'VIP Tier Up', icon: 'diamond-outline', color: '#6a2cff' },
  'loyalty-milestone': { label: 'Loyalty Milestone', icon: 'trophy-outline', color: '#ff8a00' },

  // General
  broadcast: { label: 'Announcement', icon: 'megaphone-outline', color: '#ff6a00' },
  general: { label: 'NOOD', icon: 'notifications-outline', color: '#ff6a00' },
  maintenance: { label: 'Maintenance', icon: 'construct-outline', color: '#ff6a00' },
  'service-update': { label: 'Service Update', icon: 'sparkles-outline', color: '#6a2cff' },
};

export function inboxMetaForType(type?: string): InboxCategoryMeta {
  return TYPE_META[String(type || 'general')] || TYPE_META.general;
}

/** Relative timestamp like "5m ago", "2h ago", "Yesterday", "Aug 3". */
export function formatInboxRelativeTime(iso?: string): string {
  if (!iso) return 'Recently';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function toInboxItem(raw: any): InboxItem {
  const data = raw?.data && typeof raw.data === 'object' ? raw.data : {};
  const parsed: NoodNotificationData = parseNotificationData({
    ...data,
    type: raw?.type || data?.type || 'general',
    route: raw?.route || data?.route,
    productHandle: raw?.productHandle || data?.productHandle,
    orderId: raw?.orderId || data?.orderId,
    campaign: raw?.campaign || data?.campaign,
  });
  return {
    id: String(raw?.id || ''),
    campaignId: raw?.campaignId || null,
    type: String(parsed.type || 'general'),
    title: String(raw?.title || 'NOOD'),
    body: String(raw?.body || ''),
    route: parsed.route,
    productHandle: parsed.productHandle,
    orderId: parsed.orderId,
    campaign: parsed.campaign,
    data: parsed as Record<string, unknown>,
    userId: raw?.userId || undefined,
    createdAt: raw?.createdAt || raw?.created_at || new Date().toISOString(),
    expiresAt: raw?.expiresAt || undefined,
    read: Boolean(raw?.read),
  };
}

// ─── Cache helpers ──────────────────────────────────────────────────────

async function readCache(): Promise<InboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(INBOX_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeCache(items: InboxItem[]) {
  try {
    await AsyncStorage.setItem(INBOX_CACHE_KEY, JSON.stringify(items));
  } catch {
    // non-fatal
  }
}

async function readUnreadCache(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(INBOX_UNREAD_CACHE_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

async function writeUnreadCache(count: number) {
  try {
    await AsyncStorage.setItem(INBOX_UNREAD_CACHE_KEY, String(count));
  } catch {
    // non-fatal
  }
}

// ─── API ────────────────────────────────────────────────────────────────

/** Read the stored Expo push token (the device's bearer credential). */
export async function getStoredPushTokenForLogout(): Promise<string | undefined> {
  try {
    const raw = await AsyncStorage.getItem(PUSH_TOKEN_GUEST_KEY);
    if (raw) return raw;
    return getStoredPushToken();
  } catch {
    return undefined;
  }
}

const PUSH_TOKEN_GUEST_KEY = 'NOOD_EXPO_PUSH_TOKEN_V1:guest';

/**
 * Detach this device token from its user (call on logout). The backend
 * nulls user_id + email so private notifications cannot leak to the next
 * person using the device.
 */
export async function detachPushToken(token: string): Promise<void> {
  try {
    await postBackendJson('/api/notifications/logout', { token });
  } catch {
    // non-fatal — the token will be re-associated on next login
  }
}

/** Read the stored Expo push token (the device's bearer credential). */
async function getStoredPushToken(): Promise<string | undefined> {
  try {
    const { makePushTokenStorageKey } = await import('./push-notifications');
    const { getCustomerProfile } = await import('./customer-profile');
    const profile = await getCustomerProfile();
    const profileId = profile?.email || profile?.displayName || 'guest';
    const raw = await AsyncStorage.getItem(makePushTokenStorageKey(profileId));
    return raw || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve identity for inbox/tracking requests.
 * - Signed-in: x-push-token header (backend resolves the bound user_id).
 * - Guest: deviceId query param (stable installation identity).
 * The raw `userId` is NEVER used for private data.
 */
async function identityRequestOptions(
  userId: string,
  deviceId?: string
): Promise<{ params: string; headers: Record<string, string> }> {
  const devId = deviceId || (await getOrCreateDeviceId()) || 'nood-device';
  if (userId && !userId.startsWith('guest_')) {
    const token = await getStoredPushToken();
    if (token) {
      return {
        params: '',
        headers: { 'x-push-token': token },
      };
    }
  }
  return {
    params: `?deviceId=${encodeURIComponent(devId)}`,
    headers: {} as Record<string, string>,
  };
}

/** Fetch inbox from backend (source of truth). Falls back to cache on error. */
export async function fetchInbox(options: {
  userId: string;
  deviceId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: InboxItem[]; fromCache: boolean }> {
  const { userId } = options;
  const { params, headers } = await identityRequestOptions(userId, options.deviceId);
  const limit = options.limit ? `limit=${options.limit}` : '';
  const offset = options.offset ? `offset=${options.offset}` : '';

  try {
    const sep = params.includes('?') ? '&' : '?';
    const qs = [limit, offset].filter(Boolean).join('&');
    const data = await getBackendJson<any>(
      `/api/notifications/inbox${params}${qs ? sep + qs : ''}`,
      {
        timeoutMs: 10000,
        headers,
      }
    );
    const items = (Array.isArray(data?.items) ? data.items : []).map(toInboxItem);
    await writeCache(items);
    return { items, fromCache: false };
  } catch {
    const items = await readCache();
    return { items, fromCache: true };
  }
}

/** Fetch unread count from backend. Falls back to cache on error. */
export async function fetchUnreadCount(options: {
  userId: string;
  deviceId?: string;
}): Promise<number> {
  const { params, headers } = await identityRequestOptions(options.userId, options.deviceId);
  try {
    const data = await getBackendJson<any>(`/api/notifications/inbox/unread-count${params}`, {
      timeoutMs: 10000,
      headers,
    });
    const count = Number(data?.unreadCount || 0);
    await writeUnreadCache(count);
    return count;
  } catch {
    return readUnreadCache();
  }
}

/** Mark one notification read (server-side + local cache). */
export async function markInboxReadBackend(options: {
  userId: string;
  deviceId?: string;
  notificationId: string;
}): Promise<void> {
  const { params, headers } = await identityRequestOptions(options.userId, options.deviceId);
  try {
    await postBackendJson(`/api/notifications/inbox/${encodeURIComponent(options.notificationId)}/read${params}`, {}, { headers });
  } catch {
    // non-fatal — local cache still updates
  }
  const cache = await readCache();
  const next = cache.map((item) =>
    item.id === options.notificationId ? { ...item, read: true } : item
  );
  await writeCache(next);
}

/** Mark all read (server-side + local cache). */
export async function markAllInboxReadBackend(options: {
  userId: string;
  deviceId?: string;
}): Promise<void> {
  const { params, headers } = await identityRequestOptions(options.userId, options.deviceId);
  try {
    await postBackendJson(`/api/notifications/inbox/read-all${params}`, {}, { headers });
  } catch {
    // non-fatal
  }
  const cache = await readCache();
  await writeCache(cache.map((item) => ({ ...item, read: true })));
  await writeUnreadCache(0);
}

/** Resolve a notification's deep-link destination (shared with push taps). */
export function inboxToNavigation(item: InboxItem) {
  return notificationToRoute({
    type: item.type,
    route: item.route,
    productHandle: item.productHandle,
    orderId: item.orderId,
    campaign: item.campaign,
    screen: String(item.data?.screen || ''),
  });
}
