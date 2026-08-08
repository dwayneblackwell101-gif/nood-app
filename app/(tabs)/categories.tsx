import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { getBackendJson } from '../../utils/backend';

/**
 * Categories — Temu-exact sidebar layout.
 *
 * LEFT: clean text sidebar with your real Shopify menu categories.
 * RIGHT: circular subcategory tiles with product images.
 *
 * Structure mirrors Temu exactly: sidebar + "Shop by category" grid.
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Category = {
  id: string;
  title: string;
  handle: string;
  image: string;
  subcategories: Subcategory[];
};

type Subcategory = {
  id: string;
  title: string;
  handle: string;
  image: string;
};

const MENU_HANDLES = ['main-menu', 'header-menu', 'primary-menu', 'main-navigation', 'nood-app-categories'];

// ─── Real fallback subcategories from YOUR Shopify menu ───────────────

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 'men', title: 'Men', handle: 'men', image: '',
    subcategories: [
      { id: 'casablanca', title: 'Casablanca', handle: 'casablanca-collection', image: '' },
      { id: 'chrome', title: 'Chrome of Hearts', handle: 'chrome-of-hearts-collection', image: '' },
      { id: 'denim-tears', title: 'Denim Tears', handle: 'denim-tears-collection', image: '' },
      { id: 'rick-owens', title: 'Rick Owens', handle: 'rick-owens-collection', image: '' },
      { id: 'rhude', title: 'Rhude', handle: 'rhude-collection', image: '' },
      { id: 'human-made', title: 'Human Made', handle: 'human-made-collection', image: '' },
      { id: 'essential', title: 'Essentials', handle: 'essentials-collection', image: '' },
      { id: 'bape', title: 'Bape', handle: 'bape-collection', image: '' },
      { id: 'tops', title: 'Tops & Tees', handle: 'tops', image: '' },
      { id: 'pants', title: 'Pants & Shorts', handle: 'pants', image: '' },
      { id: 'outerwear', title: 'Outerwear', handle: 'outerwear', image: '' },
      { id: 'shoes', title: 'Shoes', handle: 'shoes', image: '' },
      { id: 'activewear', title: 'Activewear', handle: 'activewear', image: '' },
      { id: 'accessories', title: 'Accessories', handle: 'accessories', image: '' },
      { id: 'jewelry', title: 'Jewelry', handle: 'jewelry', image: '' },
      { id: 'watches', title: 'Watches', handle: 'watches', image: '' },
      { id: 'sneakers', title: 'Sneakers', handle: 'sneakers', image: '' },
      { id: 'formal', title: 'Formal', handle: 'formal', image: '' },
      { id: 'jackets', title: 'Jackets', handle: 'jackets', image: '' },
    ],
  },
  {
    id: 'women', title: 'Women', handle: 'women', image: '',
    subcategories: [
      { id: 'dresses', title: 'Dresses & Jumpsuit', handle: 'dresses', image: '' },
      { id: 'tops', title: 'Tops & Blouses', handle: 'tops-blouses', image: '' },
      { id: 'jeans', title: 'Jeans, Pants & Skirts', handle: 'jeans-pants', image: '' },
      { id: 'jackets', title: 'Jackets', handle: 'jackets', image: '' },
      { id: 'active', title: 'Activewear / Gym Sets', handle: 'activewear-gym-sets', image: '' },
      { id: 'loungewear', title: 'Loungewear / Pajamas', handle: 'loungwear-pajamas', image: '' },
      { id: 'two-piece', title: 'Two-Piece Sets', handle: 'two-piece-sets', image: '' },
    ],
  },
  {
    id: 'kids', title: 'Kids', handle: 'kids', image: '',
    subcategories: [
      { id: 'k-clothing', title: 'Clothing', handle: 'clothing-1', image: '' },
      { id: 'k-shoes', title: 'Shoes', handle: 'kids-shoes', image: '' },
      { id: 'k-bags', title: 'Bags', handle: 'bags-kids', image: '' },
    ],
  },
  {
    id: 'shoes', title: 'Shoes', handle: 'shoes', image: '',
    subcategories: [
      { id: 's-sneakers', title: 'Sneakers', handle: 'sneakers', image: '' },
      { id: 's-boots', title: 'Boots', handle: 'boots', image: '' },
      { id: 's-sandals', title: 'Sandals', handle: 'sandals', image: '' },
      { id: 's-slides', title: 'Slides', handle: 'slides', image: '' },
      { id: 's-heels', title: 'Heels', handle: 'heels', image: '' },
      { id: 's-formal', title: 'Formal', handle: 'formal-shoes', image: '' },
      { id: 's-running', title: 'Running', handle: 'running-shoes', image: '' },
      { id: 's-casual', title: 'Casual', handle: 'casual-shoes', image: '' },
      { id: 's-flats', title: 'Flats', handle: 'flats', image: '' },
      { id: 's-training', title: 'Training', handle: 'training-shoes', image: '' },
    ],
  },
  {
    id: 'electronics', title: 'Electronics', handle: 'electronics', image: '',
    subcategories: [
      { id: 'e-headphones', title: 'Headphones', handle: 'headphones', image: '' },
      { id: 'e-speakers', title: 'Speakers', handle: 'speakers', image: '' },
      { id: 'e-phones', title: 'Phones', handle: 'phones', image: '' },
      { id: 'e-tablets', title: 'Tablets', handle: 'tablets', image: '' },
      { id: 'e-chargers', title: 'Chargers', handle: 'chargers', image: '' },
      { id: 'e-cables', title: 'Cables', handle: 'cables', image: '' },
      { id: 'e-cameras', title: 'Cameras', handle: 'cameras', image: '' },
      { id: 'e-gaming', title: 'Gaming', handle: 'gaming', image: '' },
      { id: 'e-earbuds', title: 'Earbuds', handle: 'earbuds', image: '' },
      { id: 'e-smart', title: 'Smart Home', handle: 'smart-home', image: '' },
      { id: 'e-laptop', title: 'Laptops', handle: 'laptops', image: '' },
      { id: 'e-accessories', title: 'Accessories', handle: 'electronics-accessories', image: '' },
    ],
  },
  {
    id: 'accessories', title: 'Accessories', handle: 'accessories', image: '',
    subcategories: [
      { id: 'a-watches', title: 'Watches', handle: 'watches', image: '' },
      { id: 'a-jewelry', title: 'Jewelry', handle: 'jewelry', image: '' },
      { id: 'a-bags', title: 'Bags', handle: 'bags', image: '' },
      { id: 'a-sunglasses', title: 'Sunglasses', handle: 'sunglasses', image: '' },
      { id: 'a-hats', title: 'Hats', handle: 'hats', image: '' },
      { id: 'a-scarves', title: 'Scarves', handle: 'scarves', image: '' },
      { id: 'a-belts', title: 'Belts', handle: 'belts', image: '' },
      { id: 'a-wallets', title: 'Wallets', handle: 'wallets', image: '' },
      { id: 'a-purses', title: 'Purses', handle: 'purses', image: '' },
      { id: 'a-phone-cases', title: 'Phone Cases', handle: 'phone-cases', image: '' },
    ],
  },
  {
    id: 'beauty', title: 'Beauty', handle: 'beauty', image: '',
    subcategories: [
      { id: 'b-hair', title: 'Hair & Wigs', handle: 'hair-wigs', image: '' },
      { id: 'b-skin', title: 'Skincare', handle: 'skincare', image: '' },
      { id: 'b-makeup', title: 'Makeup', handle: 'makeup', image: '' },
      { id: 'b-fragrance', title: 'Fragrance', handle: 'fragrance', image: '' },
      { id: 'b-tools', title: 'Tools', handle: 'beauty-tools', image: '' },
      { id: 'b-body', title: 'Body Care', handle: 'body-care', image: '' },
    ],
  },
  {
    id: 'construction', title: 'Construction & Equipment', handle: 'construction-equipment', image: '',
    subcategories: [
      { id: 'c-hand', title: 'Hand Tools', handle: 'hand-tools', image: '' },
      { id: 'c-power', title: 'Power Tools', handle: 'power-tools', image: '' },
      { id: 'c-generators', title: 'Generators', handle: 'generators', image: '' },
      { id: 'c-safety', title: 'Safety Gear', handle: 'safety-gear', image: '' },
      { id: 'c-measuring', title: 'Measuring', handle: 'measuring', image: '' },
      { id: 'c-plumbing', title: 'Plumbing', handle: 'plumbing', image: '' },
      { id: 'c-electrical', title: 'Electrical', handle: 'electrical', image: '' },
      { id: 'c-hardware', title: 'Hardware', handle: 'hardware', image: '' },
      { id: 'c-storage', title: 'Storage', handle: 'storage', image: '' },
      { id: 'c-lighting', title: 'Lighting', handle: 'lighting', image: '' },
      { id: 'c-lawn', title: 'Lawn & Garden', handle: 'lawn-garden', image: '' },
      { id: 'c-outdoor', title: 'Outdoor Recreation', handle: 'outdoor-recreation', image: '' },
    ],
  },
];

// ─── Icons per subcategory (for circles without images) ────────────────

const SUB_ICONS: Record<string, string> = {
  tops: 'shirt-outline',
  shirts: 'shirt-outline',
  blouses: 'shirt-outline',
  tshirt: 'shirt-outline',
  outerwear: 'jacket-outline',
  jackets: 'jacket-outline',
  suits: 'shirt-outline',
  sets: 'shirt-outline',
  dresses: 'woman-outline',
  jumpsuit: 'woman-outline',
  skirt: 'woman-outline',
  pants: 'reader-outline',
  jeans: 'reader-outline',
  shorts: 'reader-outline',
  bottoms: 'reader-outline',
  shoes: 'footsteps-outline',
  sneakers: 'footsteps-outline',
  boots: 'footsteps-outline',
  sandals: 'footsteps-outline',
  heels: 'footsteps-outline',
  slides: 'footsteps-outline',
  flats: 'footsteps-outline',
  running: 'footsteps-outline',
  training: 'footsteps-outline',
  formal: 'shirt-outline',
  casual: 'shirt-outline',
  bags: 'bag-handle-outline',
  purses: 'bag-handle-outline',
  wallets: 'wallet-outline',
  hat: 'hat-outline',
  hats: 'hat-outline',
  jewelry: 'diamond-outline',
  necklaces: 'diamond-outline',
  watches: 'watch-outline',
  headphones: 'headset-outline',
  earbuds: 'headset-outline',
  speakers: 'volume-high-outline',
  phones: 'phone-portrait-outline',
  phone: 'phone-portrait-outline',
  cases: 'phone-portrait-outline',
  tablets: 'tablet-portrait-outline',
  laptop: 'laptop-outline',
  chargers: 'battery-charging-outline',
  cables: 'link-outline',
  gaming: 'game-controller-outline',
  cameras: 'camera-outline',
  smart: 'home-outline',
  hair: 'cut-outline',
  wig: 'cut-outline',
  skincare: 'leaf-outline',
  skin: 'leaf-outline',
  makeup: 'color-palette-outline',
  fragrance: 'flask-outline',
  tools: 'construct-outline',
  hand: 'construct-outline',
  power: 'flash-outline',
  generators: 'battery-charging-outline',
  safety: 'shield-checkmark-outline',
  measuring: 'resize-outline',
  plumbing: 'water-outline',
  electrical: 'flash-outline',
  hardware: 'hardware-chip-outline',
  storage: 'folder-outline',
  lighting: 'bulb-outline',
  lawn: 'flower-outline',
  construction: 'construct-outline',
  activewear: 'fitness-outline',
  active: 'fitness-outline',
  gym: 'barbell-outline',
  fitness: 'barbell-outline',
  swim: 'water-outline',
  sports: 'football-outline',
  tennis: 'football-outline',
  basketball: 'basketball-outline',
  soccer: 'football-outline',
  ski: 'snow-outline',
  snow: 'snow-outline',
  snowboard: 'snow-outline',
  hiking: 'compass-outline',
  outdoor: 'sunny-outline',
  recreation: 'compass-outline',
  fishing: 'fish-outline',
  cycling: 'bicycle-outline',
  yoga: 'fitness-outline',
  sunglasses: 'sunglasses-outline',
  scarves: 'ribbon-outline',
  belts: 'link-outline',
  body: 'fitness-outline',
};

function getSubIcon(title: string): string {
  const t = title.toLowerCase();
  for (const [key, icon] of Object.entries(SUB_ICONS)) {
    if (t.includes(key)) return icon;
  }
  return 'grid-outline';
}

// ─── Build categories from Shopify menu (or fallback) ────────────────

function buildCategoriesFromMenu(menu: any): Category[] {
  const items = Array.isArray(menu?.items) ? menu.items : [];
  const NON_CATEGORY = new Set(['home', 'about us', 'order tracking', 'contact', 'search', 'account', 'cart']);
  const categories: Category[] = [];

  for (const top of items) {
    const title = String(top?.title || '').trim();
    const key = title.toLowerCase();
    if (!title || NON_CATEGORY.has(key)) continue;
    const handle = String(top?.resource?.handle || '').trim();
    const subItems = Array.isArray(top?.items) ? top.items : [];
    const subcategories: Subcategory[] = [];
    for (const sub of subItems) {
      const subTitle = String(sub?.title || '').trim();
      const subHandle = String(sub?.resource?.handle || '').trim();
      if (!subTitle && !subHandle) continue;
      subcategories.push({
        id: subHandle || subTitle,
        title: subTitle,
        handle: subHandle,
        image: String(sub?.resource?.image?.url || ''),
      });
    }
    categories.push({
      id: handle || key,
      title,
      handle,
      image: String(top?.resource?.image?.url || ''),
      subcategories,
    });
  }
  return categories;
}

// ─── Screen ───────────────────────────────────────────────────────────

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  const loadMenu = useCallback(async () => {
    for (const handle of MENU_HANDLES) {
      try {
        const data = await getBackendJson<any>(`/api/catalog/menus/${handle}`, { timeoutMs: 8000, quiet: true });
        const menu = data?.data?.menu;
        if (menu) {
          const built = buildCategoriesFromMenu(menu);
          if (built.length) { setCategories(built); setActiveIdx(0); return built; }
        }
      } catch {}
    }
    setCategories(FALLBACK_CATEGORIES);
    return FALLBACK_CATEGORIES;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => { await loadMenu(); if (!cancelled) setLoading(false); })();
    return () => { cancelled = true; };
  }, [loadMenu]);

  const activeCategory = categories[activeIdx] || categories[0] || null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header — matches Temu exactly */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      {/* Temu-style sidebar + grid */}
      <View style={styles.body}>
        {/* LEFT SIDEBAR — clean text, no icon circles */}
        <ScrollView
          style={styles.sidebar}
          contentContainerStyle={styles.sidebarInner}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((cat, i) => {
            const active = i === activeIdx;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.sidebarItem, active && styles.sidebarItemActive]}
                activeOpacity={0.8}
                onPress={() => setActiveIdx(i)}
              >
                {active && <View style={styles.sidebarAccent} />}
                <Text style={[styles.sidebarText, active && styles.sidebarTextActive]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* RIGHT CONTENT — "Shop by category" + circle tiles */}
        <View style={styles.right}>
          <Text style={styles.rightTitle}>Shop by category</Text>

          <FlatList
            data={activeCategory?.subcategories || []}
            numColumns={3}
            keyExtractor={(s) => s.id}
            contentContainerStyle={styles.tileList}
            columnWrapperStyle={styles.tileRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: sub }) => {
              const icon = getSubIcon(sub.title);

              return (
                <TouchableOpacity
                  style={styles.tile}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (sub.handle) {
                      router.push({
                        pathname: '/collection/[handle]',
                        params: { handle: sub.handle, from: 'categories' } as any,
                      });
                    }
                  }}
                >
                  <View style={styles.tileCircle}>
                    {sub.image ? (
                      <Image source={{ uri: sub.image }} style={styles.tileImage} resizeMode="cover" />
                    ) : (
                      <Ionicons name={icon as any} size={30} color="#b0b0b0" />
                    )}
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={2}>{sub.title}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles — Temu-exact layout ──────────────────────────────────────

const SIDEBAR_W = 95;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },

  // Body
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar (left)
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  sidebarInner: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  sidebarItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: '#f8f8f8',
    borderLeftColor: '#ff6a00',
  },
  sidebarAccent: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: '#ff6a00',
  },
  sidebarText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    lineHeight: 17,
  },
  sidebarTextActive: {
    color: '#111',
    fontWeight: '700',
  },

  // Right content
  right: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 80,
  },
  rightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },

  // Tile grid
  tileList: {
    paddingBottom: 20,
  },
  tileRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tile: {
    width: '30%',
    alignItems: 'center',
  },
  tileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f3f3',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileLabel: {
    marginTop: 8,
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
});