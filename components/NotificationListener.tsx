import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Notifications } from 'expo-notifications';
import { parseNotificationData, notificationToRoute, type NoodNotificationData } from '../utils/notification-handling';

/**
 * Global notification listener.
 * - Registers a received listener (foreground display handled by the handler).
 * - Registers a response (tap) listener → routes to the right screen.
 * Mount once in the root layout.
 */
export function NotificationListener() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    let receivedSub: any = null;
    let responseSub: any = null;

    const setup = async () => {
      try {
        // Foreground: log received notifications (display handled by setNotificationHandler).
        receivedSub = Notifications.addNotificationReceivedListener((notification) => {
          const data = parseNotificationData(notification?.request?.content?.data);
          if (__DEV__) {
            console.log('[NOTIFICATION] received', data);
          }
        });

        // Tap: route to the appropriate screen.
        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const raw = response?.notification?.request?.content?.data;
          const data: NoodNotificationData = parseNotificationData(raw);
          const route = notificationToRoute(data);
          if (route) {
            routerRef.current.push(route.pathname as any, route.params as any);
          }
        });
      } catch (error) {
        if (__DEV__) {
          console.log('[NOTIFICATION] listener setup failed', String((error as any)?.message || error));
        }
      }
    };

    void setup();

    return () => {
      receivedSub?.remove?.();
      responseSub?.remove?.();
    };
  }, []);

  return null;
}
