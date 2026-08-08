import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getFlashSaleState } from '../utils/flash-sale';
import { CountdownTimer } from './CountdownTimer';

/**
 * Live "Deal ends in" countdown banner for product pages.
 * Only shows while a flash sale window is active; hidden otherwise.
 */
export function DealCountdownBanner() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const state = useMemo(() => getFlashSaleState(new Date(now)), [now]);

  if (!state.active) return null;

  return (
    <LinearGradient
      colors={['#ff6a00', '#ff3b30']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.banner}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="flash" size={16} color="#ff6a00" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>FLASH SALE — DEAL ENDS IN</Text>
        <CountdownTimer
          targetTimeMs={state.endsAt}
          showLabels={false}
          style={styles.timer}
          segmentStyle={styles.segment}
          numberStyle={styles.number}
          colonStyle={styles.colon}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timer: {
    alignSelf: 'center',
  },
  segment: {
    minWidth: 26,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  number: {
    fontSize: 12,
    lineHeight: 14,
  },
  colon: {
    fontSize: 12,
  },
});
