import { Notifications } from 'expo-notifications';

/**
 * Notification data contract + tap routing.
 *
 * Every push notification carries a `data` object with:
 *   type       — campaign/event type
 *   route      — optional explicit expo-router path
 *   productHandle — product to open (for product-type notifications)
 *   orderId    — order to open (for order-type notifications)
 *
 * Supported types:
 *   new_product, hot-product, price-drop, flash-live, daily-reward,
 *   cart-nudge, order-update, broadcast, general
 */

export type NoodNotificationData = {
  type?: string;
  route?: string;
  productHandle?: string;
  orderId?: string;
  campaign?: string;
  screen?: string;
  [key: string]: unknown;
};

export type NotificationTapHandler = (data: NoodNotificationData) => void;

/** Convert a notification's data payload into the NoodNotificationData contract. */
export function parseNotificationData(raw: any): NoodNotificationData {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    type: String(data.type || data.campaign || 'general'),
    route: typeof data.route === 'string' ? data.route : undefined,
    productHandle: typeof data.productHandle === 'string' ? data.productHandle : undefined,
    orderId: typeof data.orderId === 'string' ? data.orderId : undefined,
    campaign: typeof data.campaign === 'string' ? data.campaign : undefined,
    screen: typeof data.screen === 'string' ? data.screen : undefined,
  };
}

/**
 * Map a notification data payload to an expo-router destination.
 * Returns a pathname + params object for router.push.
 */
export function notificationToRoute(data: NoodNotificationData): {
  pathname: string;
  params?: Record<string, any>;
} | null {
  const type = String(data.type || 'general');

  // Explicit route wins.
  if (data.route) {
    return { pathname: data.route };
  }

  switch (type) {
    case 'new_product':
    case 'hot-product':
    case 'price-drop':
      if (data.productHandle) {
        return { pathname: '/product/[handle]', params: { handle: data.productHandle } };
      }
      return { pathname: '/(tabs)' };
    case 'flash-live':
      return { pathname: '/modal' }; // flash sale hub
    case 'daily-reward':
      return { pathname: '/account/rewards' };
    case 'cart-nudge':
      return { pathname: '/(tabs)/cart' };
    case 'order-update':
      if (data.orderId) {
        return { pathname: '/account/orders', params: { orderId: data.orderId } };
      }
      return { pathname: '/account/orders' };
    default:
      return { pathname: '/(tabs)' };
  }
}
