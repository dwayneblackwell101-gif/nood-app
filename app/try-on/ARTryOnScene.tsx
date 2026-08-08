/**
 * ARTryOnScene.tsx
 *
 * Real AR try-on using ViroReact (ViroARSceneNavigator).
 *
 * CRITICAL: @reactvision/react-viro performs module-level side effects on
 * import (ViroMaterials.createMaterials, ViroAnimations.registerAnimations)
 * that require native modules (VRTMaterialManager, ViroManager) which only
 * exist inside a development build — NOT in Expo Go and NOT on web.
 *
 * Because expo-router eagerly evaluates every route module, a static import
 * of the package crashes the ENTIRE app at launch. So ViroReact is loaded
 * lazily here (dynamic import inside try/catch) and only attempted when we
 * are certain we're in a native dev build.
 *
 * - world-placement: furniture/home products get a plane-detected AR view
 *   where the product image floats in the real world (tap a surface).
 * - face/body/hand/fallback: handled by the parent screen's FallbackOverlay;
 *   this scene gracefully hands off (the "AR coming soon" placeholder is gone).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';

import { type ARMode } from '../../components/try-on/ProductTypeResolver';

interface ARTryOnSceneProps {
  product: any;
  arMode: string;
  onClose: () => void;
  onCapture?: (uri: string) => void;
}

type ARSupportStatus = 'checking' | 'supported' | 'unsupported';

function isExpoGoRuntime(): boolean {
  try {
    return String((Constants as any)?.appOwnership || 'unknown').trim() === 'expo';
  } catch {
    return false;
  }
}

function WorldPlacementScene({
  viro,
  imageUrl,
  title,
}: {
  viro: any;
  imageUrl: string;
  title: string;
}) {
  const { ViroARScene, ViroARPlaneSelector, ViroARPlane, ViroImage, ViroText, ViroTrackingStateConstants } = viro;
  const [placed, setPlaced] = useState(false);
  const [tracking, setTracking] = useState(false);

  return (
    <ViroARScene
      onTrackingUpdated={(state: any) => {
        setTracking(state === ViroTrackingStateConstants.TRACKING_NORMAL);
      }}
    >
      {!placed ? (
        <>
          <ViroARPlaneSelector minHeight={0.3} minWidth={0.3} onPlaneSelected={() => setPlaced(true)} />
          <ViroARPlane minHeight={0.3} minWidth={0.3} alignment="Horizontal" width={0.9} height={0.9} />
          <ViroText
            text={tracking ? 'Tap a flat surface to place the item' : 'Move your phone to scan the floor'}
            position={[0, 0.3, -1.5]}
            style={{ fontSize: 18, color: '#ffffff' }}
            width={4}
            height={1}
          />
        </>
      ) : (
        <ViroImage
          source={{ uri: imageUrl }}
          position={[0, 0.15, -1.2]}
          scale={[0.5, 0.5, 0.5]}
          rotation={[0, 0, 0]}
          dragType="FixedToPlane"
          height={0.5}
          width={0.5}
          resizeMode="ScaleToFit"
          onClick={() => {}}
        />
      )}

      <ViroText
        text={title}
        position={[0, -0.6, -1.5]}
        style={{ fontSize: 14, color: '#ffffff', fontFamily: 'sans-serif' }}
        width={3}
        height={0.8}
        maxLines={3}
        textLineBreakMode="WordWrap"
      />
    </ViroARScene>
  );
}

export default function ARTryOnScene({ product, arMode, onClose }: ARTryOnSceneProps) {
  const [support, setSupport] = useState<ARSupportStatus>('checking');
  const [viro, setViro] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      // Expo Go and web never have the native Viro modules.
      if (Platform.OS === 'web' || isExpoGoRuntime()) {
        if (mounted) setSupport('unsupported');
        return;
      }

      try {
        // Lazy import — the package's module-level side effects only run
        // here, inside the try/catch, and only in a real dev build.
        const mod = await import('@reactvision/react-viro');

        const result = (await mod.isARSupportedOnDevice?.()) as any;
        const isSupported = Boolean(
          result &&
            (result.isARSupported === true ||
              result.isARSupported === 'true' ||
              result.isARSupported === '1' ||
              result.isARSupported === 1 ||
              (result.supported !== false && result.isARSupported !== false))
        );

        if (!mounted) return;
        if (isSupported) {
          setViro(mod);
          setSupport('supported');
        } else {
          setSupport('unsupported');
        }
      } catch {
        if (mounted) {
          setSupport('unsupported');
          setViro(null);
        }
      }
    };

    void check();
    return () => {
      mounted = false;
    };
  }, []);

  const mode = (arMode || 'world-placement') as ARMode;
  const imageUrl = product?.featuredImage?.url || product?.images?.edges?.[0]?.node?.url || '';
  const title = String(product?.title || 'Product');

  const showRealAR = support === 'supported' && Boolean(viro) && mode === 'world-placement' && Boolean(imageUrl);

  const scene = useMemo(() => {
    if (!showRealAR || !viro) return null;
    const { ViroARSceneNavigator } = viro;
    return (
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: () => <WorldPlacementScene viro={viro} imageUrl={imageUrl} title={title} /> }}
        style={styles.arContainer}
      />
    );
  }, [showRealAR, viro, imageUrl, title]);

  if (support === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a00" />
        <Text style={styles.loadingText}>Checking AR support…</Text>
      </View>
    );
  }

  if (support === 'unsupported') {
    return (
      <View style={styles.center}>
        <Ionicons name="cube-outline" size={48} color="#aaa" />
        <Text style={styles.unsupportedTitle}>Full AR needs a development build</Text>
        <Text style={styles.unsupportedText}>
          AR isn’t available in Expo Go or on this device. You can still try on with the camera overlay.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryButtonText}>Use Overlay mode</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!scene) {
    // AR supported but no renderable scene (e.g. non world-placement) →
    // hand off to the overlay path.
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color="#aaa" />
        <Text style={styles.unsupportedTitle}>Switching to camera overlay</Text>
        <Text style={styles.unsupportedText}>This product type uses the smart overlay for try-on.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryButtonText}>Open overlay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scene}

      <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
        <Ionicons name="close" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.arBadge}>
        <Ionicons name="cube" size={14} color="#fff" />
        <Text style={styles.arBadgeText}>AR</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  arContainer: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 36,
  },
  loadingText: { color: '#ccc', fontSize: 15, marginTop: 14 },
  unsupportedTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  unsupportedText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#ff6a00',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  closeButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  arBadge: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,106,0,0.9)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  arBadgeText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
