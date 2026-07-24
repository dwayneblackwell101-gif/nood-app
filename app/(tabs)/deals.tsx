import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  fetchShopifyCollectionProducts,
  type ShopifyListResult,
} from '../../utils/shopify-catalog';

const COLLECTION_HANDLE = 'deals';
const PRODUCTS_PER_PAGE = 30;

function getDiscountPercent(price: string | undefined, compareAt: string | undefined): number | null {
  const p = Number(price);
  const c = Number(compareAt);
  if (!p || !c || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}

function formatPrice(amount: string | undefined, currency: string = 'USD'): string {
  const num = Number(amount);
  if (!num) return '';
  return `$${num.toFixed(2)}`;
}

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts(after?: string | null) {
    try {
      const result = await fetchShopifyCollectionProducts(COLLECTION_HANDLE, {
        first: PRODUCTS_PER_PAGE,
        after,
      });
      const edges = result?.collectionByHandle?.products?.edges || [];
      const pageInfo = result?.collectionByHandle?.products?.pageInfo;
      const newProducts = edges.map((e: any) => e.node).filter(Boolean);

      if (after) {
        setProducts((prev) => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
      setHasMore(Boolean(pageInfo?.hasNextPage));
      setCursor(pageInfo?.endCursor || null);
    } catch (error) {
      console.log('[DEALS] load error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DEALS</Text>
        <View style={styles.headerBadge}>
          <Ionicons name="flash" size={14} color="#fff" />
          <Text style={styles.headerBadgeText}>Flash Sale</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ff6a00" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="pricetag-outline" size={56} color="#ddd" />
          <Text style={styles.emptyTitle}>Deals coming soon</Text>
          <Text style={styles.emptyBody}>
            We're loading up exclusive offers. Check back soon for flash sales and discounts.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {/* Flash Sale Banner */}
          <View style={styles.flashBanner}>
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={styles.flashBannerText}>Today's Best Deals</Text>
          </View>

          {/* Product Grid */}
          {products.map((product: any) => {
            const price = product.priceRange?.minVariantPrice?.amount;
            const compareAt = product.compareAtPriceRange?.maxVariantPrice?.amount;
            const discount = getDiscountPercent(price, compareAt);
            const imageUrl = product.featuredImage?.url || product.images?.edges?.[0]?.node?.url;

            return (
              <TouchableOpacity
                key={product.id || product.handle}
                style={styles.productCard}
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${product.handle}` as any)}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder]}>
                    <Ionicons name="image-outline" size={32} color="#ccc" />
                  </View>
                )}

                {discount != null && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
                  </View>
                )}

                <View style={styles.productInfo}>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {product.title || 'Product'}
                  </Text>
                  <View style={styles.priceRow}>
                    {discount != null && compareAt && (
                      <Text style={styles.oldPrice}>{formatPrice(compareAt)}</Text>
                    )}
                    <Text style={styles.currentPrice}>{formatPrice(price)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {hasMore && (
            <TouchableOpacity style={styles.loadMore} onPress={() => loadProducts(cursor)}>
              <Text style={styles.loadMoreText}>Load more deals</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111' },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6a00',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#333', marginTop: 16 },
  emptyBody: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6a00',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  flashBannerText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  grid: { paddingHorizontal: 14, paddingBottom: 100 },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productImage: { width: '100%', height: 180, backgroundColor: '#f0f0f0' },
  productImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  productInfo: { padding: 12 },
  productTitle: { fontSize: 14, fontWeight: '600', color: '#111', lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  oldPrice: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
  currentPrice: { fontSize: 16, fontWeight: '800', color: '#ff6a00' },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  loadMoreText: { color: '#ff6a00', fontSize: 14, fontWeight: '700' },
});
