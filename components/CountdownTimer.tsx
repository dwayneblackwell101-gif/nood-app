import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { pad2, splitDuration } from '../utils/flash-sale';

type CountdownTimerProps = {
  /** Target time in ms since epoch. Ticks down to it every second. */
  targetTimeMs: number;
  onFinish?: () => void;
  style?: ViewStyle;
  segmentStyle?: ViewStyle;
  numberStyle?: TextStyle;
  labelStyle?: TextStyle;
  colonStyle?: TextStyle;
  showLabels?: boolean;
};

/**
 * Reusable HH:MM:SS countdown to a fixed timestamp.
 * Used by the flash sale banner and the flash sale hub.
 */
export function CountdownTimer({
  targetTimeMs,
  onFinish,
  style,
  segmentStyle,
  numberStyle,
  labelStyle,
  colonStyle,
  showLabels = true,
}: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (targetTimeMs - current <= 0) {
        setFinished(true);
        clearInterval(interval);
        onFinish?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTimeMs, onFinish]);

  const remaining = Math.max(0, targetTimeMs - now);
  const parts = splitDuration(remaining);

  if (finished) {
    return (
      <View style={[styles.row, style]}>
        <Text style={[styles.doneText, numberStyle]}>{'00:00:00'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.segment, segmentStyle]}>
        <Text style={[styles.number, numberStyle]}>{pad2(parts.hours)}</Text>
        {showLabels ? <Text style={[styles.label, labelStyle]}>HRS</Text> : null}
      </View>
      <Text style={[styles.colon, colonStyle]}>:</Text>
      <View style={[styles.segment, segmentStyle]}>
        <Text style={[styles.number, numberStyle]}>{pad2(parts.minutes)}</Text>
        {showLabels ? <Text style={[styles.label, labelStyle]}>MIN</Text> : null}
      </View>
      <Text style={[styles.colon, colonStyle]}>:</Text>
      <View style={[styles.segment, segmentStyle]}>
        <Text style={[styles.number, numberStyle]}>{pad2(parts.seconds)}</Text>
        {showLabels ? <Text style={[styles.label, labelStyle]}>SEC</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  segment: {
    minWidth: 42,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  number: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    lineHeight: 18,
  },
  label: {
    fontSize: 7,
    fontWeight: '700',
    color: '#999',
    marginTop: -1,
  },
  colon: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ff6a00',
  },
  doneText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    fontVariant: ['tabular-nums'],
  },
});
