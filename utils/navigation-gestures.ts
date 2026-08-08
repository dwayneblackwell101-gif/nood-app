import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * Swipe-back gestures for the app.
 * - iOS: edge-only swipe back (28pt trigger) so horizontal content like
 *   product image galleries stays usable.
 * - Android: full-screen swipe-back from anywhere on the left edge.
 */
export const EDGE_SWIPE_STACK_OPTIONS: NativeStackNavigationOptions = {
  gestureEnabled: true,
  fullScreenGestureEnabled: Platform.OS === 'android',
  gestureDirection: 'horizontal',
  animation: 'slide_from_right',
  ...(Platform.OS === 'ios'
    ? {
        gestureResponseDistance: {
          start: 28,
        },
      }
    : {}),
};

export const NOOD_REFRESH_CONTROL_PROPS = {
  tintColor: '#ff6a00',
  colors: ['#ff6a00'] as string[],
  progressBackgroundColor: '#ffffff',
};