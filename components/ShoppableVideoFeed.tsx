import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useUser } from '../context/UserContext';
import { getShuffledVideoFeed, type VideoFeedEntry } from '../utils/video-feed-data';
import { fetchShopifyProductDetail } from '../utils/shopify-catalog';
import {
  fetchVideoEngagement,
  toggleVideoLike,
  postVideoComment,
  recordVideoShare,
  type VideoFeedEngagement,
} from '../utils/video-feed-api';

const { width, height } = Dimensions.get('window');

const NOOD_BRAND_LOGO = require('../assets/images/nood-brand-logo.png');

/** NOOD social links — used by the Follow button on videos. */
const NOOD_INSTAGRAM_URL = 'https://www.instagram.com/noodcaribbean';
const NOOD_FACEBOOK_URL = 'https://www.facebook.com/noodcaribbean';
const NOOD_TIKTOK_URL = 'https://www.tiktok.com/@noodcaribbean';

export type VideoFeedItem = {
  id: string;
  videoUri: any; // local require() or remote URL
  thumbnailUri?: string;
  product: {
    id: string;
    title: string;
    handle: string;
    price: string;
    oldPrice?: string;
    image: string;
    discount?: number;
  };
  creator?: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
};

/** Extract a product's image URL from raw Shopify node shapes. */
function getProductImage(product: any): string {
  return (
    product?.featuredImage?.url ||
    product?.images?.edges?.[0]?.node?.url ||
    product?.image ||
    product?.imageUrl ||
    'https://via.placeholder.com/400x400?text=NOOD'
  );
}

/** Format a product's price from raw Shopify node shapes. */
function formatProductPrice(product: any): string {
  const amount =
    product?.priceRange?.minVariantPrice?.amount ||
    product?.variants?.edges?.[0]?.node?.price?.amount ||
    product?.priceAmount ||
    0;
  const currency = product?.priceRange?.minVariantPrice?.currencyCode || 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Number(amount) || 0);
}

/** Format compare-at (old) price if present. */
function formatOldPrice(product: any): string | undefined {
  const amount =
    product?.compareAtPriceRange?.maxVariantPrice?.amount ||
    product?.variants?.edges?.[0]?.node?.compareAtPrice?.amount ||
    product?.oldPriceAmount ||
    undefined;
  if (!amount) return undefined;
  const currency = product?.priceRange?.minVariantPrice?.currencyCode || 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Number(amount));
}

/** Compute discount % from prices if both present. */
function computeDiscount(product: any): number | undefined {
  const price = Number(
    product?.priceRange?.minVariantPrice?.amount ||
      product?.variants?.edges?.[0]?.node?.price?.amount ||
      0
  );
  const old = Number(
    product?.compareAtPriceRange?.maxVariantPrice?.amount ||
      product?.variants?.edges?.[0]?.node?.compareAtPrice?.amount ||
      0
  );
  if (price > 0 && old > price) {
    return Math.round(((old - price) / old) * 100);
  }
  return undefined;
}

/** Build a feed item from a video-feed entry + fetched Shopify product. */
function buildFeedItem(entry: VideoFeedEntry, product: any): VideoFeedItem {
  return {
    id: entry.id,
    videoUri: entry.videoUri,
    thumbnailUri: getProductImage(product),
    product: {
      id: String(product?.id || entry.productHandle),
      title: String(product?.title || 'Product'),
      handle: entry.productHandle,
      price: formatProductPrice(product),
      oldPrice: formatOldPrice(product),
      image: getProductImage(product),
      discount: computeDiscount(product),
    },
    creator: {
      name: entry.creatorName || 'noodshop',
      avatar: 'https://picsum.photos/seed/noodshop/100/100',
      verified: true,
    },
    // Start at 0 — real counts come from the backend engagement API.
    stats: { likes: 0, comments: 0, shares: 0 },
  };
}

/**
 * TikTok-style full-screen shoppable video feed.
 * Used by the /video-feed route (not nested in the home list).
 * Videos + product links come from utils/video-feed-data.ts; product
 * prices/images are fetched live from the Shopify catalog.
 */
export function ShoppableVideoFeed() {
  const router = useRouter();
  const { profileId, isSignedIn } = useUser();
  const userId = isSignedIn && profileId ? profileId : 'guest';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedItems, setFeedItems] = useState<VideoFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductSheet, setShowProductSheet] = useState<VideoFeedItem | null>(null);
  const [showComments, setShowComments] = useState<VideoFeedItem | null>(null);

  // Load feed: video entries → live product details from Shopify.
  useEffect(() => {
    let cancelled = false;

    const loadFeed = async () => {
      const items: VideoFeedItem[] = [];
      // Randomize video order every launch.
      const feed = getShuffledVideoFeed();
      for (const entry of feed) {
        try {
          const result = await fetchShopifyProductDetail(entry.productHandle);
          const product = (result as any)?.productByHandle;
          const base = product
            ? buildFeedItem(entry, product)
            : buildFeedItem(entry, {
                title: entry.caption || 'Shop this look',
                handle: entry.productHandle,
              });

          // Fetch real engagement (likes/comments/shares) from the backend.
          const engagement = await fetchVideoEngagement(entry.id);
          if (engagement) {
            base.stats.likes = engagement.likes;
            base.stats.shares = engagement.shares;
          }
          items.push(base);
        } catch {
          items.push(
            buildFeedItem(entry, {
              title: entry.caption || 'Shop this look',
              handle: entry.productHandle,
            })
          );
        }
      }
      if (!cancelled) {
        setFeedItems(items);
        setLoading(false);
      }
    };

    void loadFeed();
    return () => {
      cancelled = true;
    };
  }, []);

  const listRef = useRef<FlatList<VideoFeedItem>>(null);

  const handleProductPress = useCallback((item: VideoFeedItem) => {
    setShowProductSheet(item);
  }, []);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      const first = viewableItems?.[0];
      if (first?.index != null && first.index !== currentIndex) {
        setCurrentIndex(first.index);
      }
    },
    [currentIndex]
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={feedItems}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <VideoFeedItem
            item={item}
            index={index}
            isActive={index === currentIndex}
            userId={userId}
            onProductPress={handleProductPress}
            onOpenProduct={(item) => router.push(`/product/${item.product.handle}` as any)}
            onOpenComments={(item) => setShowComments(item)}
          />
        )}
      />

      {showProductSheet && (
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowProductSheet(null)} />
          <ProductSheet
            item={showProductSheet}
            onClose={() => setShowProductSheet(null)}
            onBuyNow={() => {
              router.push(`/product/${showProductSheet.product.handle}` as any);
              setShowProductSheet(null);
            }}
          />
        </View>
      )}

      {showComments && (
        <CommentsSheet
          item={showComments}
          userId={userId}
          onClose={() => setShowComments(null)}
        />
      )}
    </View>
  );
}

function VideoFeedItem({
  item,
  isActive,
  userId,
  onProductPress,
  onOpenProduct,
  onOpenComments,
}: {
  item: VideoFeedItem;
  index: number;
  isActive: boolean;
  userId: string;
  onProductPress: (item: VideoFeedItem) => void;
  onOpenProduct: (item: VideoFeedItem) => void;
  onOpenComments: (item: VideoFeedItem) => void;
}) {
  // Real interactive engagement state per video.
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.stats.likes);
  const [comments, setComments] = useState(item.stats.comments);
  const [shares, setShares] = useState(item.stats.shares);
  const [followed, setFollowed] = useState(false);

  // Follow opens NOOD's Instagram profile in the in-app browser.
  const handleFollow = () => {
    void Linking.openURL(NOOD_INSTAGRAM_URL).catch(() => {});
    setFollowed(true);
  };

  // Like: optimistic local update + sync with the backend (shared across users).
  const handleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikes((count) => (next ? count + 1 : Math.max(0, count - 1)));
      return next;
    });

    void toggleVideoLike(item.id, userId).then((result) => {
      if (result) {
        setLiked(result.liked);
        setLikes(result.likes);
      }
    });
  };

  // Share: opens native share sheet; records the share server-side.
  const handleShare = () => {
    void Share.share({
      message: `${item.product.title} — check it out on NOOD! https://noodcaribbean.com/products/${item.product.handle}`,
      title: 'NOOD',
    }).then((result) => {
      if (result.action === Share.sharedAction) {
        setShares((count) => count + 1);
        void recordVideoShare(item.id).then((count) => {
          if (count != null) setShares(count);
        });
      }
    });
  };

  return (
    <View style={styles.itemContainer}>
      {/* Only the ACTIVE video mounts a player (memory safety on Android).
          Inactive items show a poster thumbnail instead. */}
      {isActive ? (
        <ActiveVideoPlayer uri={item.videoUri} />
      ) : (
        <Image
          source={{ uri: String((item as any).thumbnailUri || '') }}
          style={styles.video}
          resizeMode="cover"
        />
      )}

      <View style={styles.scrim} />

      {/* Creator info — NOOD brand logo + account */}
      <View style={styles.creatorInfo}>
        <Image source={NOOD_BRAND_LOGO} style={styles.avatar} resizeMode="contain" />
        <Text style={styles.creatorName}>@noodshop</Text>
        <Ionicons name="checkmark-circle" size={14} color="#ff6a00" />
        <TouchableOpacity
          style={[styles.followButton, followed && styles.followButtonDone]}
          activeOpacity={0.85}
          onPress={handleFollow}
        >
          <Text style={styles.followButtonText}>
            {followed ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={styles.caption}>
        <Text style={styles.captionText}>
          {item.product.title} 💖 #{item.product.handle}
        </Text>
      </View>

      {/* Right actions — real interactive like/comment/share */}
      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.actionButton}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={30}
            color={liked ? '#ff3b30' : '#fff'}
          />
          <Text style={styles.actionCount}>{formatCount(likes)}</Text>
        </Pressable>

        <Pressable onPress={() => onOpenComments(item)} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.actionCount}>{formatCount(comments)}</Text>
        </Pressable>

        <Pressable onPress={handleShare} style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={28} color="#fff" />
          <Text style={styles.actionCount}>{formatCount(shares)}</Text>
        </Pressable>

        <Pressable onPress={() => onProductPress(item)} style={styles.actionButton}>
          <Ionicons name="bag-handle-outline" size={28} color="#fff" />
          <Text style={styles.actionCount}>Shop</Text>
        </Pressable>
      </View>

      {/* Product tag */}
      <Pressable style={styles.productTag} onPress={() => onProductPress(item)}>
        <Image source={{ uri: item.product.image }} style={styles.productTagImage} />
        <View style={styles.productTagInfo}>
          <Text style={styles.productTagTitle} numberOfLines={1}>
            {item.product.title}
          </Text>
          <View style={styles.productTagPrice}>
            <Text style={styles.productTagPriceCurrent}>{item.product.price}</Text>
            {item.product.oldPrice ? (
              <Text style={styles.productTagOldPrice}>{item.product.oldPrice}</Text>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </Pressable>

      {/* Swipe hint */}
      <View style={styles.swipeHint} pointerEvents="none">
        <Ionicons name="chevron-up" size={18} color="rgba(255,255,255,0.5)" />
        <Text style={styles.swipeHintText}>Swipe for more</Text>
      </View>
    </View>
  );
}

function ActionIcon({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.actionButton}>
      <Ionicons name={icon} size={28} color="#fff" />
      <Text style={styles.actionCount}>{label}</Text>
    </View>
  );
}

/**
 * Mounts a native video player ONLY while this item is the active slide.
 * Unmounts when the item scrolls away — releasing the native player and
 * preventing Android memory crashes from many simultaneous players.
 */
function ActiveVideoPlayer({ uri }: { uri: any }) {
  const videoSource = React.useMemo<VideoSource>(() => {
    if (typeof uri === 'number') {
      try {
        return { uri: Image.resolveAssetSource(uri)?.uri || '' } as VideoSource;
      } catch {
        return { uri: '' } as VideoSource;
      }
    }
    return { uri } as VideoSource;
  }, [uri]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    // Play with sound — videos that have audio will be heard.
    p.muted = false;
  });

  useEffect(() => {
    try {
      player.muted = false;
      player.play();
    } catch {
      // player may be released — safe to ignore
    }
    // No cleanup pause: expo-video auto-releases the native player when
    // this component unmounts. Calling pause() on a released player throws
    // "Cannot use shared object that was already released".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

function ProductSheet({
  item,
  onClose,
  onBuyNow,
}: {
  item: VideoFeedItem;
  onClose: () => void;
  onBuyNow: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState('M');

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle} numberOfLines={2}>
            {item.product.title}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: item.product.image }} style={styles.sheetImage} />

        <View style={styles.priceRow}>
          <Text style={styles.sheetPrice}>{item.product.price}</Text>
          {item.product.oldPrice ? (
            <Text style={styles.sheetOldPrice}>{item.product.oldPrice}</Text>
          ) : null}
          {item.product.discount ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.product.discount}%</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sheetDescription}>
          Premium quality, sustainably sourced. Featured by @{item.creator?.name}.
        </Text>

        <Text style={styles.optionLabel}>Size</Text>
        <View style={styles.sizeOptions}>
          {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeOption, selectedSize === size && styles.sizeOptionSelected]}
              onPress={() => setSelectedSize(size)}
            >
              <Text style={styles.sizeOptionText}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.buyNowButton} onPress={onBuyNow} activeOpacity={0.9}>
          <Text style={styles.buyNowText}>Buy Now · {item.product.price}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function CommentsSheet({
  item,
  userId,
  onClose,
}: {
  item: VideoFeedItem;
  userId: string;
  onClose: () => void;
}) {
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<string[]>([]);
  const [commentCount, setCommentCount] = useState(0);

  // Load real comments from the backend on open.
  useEffect(() => {
    let cancelled = false;
    void fetchVideoEngagement(item.id).then((engagement) => {
      if (!cancelled || !engagement) return;
      if (engagement.comments.length) {
        setLocalComments(engagement.comments.map((c) => c.body));
        setCommentCount(engagement.comments.length);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text) return;

    // Optimistically add locally.
    setLocalComments((prev) => [text, ...prev]);
    setCommentCount((count) => count + 1);
    setCommentText('');

    // Persist to the backend so other users see it.
    await postVideoComment(item.id, text, 'noodshop', userId);
  };

  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.commentsSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>
            Comments · {formatCount(commentCount)}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.commentsList} showsVerticalScrollIndicator={false}>
          {localComments.map((text, index) => (
            <View key={index} style={styles.commentRow}>
              <Image source={NOOD_BRAND_LOGO} style={styles.commentAvatar} resizeMode="contain" />
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>@noodshop</Text>
                <Text style={styles.commentText}>{text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.commentInputRow}>
          <Image source={NOOD_BRAND_LOGO} style={styles.commentAvatar} resizeMode="contain" />
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment…"
            placeholderTextColor="#999"
            onSubmitEditing={submitComment}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.commentSend, !commentText.trim() && styles.commentSendDisabled]}
            onPress={submitComment}
            disabled={!commentText.trim()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  itemContainer: {
    width,
    height,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  creatorInfo: {
    position: 'absolute',
    top: 90,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    backgroundColor: '#ff6a00',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 4,
  },
  followButtonDone: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  creatorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  caption: {
    position: 'absolute',
    bottom: 160,
    left: 16,
    right: 80,
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  actions: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  productTag: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    padding: 10,
    gap: 10,
  },
  productTagImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  productTagInfo: { flex: 1 },
  productTagTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  productTagPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  productTagPriceCurrent: {
    color: '#ff6a00',
    fontSize: 15,
    fontWeight: '900',
  },
  productTagOldPrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },

  swipeHint: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
  },
  swipeHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },

  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginTop: 8,
  },
  sheetContent: {
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: '#111',
    paddingRight: 12,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3ede7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  sheetPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ff6a00',
  },
  sheetOldPrice: {
    fontSize: 15,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  sheetDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sizeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  sizeOption: {
    width: 50,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeOptionSelected: {
    borderColor: '#ff6a00',
    backgroundColor: '#fff0e0',
  },
  sizeOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  buyNowButton: {
    backgroundColor: '#ff6a00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buyNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },

  // Comments sheet
  commentsSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    minHeight: '50%',
    paddingBottom: 30,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  commentsList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f0eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
  },
  commentSend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendDisabled: {
    opacity: 0.4,
  },
});
