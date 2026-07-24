/**
 * FallbackOverlay.tsx
 *
 * Smart fallback overlay for when AR is unavailable or not yet implemented in Expo Go.
 * Supports: drag, pinch (scale), rotate, reset.
 * Shows contextual fallback message based on AR mode.
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { getARFallbackMessage, type ARMode } from './ProductTypeResolver';

interface Props {
  imageUrl: string;
  arMode: ARMode;
  initialWidth?: number;
  initialHeight?: number;
  showFallbackMessage?: boolean;
}

export default function FallbackOverlay({
  imageUrl,
  arMode,
  initialWidth = 160,
  initialHeight = 160,
  showFallbackMessage = true,
}: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.2, Math.min(4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const rotationGesture = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  const composed = Gesture.Simultaneous(pan, pinch, rotationGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const fallbackMsg = getARFallbackMessage(arMode);

  return (
    <>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, { width: initialWidth, height: initialHeight }]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>

      {showFallbackMessage && (
        <View style={styles.fallbackBanner}>
          <Text style={styles.fallbackText}>{fallbackMsg}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    marginLeft: -80,
    zIndex: 10,
  },
  image: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  fallbackBanner: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 20,
  },
  fallbackText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});