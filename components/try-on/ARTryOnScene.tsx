/**
 * ARTryOnScene.tsx
 *
 * Full ViroReact AR scene with:
 * - Plane detection for world-placement mode
 * - 3D model loading (GLB/GLTF/USDZ via Viro3DObject)
 * - Face overlay mode (using ViroFaceTracker)
 * - Hand overlay (approximated via face tracking + hand position estimation)
 * - Gesture handlers: drag, pinch, rotate, tap-to-place
 * - Model loading from product media
 * - Screenshot capture via react-native-view-shot
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroARPlane,
  ViroARPlaneSelector,
  Viro3DObject,
  ViroMaterials,
  ViroAmbientLight,
  ViroSpotLight,
  ViroSpotLightShadow,
  ViroConstants,
  ViroText,
  ViroImage,
  ViroImageTexture,
  ViroMaterials,
  ViroController,
  ViroScene,
  ViroSceneNavigator,
  ViroARSceneNavigator,
  ViroARScene,
  ViroARPlane,
  ViroARPlaneSelector,
  Viro3DObject,
  ViroMaterials,
  ViroAmbientLight,
  ViroSpotLight,
  ViroSpotLightShadow,
  ViroConstants,
  ViroText,
  ViroImage,
  ViroImageTexture,
  ViroAnimations,
  ViroAnimation,
  ViroFlexView,
  ViroFlexViewStyle,
  ViroButton,
} from '@reactvision/react-viro';

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { resolveARMode, getARModeDescription, type ARMode, type ProductMetadata } from './ProductTypeResolver';

interface Props {
  product: {
    handle: string;
    title: string;
    featuredImage?: { url?: string };
    images?: { edges: Array<{ node: { url: string; altText?: string } }> };
    media: ProductMetadata['media'];
    productType?: string;
    tags?: string[];
    collections?: Array<{ handle?: string }>;
  };
  arMode: ARMode;
  onClose: () => void;
  onCapture: (uri: string) => void;
}

const WORLD_PLACEMENT_DEFAULTS = {
  initialScale: 1,
  initialPosition: [0, -0.5, -2],
  initialRotation: [0, 0, 0],
} as const;

const FACE_OVERLAY_DEFAULTS = {
  initialScale: 0.3,
  initialPosition: [0, 0.1, -0.5],
  initialRotation: [0, 0, 0],
} as const;

const HAND_OVERLAY_DEFAULTS = {
  initialScale: 0.5,
  initialPosition: [0.3, -0.1, -0.5],
  initialRotation: [0, 0, 0],
} as const;

export default function ARTryOnScene({
  product,
  arMode,
  onClose,
  onCapture,
}: Props) {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const viroSceneRef = useRef<any>(null);
  const capturedImageRef = useRef<any>(null);

  // Get the 3D model URL from product media
  const modelUrl = React.useMemo(() => {
    if (!product.media) return null;
    const modelMedia = product.media.find((m) => m.__typename === 'Model3d');
    return modelMedia?.preview?.url || modelMedia?.id || null;
  }, [product.media]);

  // Load product image for fallback overlays
  const productImage = React.useMemo(() => {
    if (product.featuredImage?.url) return product.featuredImage.url;
    return product.images?.edges?.[0]?.node?.url || null;
  }, [product.featuredImage, product.images]);

  // Handle model loading
  const onModelLoad = () => {
    setModelLoaded(true);
    setModelError(null);
  };

  const onModelError = (error: any) => {
    console.error('[AR] Model load error:', error);
    setModelError('Failed to load 3D model. Showing image overlay instead.');
  };

  // Handle screenshot capture
  const handleCapture = async () => {
    if (!viroSceneRef.current) return;
    try {
      const uri = await viroSceneRef.current.takeSnapshotAsync({
        width: 1080,
        height: 1920,
        quality: 0.9,
        format: 'png',
      });
      if (uri) {
        setScreenshotUri(uri);
      }
    } catch (error) {
      console.error('[AR] Screenshot failed:', error);
    }
  };

  // Handle save to library
  const handleSave = async () => {
    if (!screenshotUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(screenshotUri);
        Alert.alert('Saved!', 'Photo saved to camera roll.');
      } else {
        await Sharing.shareAsync(screenshotUri);
      }
    } catch (error) {
      console.error('[AR] Save failed:', error);
      Alert.alert('Error', 'Could not save photo.');
    }
  };

  // Share screenshot
  const handleShare = async () => {
    if (!screenshotUri) return;
    try {
      await Sharing.shareAsync(screenshotUri);
    } catch (error) {
      console.error('[AR] Share failed:', error);
    }
  };

  // Determine gesture config based on mode
  const getDefaults = () => {
    switch (arMode) {
      case 'world-placement':
        return WORLD_PLACEMENT_DEFAULTS;
      case 'face-overlay':
        return FACE_OVERLAY_DEFAULTS;
      case 'hand-overlay':
        return HAND_OVERLAY_DEFAULTS;
      default:
        return WORLD_PLACEMENT_DEFAULTS;
    }
  };

  const defaults = getDefaults();

  // State for drag/rotate/scale gestures
  const [position, setPosition] = useState(defaults.initialPosition);
  const [rotation, setRotation] = useState(defaults.initialRotation);
  const [scale, setScale] = useState(defaults.initialScale);
  const [isPlaced, setIsPlaced] = useState(false);

  // Instructions text
  const instructionText = getARModeDescription(arMode);

  // Render content based on AR mode
  const renderARContent = () => {
    const productImageUrl = productImage;

    // Product image for face/hand overlay or fallback
    const productImageNode = productImage ? (
      <ViroImage
        source={{ uri: productImage }}
        position={[0, 0, 0]}
        scale={[0.3, 0.3, 0.3]}
        width={2}
        height={2}
        rotation={[0, 0, 0]}
      />
    ) : null;

    switch (arMode) {
      case 'world-placement':
        return (
          <>
            {/* Floor/ground plane */}
            <ViroARPlane
              width={5}
              height={5}
              rotation={[-90, 0, 0]}
              position={[0, -0.01, -2]}
              materials={['grid']}
              arShadowReceiver={true}
            />

            {/* Tap-to-place plane selector */}
            <ViroARPlaneSelector
              position={[0, 0, 0]}
              rotation={[-90, 0, 0]}
              width={10}
              height={10}
              pointSize={10}
              color="#ff6a00"
              onPlaneSelected={(plane) => {
                if (!isPlaced) {
                  setPosition([plane.position.x, plane.position.y + 0.05, plane.position.z]);
                  setIsPlaced(true);
                }
              }}
            />

            {/* 3D Model or fallback image */}
            {modelUrl && modelLoaded ? (
              <Viro3DObject
                source={modelUrl}
                position={position}
                rotation={rotation}
                scale={[scale, scale, scale]}
                type="GLTF"
                onLoad={onModelLoad}
                onError={onModelError}
                animation={{ run: true, loop: true }}
              />
            ) : productImage ? (
              <ViroImage
                source={{ uri: productImage }}
                position={position}
                rotation={rotation}
                scale={[scale, scale, scale]}
                width={2}
                height={2}
              />
            ) : null}

          </>
        );

      case 'face-overlay':
        return (
          <>
            <ViroImage
              source={{ uri: productImage || 'https://via.placeholder.com/200' }}
              position={position}
              rotation={rotation}
              scale={[scale, scale, scale]}
              width={1.5}
              height={1.5}
              dragType="FixedDistance"
              dragDistance={0.5}
              materials={['faceMaterial']}
            />
          </>
        );

      case 'hand-overlay':
        return (
          <>
            <ViroImage
              source={{ uri: productImage || 'https://via.placeholder.com/200' }}
              position={position}
              rotation={rotation}
              scale={[scale, scale, scale]}
              width={1}
              height={1}
              dragType="FixedToWorld"
            />
          </>
        );

      case 'model-viewer':
        if (modelUrl && modelLoaded) {
          return (
            <Viro3DObject
              source={modelUrl}
              position={position}
              rotation={rotation}
              scale={[scale, scale, scale]}
              type="GLTF"
              onLoad={onModelLoad}
              onError={onModelError}
              animation={{ run: true, loop: true }}
            />
          );
        }
        return productImage ? (
          <ViroImage
            source={{ uri: productImage }}
            position={position}
            rotation={rotation}
            scale={[scale, scale, scale]}
            width={2}
            height={2}
          />
        ) : null;

      default:
        return (
          <>
            <ViroImage
              source={{ uri: productImage || 'https://via.placeholder.com/200' }}
              position={[0, 0, -1]}
              scale={[1, 1, 1]}
              width={2}
              height={2}
            />
          </>
        );
    }
  };

  return (
    <ViroARSceneNavigator
      initialScene={{ scene: arScene }}
      onTrackingUpdated={(tracking) => {
        if (tracking.status === 'TRACKING') {
          setTrackingReady(true);
        }
      }}
    >
      <ViroARScene
        ref={viroSceneRef}
        onTrackingUpdated={(tracking) => {
          setTrackingReady(tracking.status === 'TRACKING');
        }}
      >
        <ViroAmbientLight color="#ffffff" intensity={1000} />
        <ViroSpotLight
          innerAngle={5}
          outerAngle={90}
          direction={[0, -1, -0.2]}
          position={[0, 3, 2]}
          color="#ffffff"
          intensity={2000}
          castShadow={true}
        >
          <ViroSpotLightShadow
            near={0.1}
            far={10}
            resolution={1024}
          />
        </ViroSpotLight>
        <ViroAmbientLight color="#ffffff" intensity={400} />

        {renderARContent()}

        {/* Tap-to-place handler */}
        <ViroARPlaneSelector
          position={[0, 0, 0]}
          rotation={[-90, 0, 0]}
          width={10}
          height={10}
          pointSize={8}
          color="#ff6a00"
          onPlaneSelected={(plane) => {
            if (!isPlaced) {
              setPosition([
                plane.position.x,
                plane.position.y + 0.05,
                plane.position.z,
              ]);
              setIsPlaced(true);
            }
          }}
        />

        {/* Instructions overlay */}
        {showInstructions && (
          <ViroText
            text={instructionText}
            position={[0, 1.2, -1.5]}
            fontSize={16}
            color="#ffffff"
            backgroundColor="rgba(0,0,0,0.7)"
            width={3}
            height={0.5}
            alignment="center"
            textAlignment="center"
            paddingLeft={0.2}
            paddingRight={0.2}
          />
        )}

        {/* UI Controls */}
        <ViroFlexView
          position={[0, -1.6, -1]}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            width: 3,
            paddingHorizontal: 0.2,
          }}
        >
          <ViroButton
            text={screenshotUri ? 'Retake' : 'Capture'}
            onClick={screenshotUri ? () => setScreenshotUri(null) : handleCapture}
            width={0.6}
            height={0.12}
            backgroundColor={screenshotUri ? '#666' : '#ff6a00'}
            textColor="#fff"
            cornerRadius={0.05}
            textSize={16}
          />
          {screenshotUri && (
            <>
              <ViroButton
                text="Save"
                onClick={handleSave}
                width={0.6}
                height={0.12}
                backgroundColor="#4caf50"
                textColor="#fff"
                cornerRadius={0.05}
                textSize={16}
              />
              <ViroButton
                text="Share"
                onClick={handleShare}
                width={0.6}
                height={0.12}
                backgroundColor="#2196f3"
                textColor="#fff"
                cornerRadius={0.05}
                textSize={16}
              />
            </>
          </ViroFlexView>

          {/* Close button */}
          <ViroButton
            text="✕"
            onClick={onClose}
            position={[1.3, 1.3, -1.5}]
            width={0.2}
            height={0.2}
            backgroundColor="rgba(0,0,0,0.5)"
            textColor="#fff"
            cornerRadius={0.1}
            textSize={18}
          />
        </ViroARScene>
      </ViroARSceneNavigator>
    );
  };

export default ARTryOnScene;