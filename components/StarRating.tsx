import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Star rating row — renders 5 stars from a numeric average.
 * Supports half stars and a review count.
 */
export function StarRating({
  average,
  count,
  size = 13,
  color = '#ff8a00',
  emptyColor = '#e2ddd8',
}: {
  average: number;
  count?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
}) {
  const clamped = Math.min(5, Math.max(0, Number(average) || 0));

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((position) => {
        const diff = clamped - (position - 1);
        let icon: 'star' | 'star-half' | 'star-outline' = 'star-outline';
        if (diff >= 1) icon = 'star';
        else if (diff >= 0.5) icon = 'star-half';

        return <Ionicons key={position} name={icon} size={size} color={icon === 'star-outline' ? emptyColor : color} />;
      })}
      {count != null ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  count: { marginLeft: 4, fontSize: 12, fontWeight: '700', color: '#8a7a6f' },
});
