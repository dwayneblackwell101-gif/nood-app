/**
 * TryOnScreen.tsx
 *
 * Main try-on screen that intelligently routes to AR or fallback overlay
 * based on product metadata and device capabilities.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import FallbackOverlay from '../../components/try-on/FallbackOverlay';
import ARTryOnScene from './ARTryOnScene';
import { fetchShopifyProductDetail } from '../../utils/shopify-catalog';
import { resolveARMode, type ARMode, type ProductMetadata } from './ProductTypeResolver';

interface ProductData {
  handle: string;
  title: string;
  featuredImage?: { url?: string };
  images?: { edges: Array<{ node: { url: string; altText?: string } }> };
  media: ProductMetadata['media'];
  productType?: string;
  tags?: string[];
  collections?: Array<{ handle?: string }>;
}

export default function TryOnScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [product, setProduct] = useState<Partial<ProductData> | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [arMode, setArMode] = useState<ARMode>('fallback-overlay');
  const [useAR, setUseAR] = useState(false);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [useARMode, setUseARMode] = useState<'ar' | 'fallback'>('ar');

  const router = useRouter();

  useEffect(() => {
    if (!handle) return;
    setLoadingProduct(true);
    fetchShopifyProductDetail(handle).then((result) => {
      const product = result?.productByHandle;
      if (product) {
        setProduct(product as ProductMetadata);
        // Extract primary product image
        if (product?.featuredImage?.url) {
          setProductImage(product.featuredImage.url);
        } else if (product?.images?.edges?.[0]?.node?.url) {
          setProductImage(product.images.edges[0].node.url);
        }

        // Determine AR mode from product metadata
        const mode = resolveARMode(product as ProductMetadata);
        setArMode(mode);
      } else {
        setArMode('fallback-overlay');
      }
      setLoadingProduct(false);
    });
  }, [handle]);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    // Only works in fallback mode since AR capture is handled in ViroReact
    if (useARMode === 'fallback') {
      // Fallback mode uses CameraView capture
      // For AR mode, capture is handled in ViroReact
    }
  };

  const savePhoto = async (uri?: string) => {
    const uriToSave = uri || capturedUri;
    if (!uriToSave) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uriToSave);
        Alert.alert('Saved!', 'Photo saved to camera roll.');
      } else {
        await Sharing.shareAsync(uriToSave);
      }
    } catch (e) {
      console.error('Save failed:', e);
      Alert.alert('Error', 'Could not save photo.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Show fallback message for 3 seconds when using fallback mode
  useEffect(() => {
    if (useARMode === 'fallback') {
      setShowFallbackMessage(true);
      setTimeout(() => setShowFallbackMessage(false), 3000);
    }
  }, [useARMode]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a00" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color="#999" />
        <Text style={styles.permText}>Camera permission is required for Try On</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingProduct) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a00" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  // Determine if AR is available (not in Expo Go, has ViroReact)
  const isARAvailable = __DEV__ && typeof require !== 'undefined';
  // In production, we'd check for ViroReact native module existence

  const renderTryOn = () => {
    if (useARMode === 'ar') {
      return (
        <ARTryOnScene
          product={{
            handle: product?.handle || handle,
            title: product?.title || '',
            featuredImage: product?.featuredImage,
            images: product?.images,
            media: product?.media,
            productType: product?.productType,
            tags: product?.tags,
            collections: product?.collections,
          }
          arMode={arMode}
          onClose={() => setUseARMode('fallback')}
          onCapture={(uri) => setCapturedUri(uri)}
        />
      );
    }

    // Fallback mode: simple camera + draggable overlay
    if (capturedUri) {
      return (
        <View style={styles.container}>
          <CameraView style={styles.camera} ref={cameraRef} facing="front" />
          <FallbackOverlay
            imageUrl={capturedUri}
            arMode={arMode}
            initialWidth={200}
            initialHeight={200}
            showFallbackMessage={showFallbackMessage}
          />
          {productImage && <FallbackOverlay imageUrl={productImage} arMode={arMode} />}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.retakeButton} onPress={() => setCapturedUri(null)}>
              <Ionicons name="refresh" size={22} color="#fff" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={() => savePhoto(capturedUri)} disabled={saving}>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <GestureHandlerRootView style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef} facing="front">
          {productImage && <FallbackOverlay imageUrl={productImage} arMode={arMode} />}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>Pinch to resize • Drag to position • Rotate with two fingers</Text>
          </View>
        </CameraView>
      </GestureHandlerRootView>
    );
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[{ backgroundColor: useARMode === 'ar' ? '#ff6a00' : '#fff' }, styles.modeButton]}
          onPress={() => setUseARMode('ar')}
        >
          <Ionicons name="cube" size={18} color={useARMode === 'ar' ? '#fff' : '#666'} />
          <Text style={{ color: useARMode === 'ar' ? '#fff' : '#666', fontSize: 11, fontWeight: '600', marginTop: 2 }}>AR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[{ backgroundColor: useARMode === 'fallback' ? '#ff6a00' : '#fff' }, styles.modeButton]}
          onPress={() => setUseARMode('fallback')}
        >
          <Ionicons name="image" size={18} color={useARMode === 'fallback' ? '#fff' : '#666'} />
          <Text style={{ color: useARMode === 'fallback' ? '#fff' : '#666', fontSize: 11, fontWeight: '600', marginTop: 2 }}>Overlay</Text>
        </TouchableOpacity>
      </View>

      {renderTryOn()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', fontSize: 16 },
  permText: { color: '#ccc', fontSize: 14, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 },
  permButton: { marginTop: 16, backgroundColor: '#ff6a00', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  permButtonText: { color: '#fff', fontWeight: '700' },
  backButton: {
    position: 'absolute', top: 50, left: 16, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8,
  },
  bottomBar: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 24, zIndex: 20,
  },
  captureButton: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  retakeButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  retakeText: { color: '#fff', fontWeight: '600' },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ff6a00', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  instructions: {
    position: 'absolute', bottom: 130, left: 0, right: 0, alignItems: 'center', zIndex: 20,
  },
  instructionsText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  modeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ff6a00',
    minWidth: 70,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', fontSize: 16 },
  permText: { color: '#ccc', fontSize: 14, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 },
  permButton: { marginTop: 16, backgroundColor: '#ff6a00', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  permButtonText: { color: '#fff', fontWeight: '700' },
  backButton: {
    position: 'absolute', top: 50, left: 16, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8,
  },
  bottomBar: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 24, zIndex: 20,
  },
  captureButton: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  retakeButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  retakeText: { color: '#fff', fontWeight: '600' },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ff6a00', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  instructions: {
    position: 'absolute', bottom: 130, left: 0, right: 0, alignItems: 'center', zIndex: 20,
  },
  instructionsText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  modeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ff6a00',
    minWidth: 70,
  },
});

export default TryOnScreen;