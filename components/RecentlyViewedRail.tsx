import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { loadRecommendationSignals, type RecommendationSignalProduct } from '../utils/recommendation-signals';

/**
 * "Recently viewed" horizontal rail. Reads the viewed signal products and
 * enriches them with image/price from a lookup of current catalog products
 * (handles may change titles/prices over time, so we fall back gracefully).
 */
export function RecentlyViewedRail({
  profileId,
  isSignedIn,
  enrichFrom,
  formatPrice,
  onOpenProduct,
}: {
  profileId: string;
  isSignedIn: boolean;
  /** Lookup table handle → { image, price, title } from the current catalog. */
  enrichFrom: Record<string, { image?: string; price?: string; title?: string }>;
  formatPrice: (item: any) => string;
  onOpenProduct: (handle: string) => void;
}) {
  const router = useRouter();
  const [viewed, setViewed] = useState<RecommendationSignalProduct[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const signals = await loadRecommendationSignals({
          profileId: profileId || 'guest',
          email: '',
          isSignedIn,
        });
        if (mounted) setViewed(signals.viewed.slice(0, 10));
      } catch {
        if (mounted) setViewed([]);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, profileId]);

  if (!viewed.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Recently viewed</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/account/history' as any)}
        >
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={viewed}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item?.handle || item?.id || 'viewed')}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => {
          const handle = String(item?.handle || '');
          const enriched = enrichFrom[handle] || {};
          const imageUrl = enriched.image;
          const title = enriched.title || item?.title || 'Product';
          const price = enriched.price || formatPrice(item);

          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => (handle ? onOpenProduct(handle) : undefined)}
            >
              <View style={styles.imageWrap}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name="image-outline" size={22} color="#ccc" />
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.cardPrice}>{price}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ff6a00',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  gap: {
    width: 12,
  },
  card: {
    width: 120,
  },
  cardPressed: {
    opacity: 0.85,
  },
  imageWrap: {
    width: 120,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    lineHeight: 16,
    minHeight: 32,
  },
  cardPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '900',
    color: '#ff6a00',
  },
});
