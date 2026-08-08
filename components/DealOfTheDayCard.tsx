import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { loadDealOfTheDay, type DealOfTheDay } from '../utils/deal-of-the-day';

/**
 * Deal of the Day — a rotating daily deep-discount pick shown on the home
 * feed. Deterministic per local day; tap to open the product.
 */
export function DealOfTheDayCard() {
  const router = useRouter();
  const [deal, setDeal] = useState<DealOfTheDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void loadDealOfTheDay().then((result) => {
      if (!mounted) return;
      setDeal(result);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#ff6a00" />
      </View>
    );
  }

  if (!deal) return null;

  const imageUrl = deal?.image;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Deal of the day: ${deal.title}`}
      onPress={() => router.push(`/product/${deal.handle}` as any)}
      style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}
    >
      <LinearGradient
        colors={['#ff6a00', '#ff8a3d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.ribbon}>
          <Ionicons name="star" size={12} color="#7a2e00" />
          <Text style={styles.ribbonText}>DEAL OF THE DAY</Text>
        </View>

        <View style={styles.body}>
          {imageUrl ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              {deal.discount != null ? (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{deal.discount}%</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={2}>
              {deal.title}
            </Text>
            <Text style={styles.tagline}>{deal.dealTagline}</Text>

            <View style={styles.priceRow}>
              {deal.compareAt ? (
                <Text style={styles.oldPrice}>${Number(deal.compareAt).toFixed(2)}</Text>
              ) : null}
              <Text style={styles.price}>${Number(deal.price || 0).toFixed(2)}</Text>
            </View>

            {deal.soldCount ? (
              <Text style={styles.sold}>{deal.soldCount.toLocaleString()} already claimed today</Text>
            ) : null}

            <View style={styles.cta}>
              <Text style={styles.ctaText}>Shop the deal</Text>
              <Ionicons name="arrow-forward" size={14} color="#7a2e00" />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 28, alignItems: 'center' },
  wrap: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },
  wrapPressed: { opacity: 0.92 },
  card: {
    borderRadius: 18,
    padding: 14,
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  ribbonText: { color: '#7a2e00', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  body: { flexDirection: 'row', gap: 12 },
  imageWrap: { width: 96, height: 96, borderRadius: 12, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#7a2e00',
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  copy: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '900', lineHeight: 19 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  oldPrice: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textDecorationLine: 'line-through' },
  price: { color: '#fff', fontSize: 19, fontWeight: '900' },
  sold: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', marginTop: 3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ctaText: { color: '#7a2e00', fontSize: 12, fontWeight: '900' },
});
