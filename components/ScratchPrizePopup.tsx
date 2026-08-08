import React, { memo, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { hapticSuccess, hapticTap } from '../utils/haptics';
import { GameConfetti } from './game-popup/GameConfetti';

type ScratchPrizePopupProps = {
  visible: boolean;
  onPlayNow: () => void;
  onNotNow: () => void;
};

function ScratchPrizePopup({ visible, onPlayNow, onNotNow }: ScratchPrizePopupProps) {
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(60);
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
      shimmerX.value = withRepeat(
        withTiming(2, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
      void hapticSuccess();
    } else {
      scale.value = withTiming(0.8, { duration: 120 });
      translateY.value = withTiming(30, { duration: 120 });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onNotNow}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onNotNow} />

        <View style={styles.centerWrap} pointerEvents="box-none">
          <Animated.View style={[styles.glow, { opacity: 0.5 }]} pointerEvents="none" />

          <Animated.View style={[styles.sheet, cardStyle]}>
            <LinearGradient
              colors={['#3d0000', '#5c0a00', '#8a1200']}
              style={styles.sheetGradient}
            >
              <GameConfetti active />

              <View style={styles.ribbon}>
                <Ionicons name="gift" size={12} color="#8a1200" />
                <Text style={styles.ribbonText}>SCRATCH TOKEN READY</Text>
              </View>

              {/* Mini scratch-card visual with shimmer */}
              <View style={styles.cardVisual}>
                <LinearGradient colors={['#c0c0c0', '#e8e8e8', '#a8a8a8']} style={styles.cardScratch}>
                  <View style={styles.cardScratchTextWrap}>
                    <Text style={styles.cardScratchText}>SCRATCH</Text>
                    <Ionicons name="star" size={16} color="#777" />
                    <Text style={styles.cardScratchText}>ME</Text>
                  </View>
                  <Animated.View style={[styles.shimmer, shimmerStyle]} />
                </LinearGradient>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>$</Text>
                </View>
              </View>

              <Text style={styles.title}>Your Scratch Token is ready!</Text>
              <Text style={styles.copy}>
                Scratch the card to reveal up to <Text style={styles.copyStrong}>$10 NOOD Balance</Text> —
                a reward only you can see.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.92}
                onPress={() => {
                  void hapticTap();
                  onPlayNow();
                }}
              >
                <LinearGradient colors={['#ffd166', '#ffb400', '#ff8a00']} style={styles.primaryGradient}>
                  <Ionicons name="git-commit-outline" size={16} color="#5a2b00" style={{ transform: [{ rotate: '90deg' }] }} />
                  <Text style={styles.primaryText}>REVEAL MY REWARD</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={onNotNow}>
                <Text style={styles.secondaryText}>Not now</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

export default memo(ScratchPrizePopup);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 22,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: '30%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ff3b30',
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,150,80,0.5)',
  },
  sheetGradient: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'center',
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffd166',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  ribbonText: {
    color: '#8a1200',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardVisual: {
    width: 150,
    height: 100,
    borderRadius: 16,
    marginBottom: 16,
    position: 'relative',
  },
  cardScratch: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cardScratchTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardScratchText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ skewX: '-20deg' }],
  },
  cardBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff3b30',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  title: {
    color: '#ffd166',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  copy: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  copyStrong: {
    color: '#ffd166',
    fontWeight: '900',
  },
  primaryButton: {
    marginTop: 18,
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ffb400',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  primaryGradient: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: {
    color: '#5a2b00',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '700',
  },
});
