import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Temu-style quick preview. Triggered by long-press on a product card.
 * Shows a large product image with price + add-to-cart, without leaving
 * the feed.
 */
export function QuickPreviewModal({
  product,
  visible,
  onClose,
  onAddToCart,
  onOpen,
  priceLabel,
}: {
  product: any;
  visible: boolean;
  onClose: () => void;
  onAddToCart: (item: any) => void;
  onOpen: (item: any) => void;
  priceLabel?: string;
}) {
  if (!product) return null;

  const imageUrl = product?.image || product?.featuredImage?.url || product?.images?.edges?.[0]?.node?.url || '';
  const title = String(product?.title || 'Product');
  const price = priceLabel || `$${Number(product?.priceAmount || product?.price || 0).toFixed(2)}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.imageWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Ionicons name="image-outline" size={40} color="#ccc" />
              </View>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Text style={styles.price}>{price}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.quickAddButton]}
                activeOpacity={0.9}
                onPress={() => {
                  onAddToCart(product);
                  onClose();
                }}
              >
                <Ionicons name="cart" size={16} color="#fff" />
                <Text style={styles.quickAddText}>Quick add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.viewButton]}
                activeOpacity={0.9}
                onPress={() => {
                  onOpen(product);
                  onClose();
                }}
              >
                <Text style={styles.viewText}>View details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { padding: 18 },
  title: { fontSize: 16, fontWeight: '800', color: '#111', lineHeight: 21 },
  price: { fontSize: 20, fontWeight: '900', color: '#ff6a00', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  quickAddButton: { backgroundColor: '#ff6a00' },
  quickAddText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  viewButton: { backgroundColor: '#f3ede7', borderWidth: 1, borderColor: '#e5d9ce' },
  viewText: { color: '#4e260d', fontSize: 14, fontWeight: '800' },
});
