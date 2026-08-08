import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { fetchShopifyCollectionProducts } from '../../utils/shopify-catalog';
import { mapShopifyNodesToDealsCards } from '../../utils/deals-product-mapper';
import { FlashSaleBanner } from '../../components/FlashSaleBanner';
import { CouponDealsPanel } from '../../components/CouponDealsPanel';

// ─── Constants & Dummy Data ──────────────────────────────────────────────
const COLLECTION_HANDLE = 'deals';
const PRODUCTS_PER_PAGE = 20;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Type for icon names to fix TypeScript error
type IoniconsName =
  | 'apps'
  | 'phone-portrait'
  | 'shirt'
  | 'home'
  | 'sparkles'
  | 'fitness'
  | 'game-controller';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' as IoniconsName },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait' as IoniconsName },
  { id: 'fashion', label: 'Fashion', icon: 'shirt' as IoniconsName },
  { id: 'home', label: 'Home & Garden', icon: 'home' as IoniconsName },
  { id: 'beauty', label: 'Beauty', icon: 'sparkles' as IoniconsName },
  { id: 'sports', label: 'Sports', icon: 'fitness' as IoniconsName },
  { id: 'toys', label: 'Toys', icon: 'game-controller' as IoniconsName },
];

// Dummy products for immediate beautiful UI (will be replaced by Shopify data)
const DUMMY_PRODUCTS = [
  {
    id: 'd1',
    handle: 'wireless-earbuds-pro',
    title: 'Wireless Earbuds Pro - Noise Cancelling',
    price: '29.99',
    compareAt: '79.99',
    discount: 62,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    soldCount: 2847,
    totalStock: 5000,
    category: 'electronics',
    endingSoon: true,
  },
  {
    id: 'd2',
    handle: 'smart-watch-series-5',
    title: 'Smart Watch Series 5 - Fitness Tracker',
    price: '45.99',
    compareAt: '129.99',
    discount: 65,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    soldCount: 1923,
    totalStock: 3000,
    category: 'electronics',
    endingSoon: true,
  },
  {
    id: 'd3',
    handle: 'oversized-hoodie',
    title: 'Oversized Cotton Hoodie - Unisex',
    price: '18.99',
    compareAt: '49.99',
    discount: 62,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    soldCount: 5632,
    totalStock: 8000,
    category: 'fashion',
    endingSoon: false,
  },
  {
    id: 'd4',
    handle: 'robot-vacuum-cleaner',
    title: 'Robot Vacuum Cleaner - Smart Mapping',
    price: '159.99',
    compareAt: '399.99',
    discount: 60,
    image: 'https://images.unsplash.com/photo-1558317986-39e8e9e8c83c?w=400&h=400&fit=crop',
    soldCount: 847,
    totalStock: 2000,
    category: 'home',
    endingSoon: true,
  },
  {
    id: 'd5',
    handle: 'led-strip-lights',
    title: 'LED Strip Lights 50ft - Music Sync',
    price: '12.99',
    compareAt: '34.99',
    discount: 63,
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=400&fit=crop',
    soldCount: 12456,
    totalStock: 20000,
    category: 'home',
    endingSoon: false,
  },
  {
    id: 'd6',
    handle: 'portable-blender',
    title: 'Portable Blender - USB Rechargeable',
    price: '24.99',
    compareAt: '59.99',
    discount: 58,
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop',
    soldCount: 3211,
    totalStock: 6000,
    category: 'home',
    endingSoon: true,
  },
  {
    id: 'd7',
    handle: 'yoga-mat-premium',
    title: 'Premium Yoga Mat - Non Slip Extra Thick',
    price: '15.99',
    compareAt: '39.99',
    discount: 60,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
    soldCount: 4521,
    totalStock: 7500,
    category: 'sports',
    endingSoon: false,
  },
  {
    id: 'd8',
    handle: 'wireless-charger-3in1',
    title: '3-in-1 Wireless Charger Stand',
    price: '22.99',
    compareAt: '59.99',
    discount: 62,
    image: 'https://images.unsplash.com/photo-1615935731032-53cd91d1d2d3?w=400&h=400&fit=crop',
    soldCount: 6782,
    totalStock: 10000,
    category: 'electronics',
    endingSoon: false,
  },
  {
    id: 'd9',
    handle: 'makeup-brush-set',
    title: '15-Piece Makeup Brush Set - Vegan',
    price: '14.99',
    compareAt: '45.99',
    discount: 67,
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop',
    soldCount: 8934,
    totalStock: 15000,
    category: 'beauty',
    endingSoon: true,
  },
  {
    id: 'd10',
    handle: 'building-blocks-set',
    title: 'Magnetic Building Blocks 100pcs',
    price: '26.99',
    compareAt: '69.99',
    discount: 61,
    image: 'https://images.unsplash.com/photo-1587654780291-398ea4407476?w=400&h=400&fit=crop',
    soldCount: 3456,
    totalStock: 5000,
    category: 'toys',
    endingSoon: false,
  },
  {
    id: 'd11',
    handle: 'resistance-bands-set',
    title: 'Resistance Bands Set - 5 Levels',
    price: '11.99',
    compareAt: '29.99',
    discount: 60,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    soldCount: 7821,
    totalStock: 12000,
    category: 'sports',
    endingSoon: false,
  },
  {
    id: 'd12',
    handle: 'hair-dryer-ionic',
    title: 'Ionic Hair Dryer - Fast Dry Low Noise',
    price: '34.99',
    compareAt: '89.99',
    discount: 61,
    image: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop',
    soldCount: 2156,
    totalStock: 4000,
    category: 'beauty',
    endingSoon: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
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

// ─── Components ──────────────────────────────────────────────────────────

// Countdown Timer with animated numbers
const CountdownTimer: React.FC<{ initialSeconds: number }> = ({ initialSeconds }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setPulse(true);
          setTimeout(() => setPulse(false), 500);
          return initialSeconds; // Loop for demo
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [initialSeconds]);

  const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  return (
    <View style={styles.countdownContainer}>
      <Animated.View style={[styles.countdownSegment, { transform: [{ scale: pulse ? 1.15 : 1 }] }]}>
        <Text style={styles.countdownNumber}>{hrs}</Text>
        <Text style={styles.countdownLabel}>HR</Text>
      </Animated.View>
      <Text style={styles.countdownColon}>:</Text>
      <Animated.View style={[styles.countdownSegment, { transform: [{ scale: pulse ? 1.15 : 1 }] }]}>
        <Text style={styles.countdownNumber}>{mins}</Text>
        <Text style={styles.countdownLabel}>MIN</Text>
      </Animated.View>
      <Text style={styles.countdownColon}>:</Text>
      <Animated.View style={[styles.countdownSegment, { transform: [{ scale: pulse ? 1.15 : 1 }] }]}>
        <Text style={styles.countdownNumber}>{secs}</Text>
        <Text style={styles.countdownLabel}>SEC</Text>
      </Animated.View>
    </View>
  );
};

// Category Chip with animated selection
const CategoryChip: React.FC<{
  label: string;
  icon: IoniconsName;
  selected: boolean;
  onPress: () => void;
  index: number;
}> = ({ label, icon, selected, onPress, index }) => {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={styles.chipWrapper}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: selected ? '#ff6a00' : '#fff',
            borderColor: selected ? '#ff6a00' : '#e8e8e8',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={selected ? '#fff' : '#666'}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.chipText,
            { color: selected ? '#fff' : '#333', fontWeight: selected ? '800' : '600' },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Product Card with progress bar, animations
const ProductCard: React.FC<{
  product: any;
  index: number;
  onPress: () => void;
}> = ({ product, index, onPress }) => {
  const [showContent, setShowContent] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = index * 60;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(translateAnim, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.back(1.2)) }),
      ]).start();
    }, delay);
  }, [index, fadeAnim, translateAnim]);

  const discount = product.discount ?? getDiscountPercent(product.price, product.compareAt);
  const progress = product.totalStock ? product.soldCount / product.totalStock : 0;
  const isAlmostGone = progress > 0.7;
  const imageUrl = product.image || product.featuredImage?.url || product.images?.edges?.[0]?.node?.url;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.productCard, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="image-outline" size={36} color="#ddd" />
          </View>
        )}

        {/* Discount Badge */}
        {discount != null && (
          <View style={[styles.discountBadge, { backgroundColor: '#ff3b30' }]}>
            <Text style={styles.discountBadgeText}>-{discount}%</Text>
          </View>
        )}

        {/* Ending Soon Badge */}
        {product.endingSoon && (
          <View style={styles.endingSoonBadge}>
            <Ionicons name="flash" size={10} color="#fff" style={{ marginRight: 2 }} />
            <Text style={styles.endingSoonText}>Ending Soon</Text>
          </View>
        )}

        {/* Flash Sale Ribbon for limited time offers */}
        {product.endingSoon && index < 3 && (
          <View style={styles.flashRibbon}>
            <Ionicons name="flash" size={10} color="#fff" style={{ marginRight: 2 }} />
            <Text style={styles.flashRibbonText}>FLASH SALE</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Progress Bar / Sold Count */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: isAlmostGone ? '#ff3b30' : '#ff6a00' },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: isAlmostGone ? '#ff3b30' : '#666' }]}>
              {Math.round(progress * 100)}% claimed
            </Text>
            <Text style={styles.progressLabelRight}>
              {product.soldCount.toLocaleString()} sold
            </Text>
          </View>
        </View>

        {/* Almost Gone Label */}
        {isAlmostGone && (
          <View style={styles.almostGoneBadge}>
            <Ionicons name="alert-circle" size={12} color="#ff3b30" style={{ marginRight: 4 }} />
            <Text style={styles.almostGoneText}>Almost Gone - Only {product.totalStock - product.soldCount} left!</Text>
          </View>
        )}

        {/* Price Row */}
        <View style={styles.priceRow}>
          {discount != null && product.compareAt && (
            <Text style={styles.oldPrice}>{formatPrice(product.compareAt)}</Text>
          )}
          <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Limited Time Offer Card (Horizontal scroll)
const LimitedTimeCard: React.FC<{ product: any; index: number; onPress: () => void }> = ({
  product,
  index,
  onPress,
}) => {
  const discount = product.discount ?? getDiscountPercent(product.price, product.compareAt);
  const imageUrl = product.image || product.featuredImage?.url || product.images?.edges?.[0]?.node?.url;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.limitedCard}>
      <View style={styles.limitedImageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.limitedImage} resizeMode="cover" />
        ) : (
          <View style={[styles.limitedImage, styles.limitedImagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color="#ddd" />
          </View>
        )}
        {discount != null && (
          <View style={[styles.discountBadge, { backgroundColor: '#ff3b30', top: 8, left: 8 }]}>
            <Text style={styles.discountBadgeText}>-{discount}%</Text>
          </View>
        )}
        <View style={styles.limitedFlashBadge}>
          <Ionicons name="flash" size={10} color="#fff" style={{ marginRight: 2 }} />
          <Text style={styles.limitedFlashText}>Limited Time</Text>
        </View>
      </View>
      <View style={styles.limitedInfo}>
        <Text style={styles.limitedTitle} numberOfLines={1}>{product.title}</Text>
        <View style={styles.limitedPriceRow}>
          {product.compareAt && discount != null && (
            <Text style={styles.limitedOldPrice}>{formatPrice(product.compareAt)}</Text>
          )}
          <Text style={styles.limitedCurrentPrice}>{formatPrice(product.price)}</Text>
        </View>
        <View style={styles.limitedProgress}>
          <View style={styles.limitedProgressTrack}>
            <View
              style={{
                ...styles.limitedProgressFill,
                width: `${Math.min((product.soldCount / product.totalStock) * 100, 100)}%`,
              }}
            />
          </View>
          <Text style={styles.limitedProgressText}>
            {Math.round((product.soldCount / product.totalStock) * 100)}% claimed
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────
function DealsScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFlashSale, setShowFlashSale] = useState(true);
  const [countdownSeconds] = useState(23 * 3600 + 59 * 60 + 59); // 23:59:59
  const [headerAnim] = useState(new Animated.Value(0));
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animate header on mount
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [headerAnim]);

  // Load products from Shopify (with fallback to dummy data)
  const loadProducts = async (after?: string | null) => {
    try {
      const result = await fetchShopifyCollectionProducts(COLLECTION_HANDLE, {
        first: PRODUCTS_PER_PAGE,
        after,
      });
      const edges = result?.collectionByHandle?.products?.edges || [];
      const pageInfo = result?.collectionByHandle?.products?.pageInfo;
      const nodes = edges.map((e: any) => e.node).filter(Boolean);

      if (nodes.length > 0) {
        // Map real Shopify nodes into the deals card shape so the UI
        // renders properly (prices, discounts, sold counts).
        const newProducts = mapShopifyNodesToDealsCards(nodes);

        if (after) {
          setProducts((prev) => {
            const seen = new Set(prev.map((p) => p.id || p.handle));
            const unique = newProducts.filter((p) => !seen.has(p.id || p.handle));
            return [...prev, ...unique];
          });
        } else {
          setProducts(newProducts);
        }
      } else if (!after) {
        // Fallback to dummy data if the Shopify collection is empty
        setProducts(DUMMY_PRODUCTS);
      }
      setHasMore(Boolean(pageInfo?.hasNextPage));
      setCursor(pageInfo?.endCursor || null);
    } catch (error) {
      console.log('[DEALS] Load error, using dummy data:', error);
      if (!after) setProducts(DUMMY_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => {
      const cat = String(p.category || '').toLowerCase();
      return cat === selectedCategory || cat.includes(selectedCategory);
    });
  }, [products, selectedCategory]);

  // Get limited time offers (first 5 products with endingSoon)
  const limitedTimeOffers = useMemo(() => {
    return products.filter((p) => p.endingSoon).slice(0, 5);
  }, [products]);

  // Get ending soon products
  const endingSoonProducts = useMemo(() => {
    return products.filter((p) => p.endingSoon).slice(0, 8);
  }, [products]);

  // Get regular deals (non-ending soon)
  const regularDeals = useMemo(() => {
    return filteredProducts.filter((p) => !p.endingSoon);
  }, [filteredProducts]);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Haptic feedback would be nice here
  };

  const handleProductPress = (handle: string) => {
    router.push(`/product/${handle}` as any);
  };

  if (loading && products.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ff6a00" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Deals</Text>
          <View style={styles.headerBadge}>
            <Ionicons name="flash" size={14} color="#fff" />
            <Text style={styles.headerBadgeText}>Flash Sale</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <CountdownTimer initialSeconds={countdownSeconds} />
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Flash Sale Banner */}
        <FlashSaleBanner />
        <CouponDealsPanel />

        {/* Limited Time Offers - Horizontal Scroll */}
        {limitedTimeOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Limited Time Offers</Text>
              <Text style={styles.sectionSubtitle}>{limitedTimeOffers.length} deals ending soon</Text>
            </View>
            <FlatList
              data={limitedTimeOffers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id || item.handle}
              renderItem={({ item, index }) => (
                <LimitedTimeCard
                  product={item}
                  index={index}
                  onPress={() => handleProductPress(item.handle)}
                />
              )}
              contentContainerStyle={styles.horizontalListContent}
              ItemSeparatorComponent={() => <View style={styles.horizontalGap} />}
            />
          </View>
        )}

        {/* Category Chips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Text style={styles.sectionSubtitle}>Shop by department</Text>
          </View>
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <CategoryChip
                label={item.label}
                icon={item.icon}
                selected={selectedCategory === item.id}
                onPress={() => handleCategoryPress(item.id)}
                index={index}
              />
            )}
            contentContainerStyle={styles.horizontalListContent}
            ItemSeparatorComponent={() => <View style={styles.horizontalGap} />}
          />
        </View>

        {/* Ending Soon Section */}
        {endingSoonProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.endingSoonHeaderLeft}>
                <Ionicons name="time" size={18} color="#ff3b30" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>⏰ Ending Soon</Text>
              </View>
              <Text style={styles.sectionSubtitle}>{endingSoonProducts.length} deals expiring</Text>
            </View>
            <FlatList
              data={endingSoonProducts}
              numColumns={2}
              columnWrapperStyle={styles.gridWrapper}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id || item.handle}
              renderItem={({ item, index }) => (
                <ProductCard
                  product={item}
                  index={index}
                  onPress={() => handleProductPress(item.handle)}
                />
              )}
              contentContainerStyle={styles.gridContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={48} color="#ddd" />
                  <Text style={styles.emptyText}>No ending soon deals</Text>
                </View>
              }
            />
          </View>
        )}

        {/* All Deals Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 All Deals</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredProducts.length} products • Up to 70% off
            </Text>
          </View>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={48} color="#ddd" />
              <Text style={styles.emptyTitle}>No deals in this category</Text>
              <Text style={styles.emptyBody}>Try selecting a different category</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              numColumns={2}
              columnWrapperStyle={styles.gridWrapper}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id || item.handle}
              renderItem={({ item, index }) => (
                <ProductCard
                  product={item}
                  index={index}
                  onPress={() => handleProductPress(item.handle)}
                />
              )}
              contentContainerStyle={styles.gridContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="pricetag-outline" size={48} color="#ddd" />
                  <Text style={styles.emptyText}>No deals found</Text>
                </View>
              }
              onEndReached={() => hasMore && loadProducts(cursor)}
              onEndReachedThreshold={0.3}
              legacyImplementation={false}
            />
          )}

          {hasMore && (
            <TouchableOpacity style={styles.loadMore} onPress={() => loadProducts(cursor)}>
              <Animated.Text style={styles.loadMoreText}>Load more deals</Animated.Text>
              <Ionicons name="chevron-down" size={18} color="#ff6a00" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Flash Sale Indicator */}
      {showFlashSale && (
        <Animated.View
          style={[
            styles.floatingFlash,
            {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Ionicons name="flash" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.floatingFlashText}>Flash Sale Ends in 23:59:59</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const CARD_WIDTH = (SCREEN_WIDTH - 14 * 2 - 10) / 2;
const LIMITED_CARD_WIDTH = 200;

const styles = StyleSheet.create({
  // Screen
  screen: { flex: 1, backgroundColor: '#fafafa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6a00',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
  },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  headerRight: { alignItems: 'flex-end' },

  // Countdown
  countdownContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  countdownSegment: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  countdownNumber: { fontSize: 14, fontWeight: '900', color: '#fff', lineHeight: 16 },
  countdownLabel: { fontSize: 7, fontWeight: '700', color: '#888', marginTop: -2 },
  countdownColon: { fontSize: 14, fontWeight: '900', color: '#ff6a00' },

  // Floating Flash Sale
  floatingFlash: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3b30',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#ff3b30',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  floatingFlashText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Scroll Content
  scrollContent: { paddingBottom: 20 },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginBottom: 12 },
  endingSoonHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 12, color: '#888', fontWeight: '600' },

  // Horizontal Lists
  horizontalListContent: { paddingHorizontal: 14, paddingVertical: 4, gap: 10 },
  horizontalGap: { width: 10 },

  // Category Chips
  chipWrapper: { paddingBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  chipText: { fontSize: 13 },

  // Limited Time Card (Horizontal)
  limitedCard: {
    width: LIMITED_CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  limitedImageWrapper: { position: 'relative', width: '100%', height: 140 },
  limitedImage: { width: '100%', height: '100%' },
  limitedImagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  limitedFlashBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  limitedFlashText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  limitedInfo: { padding: 12 },
  limitedTitle: { fontSize: 13, fontWeight: '700', color: '#111', lineHeight: 17 },
  limitedPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  limitedOldPrice: { fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
  limitedCurrentPrice: { fontSize: 15, fontWeight: '900', color: '#ff6a00' },
  limitedProgress: { marginTop: 8 },
  limitedProgressTrack: { height: 4, backgroundColor: '#f0f0f0', borderRadius: 2, overflow: 'hidden' },
  limitedProgressFill: { height: '100%', backgroundColor: '#ff6a00', borderRadius: 2 },
  limitedProgressText: { fontSize: 10, color: '#888', marginTop: 4, fontWeight: '600' },

  // Product Card (Grid)
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  imageWrapper: { position: 'relative', width: '100%', height: 160 },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#ff3b30',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  discountBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  endingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  endingSoonText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  flashRibbon: {
    position: 'absolute',
    top: 45,
    left: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6a00',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    paddingLeft: 14,
  },
  flashRibbonText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  productInfo: { padding: 12 },
  productTitle: { fontSize: 13, fontWeight: '700', color: '#111', lineHeight: 17, letterSpacing: -0.2 },

  // Progress Bar
  progressWrapper: { marginTop: 8 },
  progressBarTrack: { height: 5, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressLabel: { fontSize: 10, fontWeight: '700' },
  progressLabelRight: { fontSize: 10, color: '#888', fontWeight: '600' },

  // Almost Gone Badge
  almostGoneBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  almostGoneText: { color: '#ff3b30', fontSize: 10, fontWeight: '800' },

  // Price Row
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  oldPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  currentPrice: { fontSize: 16, fontWeight: '900', color: '#ff6a00' },

  // Grid
  gridWrapper: { justifyContent: 'space-between' },
  gridContent: { paddingHorizontal: 14, paddingBottom: 20, gap: 10 },

  // Load More
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loadMoreText: { color: '#ff6a00', fontSize: 14, fontWeight: '800' },

  // Empty States
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#333', marginTop: 12 },
  emptyBody: { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
});

export default DealsScreen;