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

type LuckySpinPopupProps = {
  visible: boolean;
  onSpinNow: () => void;
  onLater: () => void;
};

function LuckySpinPopup({ visible, onSpinNow, onLater }: LuckySpinPopupProps) {
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(60);
  const glowPulse = useSharedValue(0);
  const wheelSpin = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
      glowPulse.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      wheelSpin.value = withSequence(
        withDelay(300, withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.6)) })),
        withRepeat(withTiming(1, { duration: 2500, easing: Easing.linear }), -1)
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

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glowPulse.value * 0.4,
    transform: [{ scale: 1 + glowPulse.value * 0.12 }],
  }));

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelSpin.value * 360}deg` }],
  }));

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onLater}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onLater} />

        <View style={styles.centerWrap} pointerEvents="box-none">
          <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />

          <Animated.View style={[styles.sheet, cardStyle]}>
            <LinearGradient
              colors={['#2a1400', '#3d1d00', '#5a2b00']}
              style={styles.sheetGradient}
            >
              <GameConfetti active />

              <View style={styles.ribbon}>
                <Ionicons name="flash" size={12} color="#5a2b00" />
                <Text style={styles.ribbonText}>ONE FREE SPIN</Text>
              </View>

              {/* Animated golden wheel icon */}
              <View style={styles.wheelWrap}>
                <Animated.View style={[styles.wheel, wheelStyle]}>
                  <LinearGradient colors={['#ffd166', '#ffb400', '#ff8a00']} style={styles.wheelInner}>
                    <Ionicons name="ticket" size={34} color="#5a2b00" />
                  </LinearGradient>
                </Animated.View>
                <View style={styles.wheelBadge}>
                  <Text style={styles.wheelBadgeText}>$$</Text>
                </View>
              </View>

              <Text style={styles.title}>You've got a FREE Lucky Spin!</Text>
              <Text style={styles.copy}>
                Spin the wheel to win up to <Text style={styles.copyStrong}>$20 NOOD Balance</Text> — yours to
                unlock with qualifying orders.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.92}
                onPress={() => {
                  void hapticTap();
                  onSpinNow();
                }}
              >
                <LinearGradient colors={['#ffd166', '#ffb400', '#ff8a00']} style={styles.primaryGradient}>
                  <Text style={styles.primaryText}>SPIN NOW</Text>
                  <Ionicons name="sparkles" size={16} color="#5a2b00" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={onLater}>
                <Text style={styles.secondaryText}>Maybe later</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

export default memo(LuckySpinPopup);

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
    backgroundColor: '#ffb400',
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,0.5)',
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
    color: '#5a2b00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  wheelWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  wheel: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  wheelBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff3b30',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  wheelBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    color: '#ffd166',
    fontSize: 25,
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
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
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
