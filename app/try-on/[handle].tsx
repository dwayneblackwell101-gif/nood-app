import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableOverlay from '../../components/DraggableOverlay';
import { fetchShopifyProductDetail } from '../../utils/shopify-catalog';

export default function TryOnScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [productImage, setProductImage] = useState<string | null>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!handle) return;
    fetchShopifyProductDetail(handle).then((result) => {
      const product = result?.productByHandle;
      if (product?.featuredImage?.url) {
        setProductImage(product.featuredImage.url);
      } else if (product?.images?.edges?.[0]?.node?.url) {
        setProductImage(product.images.edges[0].node.url);
      }
    });
  }, [handle]);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (e) {
      console.error('Capture failed:', e);
    }
  };

  const savePhoto = async () => {
    if (!capturedUri) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(capturedUri);
        alert('Saved to camera roll!');
      } else {
        await Sharing.shareAsync(capturedUri);
      }
    } catch (e) {
      console.error('Save failed:', e);
      alert('Could not save photo.');
    } finally {
      setSaving(false);
    }
  };

  if (!permission) {
    return <View style={styles.center}><Text style={styles.loadingText}>Loading camera...</Text></View>;
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

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef} facing="front" />
        <DraggableOverlay imageUrl={capturedUri} initialWidth={200} initialHeight={200} />
        {productImage && <DraggableOverlay imageUrl={productImage} />}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.retakeButton} onPress={() => setCapturedUri(null)}>
            <Ionicons name="refresh" size={22} color="#fff" />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={savePhoto} disabled={saving}>
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
        {productImage && <DraggableOverlay imageUrl={productImage} />}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>Pinch to resize • Drag to position</Text>
        </View>
      </CameraView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
});
