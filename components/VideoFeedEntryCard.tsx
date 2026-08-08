import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

/**
 * Compact "Watch & Shop" entry card for the home feed.
 * Navigates to the full-screen shoppable video feed.
 */
export function VideoFeedEntryCard() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open shoppable video feed"
      onPress={() => router.push('/video-feed' as any)}
      style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}
    >
      <LinearGradient
        colors={['#0f0f23', '#1a1a3e', '#2a1a4e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.playBadge}>
          <Ionicons name="play" size={20} color="#fff" style={{ marginLeft: 2 }} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.kicker}>NEW · WATCH & SHOP</Text>
          <Text style={styles.title}>Shop the videos</Text>
          <Text style={styles.subtitle}>Swipe, tap, and buy straight from the feed</Text>
        </View>

        <View style={styles.avatars}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/vfeed1/200/200' }}
            style={[styles.avatar, styles.avatarBack]}
          />
          <Image
            source={{ uri: 'https://picsum.photos/seed/vfeed2/200/200' }}
            style={[styles.avatar, styles.avatarFront]}
          />
          <Image
            source={{ uri: 'https://picsum.photos/seed/vfeed3/200/200' }}
            style={[styles.avatar, styles.avatarFront]}
          />
        </View>

        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },
  wrapPressed: { opacity: 0.92 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(138,92,255,0.4)',
  },
  playBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  kicker: {
    color: '#b388ff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#1a1a3e',
  },
  avatarBack: {
    position: 'relative',
  },
  avatarFront: {
    marginLeft: -10,
  },
});
