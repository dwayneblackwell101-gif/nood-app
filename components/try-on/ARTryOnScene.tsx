import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ARTryOnSceneProps {
  product: any;
  arMode: string;
  onClose: () => void;
  onCapture?: (uri: string) => void;
}

const ARTryOnScene: React.FC<ARTryOnSceneProps> = ({
  product,
  arMode,
  onClose,
  onCapture,
}) => {
  console.log('ARTryOnScene loaded with product:', product);
  console.log('AR Mode:', arMode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AR Try-On (Placeholder)</Text>
        <Text style={styles.subtitle}>Real AR coming soon with ViroReact</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.info}>
          Product: {product?.title || 'Unknown'}
        </Text>
        <Text style={styles.info}>
          Mode: {arMode}
        </Text>
        <Text style={styles.placeholder}>
          This is a placeholder screen.{'\n'}
          Full ViroReact AR will be implemented here.
        </Text>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  info: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 8,
  },
  placeholder: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#ff6a00',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ARTryOnScene;