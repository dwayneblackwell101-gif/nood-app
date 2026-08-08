import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Temu-style free shipping progress bar.
 * Shows how close the cart is to free delivery. Encourages add-ons.
 */
export function FreeShippingProgressBar({
  orderTotalBase,
  thresholdBase = 25,
  formatMoney,
}: {
  orderTotalBase: number;
  thresholdBase?: number;
  formatMoney: (value: number) => string;
}) {
  const progress = Math.min(1, Math.max(0, orderTotalBase / thresholdBase));
  const remaining = Math.max(0, thresholdBase - orderTotalBase);
  const unlocked = orderTotalBase >= thresholdBase;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name="car-outline" size={15} color="#ff6a00" />
        <Text style={styles.title}>
          {unlocked
            ? '🎉 You’ve unlocked FREE shipping!'
            : `You’re ${formatMoney(remaining)} away from FREE shipping`}
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      {!unlocked ? (
        <View style={styles.labels}>
          <Text style={styles.labelLeft}>Free shipping unlocked</Text>
          <Text style={styles.labelRight}>${thresholdBase.toFixed(0)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ffe0cc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    color: '#4e260d',
    fontSize: 12,
    fontWeight: '800',
  },
  track: {
    height: 6,
    backgroundColor: '#f0e4d8',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  fill: {
    height: '100%',
    backgroundColor: '#ff6a00',
    borderRadius: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  labelLeft: {
    color: '#8a7a6f',
    fontSize: 10,
    fontWeight: '700',
  },
  labelRight: {
    color: '#8a7a6f',
    fontSize: 10,
    fontWeight: '700',
  },
});
