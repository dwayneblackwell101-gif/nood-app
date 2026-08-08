import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type CategoryHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  image?: string;
  video?: any;
  colors: [string, string, string];
  onPress?: () => void;
};

const DEFAULT_SLIDES: CategoryHeroSlide[] = [
  {
    id: 'hero-1',
    eyebrow: 'NEW DROPS',
    title: 'Lace Front Wigs',
    subtitle: 'Natural finish, effortless install',
    video: require('../assets/videos/lace-front-1.mp4'),
    colors: ['#2a0a00', '#8a1c00', '#ff6a00'],
  },
  {
    id: 'hero-2',
    eyebrow: 'STREETWEAR',
    title: 'Men’s New Season',
    subtitle: 'Bold fits. Fresh drops weekly.',
    video: require('../assets/videos/lace-front-2.mp4'),
    colors: ['#0a1228', '#1a2a5a', '#5c31ff'],
  },
  {
    id: 'hero-3',
    eyebrow: 'WOMEN’S EDIT',
    title: 'Elevate Her Look',
    subtitle: 'Dresses, sets & statement pieces',
    video: require('../assets/videos/lace-front-3.mp4'),
    colors: ['#3a0a1e', '#8a1a4a', '#e84393'],
  },
  {
    id: 'hero-4',
    eyebrow: 'CONSTRUCTION',
    title: 'Tools & Equipment',
    subtitle: 'Built for the job, priced for you',
    image: 'https://picsum.photos/seed/tools/900/1200',
    colors: ['#1a1a1a', '#3a3a3a', '#636e72'],
  },
];

/**
 * Premium auto-playing category hero carousel.
 * Supports video + image slides, gradient overlays, animated dots,
 * and auto-advance. Like the Home hero, but on Categories.
 */
export function CategoryHeroCarousel({
  slides = DEFAULT_SLIDES,
  height = 210,
}: {
  slides?: CategoryHeroSlide[];
  height?: number;
}) {
  const listRef = useRef<FlatList<CategoryHeroSlide>>(null);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
  }, [slides.length]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer, index]);

  useEffect(() => {
    if (listRef.current && slides[index]) {
      listRef.current.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: true });
    }
  }, [index, slides]);

  const handleManualScroll = (newIndex: number) => {
    setIndex(newIndex % slides.length);
    startTimer();
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          handleManualScroll(newIndex);
        }}
        renderItem={({ item }) => (
          <CategoryHeroSlideView item={item} width={SCREEN_WIDTH} height={height} />
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((slide, i) => (
          <Dot key={slide.id} active={i === index} />
        ))}
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const scale = useSharedValue(active ? 1.25 : 1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  useEffect(() => {
    scale.value = active ? 1.25 : 1;
  }, [active, scale]);

  return (
    <Animated.View
      style={[
        styles.dot,
        active ? styles.dotActive : styles.dotInactive,
        style,
      ]}
    />
  );
}

function CategoryHeroSlideView({
  item,
  width,
  height,
}: {
  item: CategoryHeroSlide;
  width: number;
  height: number;
}) {
  // Resolve local assets (require() returns a number) to a string URI that
  // expo-video accepts — same pattern as the ShoppableVideoFeed fix.
  const videoUri = React.useMemo(() => {
    if (!item.video) return '';
    if (typeof item.video === 'number') {
      try {
        return Image.resolveAssetSource(item.video)?.uri || '';
      } catch {
        return '';
      }
    }
    return String(item.video);
  }, [item.video]);

  const player = useVideoPlayer({ uri: videoUri } as VideoSource, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (videoUri && player) {
      player.muted = true;
      player.play();
    }
  }, [videoUri, player]);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={[styles.slide, { width, height }]}
      onPress={item.onPress}
    >
      <LinearGradient colors={item.colors} style={styles.slideGradient}>
        {item.video && player ? (
          <VideoView
            player={player}
            style={styles.slideMedia}
            contentFit="cover"
            nativeControls={false}
          />
        ) : item.image ? (
          <Image source={{ uri: item.image }} style={styles.slideMedia} resizeMode="cover" />
        ) : null}
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.55)']}
          style={styles.scrim}
        />
        <View style={styles.slideContent}>
          <View style={styles.eyebrowPill}>
            <Ionicons name="sparkles" size={12} color="#ffd166" />
            <Text style={styles.eyebrow}>{item.eyebrow}</Text>
          </View>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          <View style={styles.slideCta}>
            <Text style={styles.slideCtaText}>Shop now</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
  },
  slide: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  slideGradient: {
    flex: 1,
  },
  slideMedia: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  slideContent: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.5)',
  },
  eyebrow: {
    color: '#ffd166',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  slideTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  slideCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  slideCtaText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: '#fff' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.4)' },
});
