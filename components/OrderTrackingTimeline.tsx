import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Order tracking timeline — visual shipped → out for delivery → delivered
 * progression driven by the order's fulfillment status + tracking number.
 */

export type TrackingTimelineStatus = 'ordered' | 'shipped' | 'out_for_delivery' | 'delivered';

function resolveStatus(order: any): TrackingTimelineStatus {
  const status = String(
    order?.fulfillmentStatus ||
      order?.fulfillment_status ||
      order?.fulfillment?.status ||
      order?.fulfillments?.[0]?.status ||
      ''
  )
    .trim()
    .toLowerCase();

  if (status.includes('delivered')) return 'delivered';
  if (status.includes('out_for_delivery') || status.includes('out for delivery')) return 'out_for_delivery';
  if (status.includes('shipped') || status.includes('fulfilled')) return 'shipped';

  const hasTracking = Boolean(
    order?.trackingNumber ||
      order?.tracking_number ||
      order?.fulfillment?.trackingNumber ||
      order?.fulfillments?.[0]?.trackingNumber ||
      order?.fulfillments?.[0]?.trackingInfo?.[0]?.number
  );
  if (hasTracking) return 'shipped';

  return 'ordered';
}

const STEPS: Array<{ key: TrackingTimelineStatus; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'ordered', label: 'Order placed', icon: 'receipt-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'cube-outline' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: 'car-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-circle-outline' },
];

export function OrderTrackingTimeline({ order }: { order: any }) {
  const status = resolveStatus(order);
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  const trackingNumber = getTrackingNumber(order);
  const trackingUrl = getTrackingUrl(order);
  const carrier = getCarrier(order);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Order tracking</Text>
        <View style={[styles.statusPill, styles[`pill_${status}`] as any]}>
          <Text style={styles.statusPillText}>{labelFor(status)}</Text>
        </View>
      </View>

      <View style={styles.timeline}>
        {STEPS.map((step, index) => {
          const reached = index <= currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View
                  style={[
                    styles.stepDot,
                    reached ? styles.stepDotReached : styles.stepDotPending,
                  ]}
                >
                  <Ionicons
                    name={reached ? step.icon : 'ellipse-outline'}
                    size={14}
                    color={reached ? '#fff' : '#bbb'}
                  />
                </View>
                {!isLast ? (
                  <View
                    style={[
                      styles.stepLine,
                      index < currentIndex ? styles.stepLineReached : styles.stepLinePending,
                    ]}
                  />
                ) : null}
              </View>

              <Text
                style={[
                  styles.stepLabel,
                  reached ? styles.stepLabelReached : styles.stepLabelPending,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {trackingNumber ? (
        <View style={styles.trackingCard}>
          <View style={styles.trackingRow}>
            <Ionicons name="navigate-outline" size={16} color="#ff6a00" />
            <Text style={styles.trackingNumber} numberOfLines={1}>
              {trackingNumber}
            </Text>
          </View>
          {carrier ? <Text style={styles.carrier}>Carrier: {carrier}</Text> : null}

          <TouchableOpacity
            style={styles.trackButton}
            activeOpacity={0.9}
            onPress={() => {
              const url = trackingUrl || `https://t.17track.net/en#nums=${encodeURIComponent(trackingNumber)}`;
              void Linking.openURL(url).catch(() => {});
            }}
          >
            <Text style={styles.trackButtonText}>Track package</Text>
            <Ionicons name="open-outline" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function getTrackingNumber(order: any): string {
  return (
    order?.trackingNumber ||
    order?.tracking_number ||
    order?.fulfillment?.trackingNumber ||
    order?.fulfillment?.tracking_number ||
    order?.fulfillments?.[0]?.trackingNumber ||
    order?.fulfillments?.[0]?.tracking_number ||
    order?.fulfillments?.[0]?.trackingInfo?.[0]?.number ||
    ''
  );
}

function getTrackingUrl(order: any): string {
  return (
    order?.trackingUrl ||
    order?.tracking_url ||
    order?.fulfillment?.trackingUrl ||
    order?.fulfillment?.tracking_url ||
    order?.fulfillments?.[0]?.trackingUrl ||
    order?.fulfillments?.[0]?.tracking_url ||
    order?.fulfillments?.[0]?.trackingInfo?.[0]?.url ||
    ''
  );
}

function getCarrier(order: any): string {
  return (
    order?.carrier ||
    order?.trackingCompany ||
    order?.tracking_company ||
    order?.fulfillment?.trackingCompany ||
    order?.fulfillments?.[0]?.trackingCompany ||
    order?.fulfillments?.[0]?.trackingInfo?.[0]?.company ||
    ''
  );
}

function labelFor(status: TrackingTimelineStatus): string {
  switch (status) {
    case 'delivered':
      return 'Delivered';
    case 'out_for_delivery':
      return 'Out for delivery';
    case 'shipped':
      return 'Shipped';
    default:
      return 'Processing';
  }
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f0e2d3',
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4e260d',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pill_ordered: { backgroundColor: '#fff0e0' },
  pill_shipped: { backgroundColor: '#e8f0ff' },
  pill_out_for_delivery: { backgroundColor: '#fff7e0' },
  pill_delivered: { backgroundColor: '#e0f5e8' },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4e260d',
  },

  timeline: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotReached: {
    backgroundColor: '#ff6a00',
  },
  stepDotPending: {
    backgroundColor: '#f3ede7',
    borderWidth: 1,
    borderColor: '#e0d6cb',
  },
  stepLine: {
    width: 2,
    height: 26,
    marginVertical: 2,
  },
  stepLineReached: {
    backgroundColor: '#ff6a00',
  },
  stepLinePending: {
    backgroundColor: '#e8dfd5',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
    paddingTop: 5,
    paddingBottom: 20,
  },
  stepLabelReached: {
    color: '#111',
  },
  stepLabelPending: {
    color: '#aaa',
  },

  trackingCard: {
    marginTop: 8,
    backgroundColor: '#fbf7f2',
    borderRadius: 14,
    padding: 14,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingNumber: {
    flex: 1,
    color: '#4e260d',
    fontSize: 13,
    fontWeight: '800',
  },
  carrier: {
    marginTop: 4,
    color: '#8a7a6f',
    fontSize: 12,
    fontWeight: '600',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#ff6a00',
    borderRadius: 12,
    paddingVertical: 11,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
