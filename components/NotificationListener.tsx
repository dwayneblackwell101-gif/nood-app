import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  parseNotificationData,
  notificationToRoute,
  type NoodNotificationData,
} from '../utils/notification-handling';

/**
 * Global notification listener.
 * - Registers a received listener (foreground display handled by the handler).
 * - Registers a response (tap) listener → routes to the right screen.
 * - Handles the cold-start / terminated case via getLastNotificationResponse().
 * - Prevents double navigation when the same response is seen by both the
 *   startup check and the live listener.
 *
 * Mount once in the root layout.
 */

function navigateToNotification(router: ReturnType<typeof useRouter>, data: NoodNotificationData) {
  const route = notificationToRoute(data);
  if (!route) return false;
  try {
    router.push(route.pathname as any, route.params as any);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.log('[NOTIFICATION] navigation failed', {
        pathname: route.pathname,
        message: String((error as any)?.message || error || ''),
      });
    }
    return false;
  }
}

/** Unique-ish identifier of a notification response (dedupe key). */
function responseIdentifier(response: any): string {
  try {
    const request = response?.notification?.request;
    const id = request?.identifier || '';
    const data = parseNotificationData(request?.content?.data);
    return [id, data.type, data.productHandle || data.orderId || data.route || ''].join(':');
  } catch {
    return String(response?.notification?.request?.identifier || '');
  }
}

export function NotificationListener() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  // Track responses already handled so the cold-start check and the live
  // listener never navigate twice for the same notification.
  const handledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let receivedSub: any = null;
    let responseSub: any = null;
    let cancelled = false;

    const handleResponse = (response: any) => {
      if (!response) return;
      const key = responseIdentifier(response);

      // Skip if this exact response was already handled (e.g. cold-start path).
      if (handledRef.current.has(key)) return;
      handledRef.current.add(key);

      // Only navigate on the default tap action (not e.g. a custom button).
      const actionId = String(response?.actionIdentifier || '');
      if (actionId && actionId !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

      const raw = response?.notification?.request?.content?.data;
      const data: NoodNotificationData = parseNotificationData(raw);
      if (__DEV__) {
        console.log('[NOTIFICATION] response routed', data);
      }
      navigateToNotification(routerRef.current, data);
    };

    const setup = async () => {
      try {
        // Foreground: log received notifications (display handled by setNotificationHandler).
        receivedSub = Notifications.addNotificationReceivedListener((notification) => {
          const data = parseNotificationData(notification?.request?.content?.data);
          if (__DEV__) {
            console.log('[NOTIFICATION] received', data);
          }
        });

        // Live tap listener.
        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          handleResponse(response);
        });

        // Cold-start / terminated / background-quit: the app may have been
        // launched by tapping a notification. Check for the most recent
        // response that hasn't been handled yet. Waits for the router to be
        // ready (small delay) so navigation doesn't race startup.
        if (Platform.OS !== 'web') {
          const last = await Notifications.getLastNotificationResponseAsync().catch(() => null);
          if (cancelled) return;
          if (last) {
            setTimeout(() => handleResponse(last), 0);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log(
            '[NOTIFICATION] listener setup failed',
            String((error as any)?.message || error || '')
          );
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      receivedSub?.remove?.();
      responseSub?.remove?.();
    };
  }, []);

  return null;
}
