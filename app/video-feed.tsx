import React, { useCallback, useRef } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ShoppableVideoFeed } from '../components/ShoppableVideoFeed';

/**
 * Full-screen shoppable video feed route.
 * Gestures:
 *  - Swipe down from the top → dismiss (close the feed)
 *  - Back button / Android back / iOS edge swipe → go back
 */
export default function VideoFeedScreen() {
  const router = useRouter();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const startedRef = useRef(false);

  const closeFeed = useCallback(() => {
    translateY.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(router.back)();
    });
  }, [router, translateY]);

  const dismissWithSwipe = useCallback(() => {
    translateY.value = withSpring(600, { damping: 16, stiffness: 180 }, () => {
      runOnJS(router.back)();
    });
    opacity.value = withTiming(0, { duration: 200 });
  }, [opacity, router, translateY]);

  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .failOffsetX([-12, 12])
    .onStart(() => {
      startedRef.current = true;
    })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        opacity.value = 1 - Math.min(0.5, event.translationY / 400);
      }
    })
    .onEnd((event) => {
      startedRef.current = false;
      if (event.translationY > 120 || event.velocityY > 800) {
        runOnJS(dismissWithSwipe)();
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
        opacity.value = withTiming(1, { duration: 150 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.screen, animatedStyle]}>
        <ShoppableVideoFeed />
        <SafeAreaView style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Watch & Shop</Text>
          <TouchableOpacity style={styles.backButton} onPress={closeFeed} activeOpacity={0.85}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Swipe-down hint */}
        <SafeAreaView style={styles.swipeHint} pointerEvents="none">
          <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.5)" />
          <Text style={styles.swipeHintText}>Swipe down to close</Text>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 2,
  },
  swipeHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },
});
