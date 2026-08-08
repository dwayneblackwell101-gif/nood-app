import { useEffect, useRef, memo } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import { useNavigationState } from '@react-navigation/native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

// Reanimated: default export = Animated (with View, Text, Image, etc.)
import Animated from 'react-native-reanimated';
// Named worklet exports
import {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  interpolate,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

const RAINBOW_COLORS = ['#ff3b30', '#ff6a00', '#ffcc00', '#34c759', '#007aff', '#af52de'];

const RainbowDealsIcon = memo(function RainbowDealsIcon({ size }: { size: number }) {
  const colorProgress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    colorProgress.value = withRepeat(
      withTiming(RAINBOW_COLORS.length, { duration: RAINBOW_COLORS.length * 1200 }),
      -1,
      false
    );

    pulseProgress.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const iconColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      RAINBOW_COLORS.map((_, i) => i),
      RAINBOW_COLORS
    ),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseProgress.value, [0, 1], [0.35, 1]),
  }));

  return (
    <Animated.View style={containerStyle}>
      <AnimatedIonicons name="pricetag" size={size} style={iconColorStyle} />
    </Animated.View>
  );
});

function isHomeTabPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/(tabs)' ||
    pathname === '/index' ||
    pathname === '/(tabs)/index'
  );
}

function CartTabIcon({
  color,
  size,
  badge,
}: {
  color: string;
  size: number;
  badge?: string | number;
}) {
  return (
    <View style={styles.cartIconWrap}>
      <Ionicons name="cart" size={size} color={color} />
      {badge != null ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount: cartItemCount } = useCart();
  const { wishlistCount: wishlistItemCount } = useWishlist();
  const backButtonRef = useRef(false);

  const cartBadge = cartItemCount > 0 ? cartItemCount : undefined;
  const wishlistBadge = wishlistItemCount > 0 ? wishlistItemCount : undefined;

  const routes = useNavigationState((state) => state.routes);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routes.length > 1) {
        router.back();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [routes, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff6a00',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          paddingBottom: insets.bottom,
          height: 56 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isHomeTabPath(pathname) ? 'Home' : 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <PlatformPressable {...props} />
          ),
        }}
      />

      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          tabBarIcon: ({ size }) => (
            <RainbowDealsIcon size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <CartTabIcon color={color} size={size} badge={cartBadge} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarBadge: wishlistBadge,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cartIconWrap: {
    width: 30,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});