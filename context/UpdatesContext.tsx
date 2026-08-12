import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  makePushTokenStorageKey,
  registerPushTokenWithBackend,
  requestNotificationPermissionAndToken,
  savePushTokenLocally,
} from '../utils/push-notifications';
import {
  fetchInbox,
  markInboxReadBackend,
  markAllInboxReadBackend,
  inboxToNavigation,
  type InboxItem,
} from '../utils/inbox';
import { postBackendJson } from '../utils/backend';
import { useUser } from './UserContext';

const NOTIFICATION_SETTINGS_KEY = 'NOOD_NOTIFICATION_SETTINGS_V1';

export type UpdateType = 'deal' | 'app' | 'arrival' | 'reward' | 'shipping' | 'sale' | 'coupon';

/**
 * Backward-compatible NoodUpdate shape — the new backend-driven inbox items
 * map onto this so existing consumers (Home, Updates screen) keep working.
 */
export type NoodUpdate = {
  id: string;
  type: UpdateType;
  title: string;
  message: string;
  imageUrl?: string;
  targetRoute?: string;
  actionLabel?: string;
  createdAt: string;
  enabled: boolean;
  raw?: InboxItem;
  read?: boolean;
  isInboxItem?: boolean;
};

export type NotificationSettings = {
  notificationsEnabled: boolean;
  dealsAlerts: boolean;
  rewardsAlerts: boolean;
  shippingAlerts: boolean;
  newArrivalsAlerts: boolean;
  wishlistAlerts: boolean;
  restockAlerts: boolean;
  cartAlerts: boolean;
  gamesAlerts: boolean;
  returnsAlerts: boolean;
  referralsAlerts: boolean;
  supportAlerts: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  notificationsEnabled: false,
  dealsAlerts: true,
  rewardsAlerts: true,
  shippingAlerts: true,
  newArrivalsAlerts: true,
  wishlistAlerts: true,
  restockAlerts: true,
  cartAlerts: true,
  gamesAlerts: true,
  returnsAlerts: true,
  referralsAlerts: true,
  supportAlerts: true,
};

/** Map a frontend settings key → backend preference category (push-config CATEGORY). */
export function notificationKeyToCategory(key: keyof NotificationSettings): string | null {
  switch (key) {
    case 'dealsAlerts': return 'deals';
    case 'rewardsAlerts': return 'rewards';
    case 'shippingAlerts': return 'orders'; // orders + tracking both transactional
    case 'newArrivalsAlerts': return 'arrivals';
    case 'wishlistAlerts': return 'wishlist';
    case 'restockAlerts': return 'restock';
    case 'cartAlerts': return 'cart';
    case 'gamesAlerts': return 'games';
    case 'returnsAlerts': return 'returns';
    case 'referralsAlerts': return 'referrals';
    case 'supportAlerts': return 'support';
    default: return null; // notificationsEnabled maps to nothing
  }
}

// Legacy static updates kept ONLY as a fallback when the backend is
// unreachable and no cache exists yet. Real data comes from the backend.
export const legacyUpdates: NoodUpdate[] = [
  {
    id: 'legacy-deal-1',
    type: 'deal',
    title: 'New deals just dropped',
    message: "Check out today's best prices before they're gone.",
    imageUrl: '',
    targetRoute: '/account/deals',
    actionLabel: 'View deals',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    enabled: true,
  },
];

/** Map an inbox item's notification type to the legacy UpdateType enum. */
function updateTypeForInbox(item: InboxItem): UpdateType {
  const t = item.type;
  if (t === 'new_product' || t === 'new_brand' || t === 'restock') return 'arrival';
  if (t === 'daily-reward' || t === 'reward-won' || t === 'spin-ready' || t === 'scratch-ready') return 'reward';
  if (t === 'flash-live' || t === 'deal-live' || t === 'coupon-ready' || t === 'cart-nudge') return 'deal';
  if (t === 'order-update' || t === 'order-shipped' || t === 'order-delivered' || t === 'order-in-transit') return 'shipping';
  if (t === 'cart-nudge') return 'coupon';
  return 'app';
}

function inboxToUpdate(item: InboxItem): NoodUpdate {
  return {
    id: item.id,
    type: updateTypeForInbox(item),
    title: item.title,
    message: item.body,
    imageUrl: '',
    targetRoute: item.route || undefined,
    actionLabel: 'View →',
    createdAt: item.createdAt,
    enabled: true,
    raw: item,
    read: item.read,
    isInboxItem: true,
  };
}

type UpdatesContextValue = {
  updates: NoodUpdate[];
  readUpdateIds: string[];
  unreadCount: number;
  notificationSettings: NotificationSettings;
  expoPushToken: string;
  markUpdateRead: (id: string) => Promise<void>;
  markAllUpdatesRead: () => Promise<void>;
  updateNotificationSetting: (key: keyof NotificationSettings, value: boolean) => Promise<void>;
  requestPushPermission: () => Promise<string>;
  openUpdate: (update: NoodUpdate) => Promise<void>;
  refreshInbox: () => Promise<void>;
  loadMoreInbox: () => Promise<void>;
  inboxLoading: boolean;
  inboxLoadedFromCache: boolean;
  inboxHasMore: boolean;
};

const UpdatesContext = createContext<UpdatesContextValue | null>(null);

const makeProfileKey = (baseKey: string, profileId: string) => `${baseKey}:${profileId || 'guest'}`;

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const { profileId, isReady } = useUser();
  const [readUpdateIds, setReadUpdateIds] = useState<string[]>([]);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxLoadedFromCache, setInboxLoadedFromCache] = useState(false);
  const [inboxHasMore, setInboxHasMore] = useState(false);
  const [inboxLoadingMore, setInboxLoadingMore] = useState(false);

  const settingsKey = useMemo(() => makeProfileKey(NOTIFICATION_SETTINGS_KEY, profileId), [profileId]);
  const tokenKey = useMemo(() => makePushTokenStorageKey(profileId), [profileId]);

  // Load settings + cached token on startup.
  useEffect(() => {
    if (!isReady) return;

    const load = async () => {
      try {
        const [savedSettings, savedToken] = await Promise.all([
          AsyncStorage.getItem(settingsKey),
          AsyncStorage.getItem(tokenKey),
        ]);

        setNotificationSettings(
          savedSettings
            ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(savedSettings) }
            : DEFAULT_NOTIFICATION_SETTINGS
        );
        setExpoPushToken(savedToken || '');
      } catch (error) {
        console.log('Updates load error:', error);
      }
    };

    void load();
  }, [isReady, settingsKey, tokenKey]);

  // Refresh inbox from backend (with offline cache fallback).
  const refreshInbox = useCallback(async () => {
    if (!isReady) return;
    setInboxLoading(true);
    try {
      const { items, fromCache } = await fetchInbox({ userId: profileId || '', limit: 20 });
      setInboxItems(items);
      setInboxLoadedFromCache(fromCache);
      setReadUpdateIds(items.filter((i) => i.read).map((i) => i.id));
      setInboxHasMore(items.length >= 20);
    } catch {
      // keep existing items
    } finally {
      setInboxLoading(false);
    }
  }, [isReady, profileId]);

  // Load the next page of older notifications (load-more pagination).
  const loadMoreInbox = useCallback(async () => {
    if (!isReady || inboxLoadingMore) return;
    setInboxLoadingMore(true);
    try {
      const { items } = await fetchInbox({
        userId: profileId || '',
        limit: 20,
        offset: inboxItems.length,
      });
      if (items.length) {
        setInboxItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          return [...prev, ...items.filter((i) => !seen.has(i.id))];
        });
        setInboxHasMore(items.length >= 20);
      } else {
        setInboxHasMore(false);
      }
    } catch {
      setInboxHasMore(false);
    } finally {
      setInboxLoadingMore(false);
    }
  }, [isReady, inboxLoadingMore, inboxItems.length, profileId]);

  useEffect(() => {
    if (!isReady) return;
    void refreshInbox();
  }, [isReady, profileId, refreshInbox]);

  // Refresh when the app returns to foreground so the slide always shows
  // the newest persisted notifications.
  useEffect(() => {
    if (!isReady) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshInbox();
      }
    });
    return () => sub.remove();
  }, [isReady, refreshInbox]);

  // Refresh when a push notification is received while the app is open.
  useEffect(() => {
    if (Platform.OS === 'web' || !isReady) return;
    let sub: any = null;
    try {
      const Notifications = require('expo-notifications');
      sub = Notifications.addNotificationReceivedListener(() => {
        void refreshInbox();
      });
    } catch {
      // expo-notifications unavailable on this platform
    }
    return () => sub?.remove?.();
  }, [isReady, refreshInbox]);

  const markUpdateRead = useCallback(
    async (id: string) => {
      if (!id || readUpdateIds.includes(id)) return;
      setReadUpdateIds((prev) => [id, ...prev]);
      setInboxItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
      await markInboxReadBackend({ userId: profileId || '', notificationId: id });
    },
    [profileId, readUpdateIds]
  );

  const markAllUpdatesRead = useCallback(async () => {
    const unreadIds = inboxItems.filter((i) => !i.read).map((i) => i.id);
    setReadUpdateIds((prev) => Array.from(new Set([...prev, ...unreadIds])));
    setInboxItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await markAllInboxReadBackend({ userId: profileId || '' });
  }, [inboxItems, profileId]);

  const requestPushPermission = useCallback(async () => {
    if (Platform.OS === 'web') return '';

    try {
      const { granted, token } = await requestNotificationPermissionAndToken();
      if (!granted || !token) {
        return '';
      }

      setExpoPushToken(token);
      await savePushTokenLocally(profileId, token);
      await registerPushTokenWithBackend({
        token,
        userId: profileId || undefined,
      });
      return token;
    } catch (error) {
      console.log('Push notification permission error:', error);
      return '';
    }
  }, [profileId]);

  const updateNotificationSetting = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      const next = { ...notificationSettings, [key]: value };

      setNotificationSettings(next);
      await AsyncStorage.setItem(settingsKey, JSON.stringify(next));

      if (key === 'notificationsEnabled' && value) {
        await requestPushPermission();
      }

      // Sync to the backend so preference enforcement happens SERVER-SIDE
      // (push-delivery.js checks isCategoryEnabledForUser). Non-fatal on error.
      const category = notificationKeyToCategory(key);
      if (category && profileId) {
        postBackendJson('/api/notifications/preferences', {
          userId: profileId,
          category,
          enabled: value,
        }).catch(() => {
          // non-fatal — local setting still applies
        });
      }
    },
    [notificationSettings, profileId, requestPushPermission, settingsKey]
  );

  const openUpdate = useCallback(
    async (update: NoodUpdate) => {
      await markUpdateRead(update.id);
      if (update.raw) {
        // Real inbox item → reuse the push notification routing logic.
        const dest = inboxToNavigation(update.raw);
        if (dest) {
          router.push(dest.pathname as any, dest.params as any);
          return;
        }
      }
      if (update.targetRoute) {
        router.push(update.targetRoute as any);
      }
    },
    [markUpdateRead]
  );

  // Merged list: real inbox items first, then legacy fallback (only when no
  // inbox items at all — e.g. first launch offline).
  const updates = useMemo(() => {
    if (inboxItems.length) {
      return inboxItems.map(inboxToUpdate);
    }
    if (!inboxLoading && !inboxLoadedFromCache) {
      return legacyUpdates;
    }
    return [];
  }, [inboxItems, inboxLoading, inboxLoadedFromCache]);

  const unreadCount = useMemo(() => {
    const fromItems = inboxItems.filter((i) => !i.read).length;
    if (inboxItems.length) return fromItems;
    return legacyUpdates.filter((u) => !readUpdateIds.includes(u.id)).length;
  }, [inboxItems, readUpdateIds]);

  const value = useMemo(
    () => ({
      updates,
      readUpdateIds,
      unreadCount,
      notificationSettings,
      expoPushToken,
      markUpdateRead,
      markAllUpdatesRead,
      updateNotificationSetting,
      requestPushPermission,
      openUpdate,
      refreshInbox,
      loadMoreInbox,
      inboxLoading,
      inboxLoadedFromCache,
      inboxHasMore,
    }),
    [
      updates,
      readUpdateIds,
      unreadCount,
      notificationSettings,
      expoPushToken,
      markUpdateRead,
      markAllUpdatesRead,
      updateNotificationSetting,
      requestPushPermission,
      openUpdate,
      refreshInbox,
      loadMoreInbox,
      inboxLoading,
      inboxLoadedFromCache,
      inboxHasMore,
    ]
  );

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

export function useUpdates() {
  const context = useContext(UpdatesContext);

  if (!context) {
    throw new Error('useUpdates must be used inside UpdatesProvider');
  }

  return context;
}
