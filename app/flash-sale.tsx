import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { fetchShopifyCollectionProducts } from '../utils/shopify-catalog';
import { mapShopifyNodesToDealsCards } from '../utils/deals-product-mapper';
import { getFlashSaleState, pickFlashSaleProducts } from '../utils/flash-sale';
import { CountdownTimer } from '../components/CountdownTimer';

const COLLECTION_HANDLES = ['deals', 'frontpage', 'all'];

/**
 * Flash Sale Hub — replaces the placeholder modal.
 * Live countdown, deterministic flash picks, and a product grid
 * that maps real Shopify nodes into deal cards.
 */
export default function FlashSaleHubScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const loadedRef = useRef(false);

  const loadFlashProducts = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    setLoading(true);
    let found: any[] = [];
    for (const handle of COLLECTION_HANDLES) {
      try {
        const result = await fetchShopifyCollectionProducts(handle, { first: 40 });
        const edges = result?.collectionByHandle?.products?.edges || [];
        const nodes = edges.map((e: any) => e.node).filter(Boolean);
        if (nodes.length) {
          found = mapShopifyNodesToDealsCards(nodes);
          break;
        }
      } catch (error) {
        // try the next collection handle
      }
    }

    setLoadError(found.length === 0);
    setProducts(found);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFlashProducts();
  }, [loadFlashProducts]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const flashState = useMemo(() => getFlashSaleState(new Date(now)), [now]);
  const flashPicks = useMemo(() => pickFlashSaleProducts(products, 8), [products]);

  const targetTimeMs = flashState.active ? flashState.endsAt : flashState.nextStartsAt;
  const headerLabel = flashState.active ? 'FLASH SALE LIVE' : 'NEXT FLASH SALE STARTS IN';
  const progressPct = Math.round(flashState.progressPct * 100);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#2a0a00', '#571000', '#8a1c00']}
        style={styles.background}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flash Sale</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="flash" size={28} color="#ff6a00" />
          </View>
          <Text style={styles.heroTitle}>
            {flashState.active ? "Don't miss the flash sale" : 'Flash sale coming soon'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {flashState.active
              ? 'Up to 70% off — when the clock hits zero, prices go back up.'
              : 'The next flash sale starts soon. Get ready to shop.'}
          </Text>

          <CountdownTimer
            targetTimeMs={targetTimeMs}
            segmentStyle={styles.countdownSegment}
            numberStyle={styles.countdownNumber}
            labelStyle={styles.countdownLabel}
            colonStyle={styles.countdownColon}
            style={styles.countdownRow}
          />

          {flashState.active ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {progressPct}% of this flash window is gone
              </Text>
            </View>
          ) : null}
        </View>

        {/* Product grid */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#ff6a00" />
            <Text style={styles.centeredText}>Loading flash deals…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Ionicons name="flash-outline" size={48} color="rgba(255,255,255,0.5)" />
            <Text style={styles.centeredText}>
              No flash deals available right now. Check back soon.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.85}
              onPress={() => {
                loadedRef.current = false;
                void loadFlashProducts();
              }}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={flashState.active ? flashPicks : products}
            numColumns={2}
            keyExtractor={(item) => String(item?.id || item?.handle)}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              flashState.active ? (
                <Text style={styles.gridTitle}>⚡ Today's flash picks</Text>
              ) : (
                <Text style={styles.gridTitle}>🔥 All flash deals</Text>
              )
            }
            renderItem={({ item }) => (
              <FlashDealCard product={item} onPress={() => router.push(`/product/${item.handle}` as any)} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function FlashDealCard({
  product,
  onPress,
}: {
  product: any;
  onPress: () => void;
}) {
  const discount = product?.discount ?? null;
  const imageUrl = product?.image;
  const progress =
    product?.totalStock && product?.soldCount
      ? Math.min(product.soldCount / product.totalStock, 1)
      : 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.cardImageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="image-outline" size={30} color="rgba(255,255,255,0.4)" />
          </View>
        )}
        {discount != null ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discount}%</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {product?.title}
        </Text>

        <View style={styles.cardPriceRow}>
          {product?.compareAt ? (
            <Text style={styles.cardOldPrice}>${Number(product.compareAt).toFixed(2)}</Text>
          ) : null}
          <Text style={styles.cardPrice}>
            ${Number(product?.price || 0).toFixed(2)}
          </Text>
        </View>

        {product?.totalStock ? (
          <View style={styles.cardProgressTrack}>
            <View
              style={[
                styles.cardProgressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
        ) : null}
        {product?.soldCount ? (
          <Text style={styles.cardSold}>
            {product.soldCount.toLocaleString()} sold
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  headerSpacer: { width: 40 },

  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#ff6a00',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  countdownRow: {
    marginTop: 16,
  },
  countdownSegment: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 48,
  },
  countdownNumber: {
    fontSize: 18,
    lineHeight: 22,
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.65)',
  },
  countdownColon: {
    fontSize: 18,
  },
  progressWrap: {
    marginTop: 16,
    width: '100%',
    maxWidth: 320,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6a00',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  centeredText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: '#ff6a00',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  gridContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 4,
  },

  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 12,
  },
  cardImageWrap: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    minHeight: 34,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  cardOldPrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  cardPrice: {
    color: '#ff9a3d',
    fontSize: 16,
    fontWeight: '900',
  },
  cardProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  cardProgressFill: {
    height: '100%',
    backgroundColor: '#ff6a00',
    borderRadius: 2,
  },
  cardSold: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
  },
});
