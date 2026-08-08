import { postBackendJson } from './backend';

/**
 * Sync the user's cart to the backend so cart-abandonment recovery can find
 * real abandoned carts. Debounced to avoid hammering the server on every
 * quantity change. Only fires when the user is signed in (has an email).
 */

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function syncCartToBackend(options: {
  cartItems: any[];
  email?: string;
  name?: string;
  profileId?: string;
}): void {
  const email = String(options.email || '').trim();
  if (!email) return; // Guests can't be recovered — no email to send to.

  // Only sync if the cart has items.
  if (!Array.isArray(options.cartItems) || options.cartItems.length === 0) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    void postBackendJson(
      '/api/cart/sync',
      {
        email,
        name: String(options.name || ''),
        profileId: String(options.profileId || ''),
        items: options.cartItems.map((item) => ({
          id: String(item?.id || item?.variantId || ''),
          title: String(item?.title || 'Product'),
          price: Number(item?.priceAmount || item?.price || 0),
          quantity: Math.max(Number(item?.quantity || 1), 1),
          image: String(item?.image || item?.featuredImage?.url || ''),
          handle: String(item?.handle || ''),
        })),
      },
      { timeoutMs: 6000 }
    ).catch(() => {
      // Non-fatal — cart sync is best-effort.
    });
  }, 1500);
}
