import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getRecentPriceDropCount } from '../utils/wishlist-price-alerts';

/**
 * Small banner shown on the wishlist screen when recent price drops exist.
 * Tapping it opens the product (best drop available from storage map).
 */
export function PriceDropBanner() {
  const router = useRouter();
  const [drops, setDrops] = useState<Array<{ handle: string; title: string; dropPercent: number }>>([]);

  const refresh = useCallback(async () => {
    try {
      const count = await getRecentPriceDropCount(7);
      if (count > 0) {
        setDrops([{ handle: '', title: `${count} price drop${count === 1 ? '' : 's'} on your wishlist`, dropPercent: 0 }]);
      } else {
        setDrops([]);
      }
    } catch {
      setDrops([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!drops.length) return null;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}
      onPress={() => {
        const withHandle = drops.find((d) => d.handle);
        if (withHandle) {
          router.push(`/product/${withHandle.handle}` as any);
        }
      }}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="trending-down" size={16} color="#fff" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Price drop alert</Text>
        <Text style={styles.body}>{drops[0]?.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a7a3d',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 14,
    marginBottom: 12,
    gap: 10,
  },
  wrapPressed: { opacity: 0.9 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { color: '#fff', fontSize: 13, fontWeight: '900' },
  body: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 2 },
});
