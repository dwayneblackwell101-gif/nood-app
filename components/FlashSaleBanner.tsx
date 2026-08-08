import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { getFlashSaleState } from '../utils/flash-sale';
import { CountdownTimer } from './CountdownTimer';

/**
 * Flash sale banner — placed on the home feed and deals screen.
 * Shows a live countdown while a flash window is active, or a
 * "starts in" teaser between windows. Tapping opens the flash hub.
 */
export function FlashSaleBanner({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const state = useMemo(() => getFlashSaleState(new Date(now)), [now]);

  const activeTarget = state.active ? state.endsAt : state.nextStartsAt;
  const label = state.active ? 'FLASH SALE LIVE' : 'FLASH SALE STARTS IN';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open flash sale"
      onPress={() => router.push('/modal')}
      style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}
    >
      <LinearGradient
        colors={['#ff6a00', '#ff3b30']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="flash" size={compact ? 16 : 20} color="#ff6a00" />
        </View>

        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          <CountdownTimer
            targetTimeMs={activeTarget}
            style={styles.timer}
            segmentStyle={styles.segment}
            numberStyle={styles.number}
            labelStyle={styles.timerLabel}
            colonStyle={styles.colon}
          />
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaText}>Shop</Text>
          <Ionicons name="chevron-forward" size={14} color="#fff" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  wrapPressed: {
    opacity: 0.92,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  copy: {
    flex: 1,
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timer: {
    alignSelf: 'flex-start',
  },
  segment: {
    minWidth: 30,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  number: {
    fontSize: 13,
    lineHeight: 15,
  },
  timerLabel: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.7)',
  },
  colon: {
    fontSize: 12,
    color: '#fff',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginRight: 2,
  },
});
