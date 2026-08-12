import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useUser } from './UserContext';
import { resolveCustomerStorageKey } from '../utils/customer-storage';
import { recordWishlistProduct } from '../utils/recommendation-signals';
import {
  addWishlistItem,
  getWishlistItems,
  removeWishlistItem,
  type WishlistItem,
} from '../utils/wishlist-storage';
import { mergeGuestWishlistIntoMember, syncWishlistToCustomerAccount } from '../utils/wishlist-sync';
import { checkWishlistPriceDrops } from '../utils/wishlist-price-alerts';
import { postBackendJson } from '../utils/backend';
import { getStoredPushTokenForLogout as getStoredPushToken } from '../utils/inbox';

type WishlistContextType = {
  items: WishlistItem[];
  wishlistCount: number;
  loading: boolean;
  customerKey: string;
  refreshWishlist: (options?: { silent?: boolean }) => Promise<void>;
  addToWishlist: (item: WishlistItem) => Promise<{ items: WishlistItem[]; alreadySaved: boolean }>;
  removeFromWishlist: (itemKey: string) => Promise<WishlistItem[]>;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { profileId, isSignedIn, isReady: userReady } = useUser();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const previousSignedInRef = useRef(isSignedIn);
  const hasLoadedOnceRef = useRef(false);

  const customerKey = useMemo(
    () =>
      userReady
        ? resolveCustomerStorageKey(profileId || '', '', isSignedIn)
        : '',
    [isSignedIn, profileId, userReady]
  );

  // Keep a ref to the latest items for backend sync.
  const itemsRef = useRef<WishlistItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Sync the signed-in user's wishlist to the backend so server-side
  // triggers (price-drop / restock / low-stock) can fire per-user.
  const syncWishlistToBackend = useCallback(
    async (syncItems?: WishlistItem[]) => {
      if (!isSignedIn || !profileId) return;
      const token = await getStoredPushToken().catch(() => undefined);
      if (!token) return;
      const list = syncItems || itemsRef.current;
      if (!list.length) return;

      try {
        await postBackendJson(
          '/api/wishlist/sync',
          {
            items: list.map((item) => ({
              handle: String(item.handle || item.id || ''),
              id: item.id,
              variantId: item.variantId,
              title: item.title,
              price: item.price,
              currency: item.baseCurrency || item.currency || 'USD',
              size: item.size,
              color: item.color,
              image: item.image,
            })),
          },
          { timeoutMs: 8000, headers: { 'x-push-token': token } }
        );
      } catch (error) {
        if (__DEV__) {
          console.log('[WISHLIST SYNC] backend sync failed:', String((error as any)?.message || error));
        }
      }
    },
    [isSignedIn, profileId]
  );

  const refreshWishlist = useCallback(async (options?: { silent?: boolean }) => {
    if (!customerKey) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const savedItems = await getWishlistItems(customerKey);
      setItems(savedItems);

      // Push the current list to the backend for trigger computation.
      if (isSignedIn && profileId) {
        void syncWishlistToBackend(savedItems);
      }

      // Price-drop alerts: compare saved prices to current prices where a
      // product snapshot is available. Wired to the local notification system.
      void checkWishlistPriceDrops(savedItems).catch((error) => {
        if (__DEV__) {
          console.log('[WISHLIST PRICE DROP] check failed', {
            message: String((error as any)?.message || error || ''),
          });
        }
      });
    } catch (error) {
      console.log('Wishlist refresh error:', error);
      setItems([]);
    } finally {
      hasLoadedOnceRef.current = true;
      setLoading(false);
    }
  }, [customerKey, isSignedIn, profileId, syncWishlistToBackend]);

  const addToWishlist = useCallback(
    async (item: WishlistItem) => {
      if (!customerKey) {
        return { items: [], alreadySaved: false };
      }

      const result = await addWishlistItem(customerKey, item);
      setItems(result.items);

      // Debounce a backend sync so price/availability triggers can fire.
      if (isSignedIn && profileId) {
        void syncWishlistToBackend(result.items);
      }

      void recordWishlistProduct(
        {
          profileId: profileId || 'guest',
          isSignedIn,
        },
        {
          handle: String(item.handle || item.id || ''),
          id: item.id ? String(item.id) : undefined,
          title: item.title ? String(item.title) : undefined,
          productType: item.productType ? String(item.productType) : undefined,
          vendor: item.brand ? String(item.brand) : undefined,
        }
      );

      return result;
    },
    [customerKey, isSignedIn, profileId, syncWishlistToBackend]
  );

  const removeFromWishlist = useCallback(
    async (itemKey: string) => {
      if (!customerKey || !itemKey) {
        return [];
      }

      const nextItems = await removeWishlistItem(customerKey, itemKey);
      setItems(nextItems);
      if (isSignedIn && profileId) {
        void syncWishlistToBackend(nextItems);
      }
      return nextItems;
    },
    [customerKey, isSignedIn, profileId, syncWishlistToBackend]
  );

  useEffect(() => {
    if (!userReady) return;

    const wasSignedIn = previousSignedInRef.current;
    previousSignedInRef.current = isSignedIn;

    const hydrate = async () => {
      if (!wasSignedIn && isSignedIn && customerKey) {
        const merged = await mergeGuestWishlistIntoMember(customerKey);
        setItems(merged);
        setLoading(false);

        void syncWishlistToCustomerAccount({
          memberCustomerKey: customerKey,
        });
        return;
      }

      await refreshWishlist({ silent: hasLoadedOnceRef.current });
    };

    void hydrate();
  }, [customerKey, isSignedIn, refreshWishlist, userReady]);

  const wishlistCount = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount,
        loading,
        customerKey,
        refreshWishlist,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}