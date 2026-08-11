/**
 * Notification data contract + tap routing.
 *
 * Every push notification / inbox item carries a `data` object with:
 *   type       — campaign/event type
 *   route      — optional explicit expo-router path
 *   productHandle — product to open (for product-type notifications)
 *   orderId    — order to open (for order/tracking-type notifications)
 *
 * Supported types cover the full NOOD taxonomy — see utils/inbox.ts for the
 * display mapping (icon/color per type). The same routing logic is used for
 * push taps and NOOD Inbox taps (never duplicated).
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
 * Safe list of app routes a notification `route` may open.
 * Anything not in this list is rejected (never navigate blindly to an
 * unvalidated or external URL).
 */
const ALLOWED_STATIC_ROUTES = new Set([
  '/',
  '/(tabs)',
  '/(tabs)/cart',
  '/(tabs)/wishlist',
  '/(tabs)/deals',
  '/(tabs)/account',
  '/(tabs)/home-styles',
  '/(tabs)/categories',
  '/modal',
  '/flash-sale',
  '/account/rewards',
  '/account/orders',
  '/account/tracking',
  '/account/updates',
  '/account/wallet',
  '/account/deals',
  '/account/history',
  '/account/profile',
  '/account/settings',
  '/account/address',
  '/account/returns',
  '/account/reviews',
  '/account/messages',
  '/account/saved',
  '/account/support',
  '/search',
  '/category-trending',
  '/style-challenges',
  '/coolx-deals-hub',
  '/onboarding/style-dna',
]);

const ROUTE_PATHNAME_PATTERN = /^\/(product|collection)\/[\w-]+$/;

/**
 * Validate an explicit `route` from a notification payload.
 * - Must start with '/'
 * - Must NOT be 'noodapp://', 'http://', 'https://', or contain '://'
 * - Must be either in the allowed static set or a product/collection path.
 */
export function isValidNotificationRoute(route?: string): route is string {
  if (!route || typeof route !== 'string') return false;
  const trimmed = route.trim();
  if (!trimmed.startsWith('/')) return false;
  if (trimmed.includes('://')) return false;
  if (ALLOWED_STATIC_ROUTES.has(trimmed)) return true;
  if (ROUTE_PATHNAME_PATTERN.test(trimmed)) return true;
  return false;
}

/** Product-type notification → product detail. */
function productRoute(data: NoodNotificationData) {
  if (data.productHandle) {
    return { pathname: '/product/[handle]', params: { handle: data.productHandle } };
  }
  return { pathname: '/(tabs)' };
}

/** Order/tracking-type notification → tracking screen (with orderId). */
function trackingRoute(data: NoodNotificationData) {
  if (data.orderId) {
    return { pathname: '/account/tracking', params: { orderId: data.orderId } };
  }
  return { pathname: '/account/orders' };
}

/** Refund/return notification → order/refund details. */
function returnRoute(data: NoodNotificationData) {
  if (data.orderId) {
    return { pathname: '/account/returns', params: { orderId: data.orderId } };
  }
  return { pathname: '/account/returns' };
}

/**
 * Map a notification data payload to an expo-router destination.
 * Returns a pathname + params object for router.push, or null when there is
 * no safe destination.
 */
export function notificationToRoute(data: NoodNotificationData): {
  pathname: string;
  params?: Record<string, any>;
} | null {
  const type = String(data.type || 'general');

  // Explicit route wins — but only if it passes validation.
  if (data.route) {
    if (isValidNotificationRoute(data.route)) {
      return { pathname: data.route };
    }
    // Fall through to typed routing when the route is unsafe.
  }

  // Product-detail types.
  if (
    [
      'new_product',
      'new_brand',
      'hot-product',
      'trending-product',
      'personalized-pick',
      'similar-product',
      'restock',
      'size-restock',
      'color-restock',
      'recommended-restock',
      'price-drop',
      'wishlist-sale',
      'wishlist-restock',
      'wishlist-low-stock',
      'low-stock',
      'recently-viewed',
      'cart-price-drop',
      'cart-low-stock',
      'cart-restock',
    ].includes(type)
  ) {
    return productRoute(data);
  }

  // Cart types.
  if (
    [
      'cart-nudge',
      'cart-reward-ready',
      'cart-coupon-ready',
      'cart-free-shipping-close',
    ].includes(type)
  ) {
    return { pathname: '/(tabs)/cart' };
  }

  // Order + payment + delivery tracking — transactional.
  if (
    [
      'order-update',
      'order-confirmed',
      'payment-confirmed',
      'order-processing',
      'order-packed',
      'order-ready',
      'order-shipped',
      'order-in-transit',
      'order-local-facility',
      'order-out-for-delivery',
      'delivery-attempted',
      'order-delivered',
      'order-delayed',
      'order-exception',
      'address-action-needed',
      'pickup-ready',
      'pickup-reminder',
    ].includes(type)
  ) {
    return trackingRoute(data);
  }

  // Returns / refunds.
  if (
    [
      'return-requested',
      'return-approved',
      'return-rejected',
      'return-dropoff-reminder',
      'return-in-transit',
      'return-received',
      'exchange-approved',
      'exchange-shipped',
      'refund-started',
      'refund-processing',
      'refund-completed',
      'refund-failed',
    ].includes(type)
  ) {
    return returnRoute(data);
  }

  // Payment failures / action needed → orders screen.
  if (type === 'payment-failed' || type === 'payment-action-needed') {
    return { pathname: '/account/orders' };
  }

  // Deals / promotions.
  if (
    [
      'deal-live',
      'deal-ending',
      'deal-upgraded',
      'flash-live',
      'flash-ending',
      'coupon-ready',
      'coupon-expiring',
      'free-shipping',
      'free-shipping-close',
      'brand-sale',
      'category-sale',
      'personalized-deal',
    ].includes(type)
  ) {
    return { pathname: '/(tabs)/deals' };
  }

  if (type === 'coupon-applied' || type === 'cart-discount') {
    return { pathname: '/(tabs)/cart' };
  }

  // Games / rewards.
  if (type === 'spin-ready') {
    return { pathname: '/account/rewards', params: { autoSpin: '1' } };
  }
  if (type === 'scratch-ready') {
    return { pathname: '/account/rewards' };
  }
  if (type === 'game-live' || type === 'game-ending') {
    return { pathname: '/style-challenges' };
  }
  if (
    [
      'daily-reward',
      'streak-reminder',
      'streak-at-risk',
      'streak-completed',
      'reward-unlocked',
      'reward-expiring',
      'reward-won',
      'bonus-unlocked',
      'points-earned',
      'points-expiring',
      'credit-earned',
      'credit-expiring',
    ].includes(type)
  ) {
    return { pathname: '/account/rewards' };
  }

  // Referrals / loyalty.
  if (
    [
      'referral-invite',
      'referral-joined',
      'referral-qualified',
      'referral-reward',
      'vip-tier-up',
      'loyalty-milestone',
    ].includes(type)
  ) {
    return { pathname: '/account/rewards' };
  }

  // Support.
  if (type === 'support-reply' || type === 'support-case-update') {
    return { pathname: '/account/support' };
  }

  // Security/account.
  if (
    [
      'security-alert',
      'new-login',
      'password-changed',
      'email-changed',
      'phone-changed',
      'account-warning',
    ].includes(type)
  ) {
    return { pathname: '/account/security' };
  }

  switch (type) {
    case 'broadcast':
    case 'general':
    case 'maintenance':
    case 'service-update':
    default:
      return { pathname: '/(tabs)' };
  }
}
