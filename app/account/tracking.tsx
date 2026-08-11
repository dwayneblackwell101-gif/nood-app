import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Clipboard,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useCart } from '../../context/CartContext';
import { getBackendJson } from '../../utils/backend';
import { noodAlert } from '../../utils/nood-alert';

// ─── Types ──────────────────────────────────────────────────────────────

export type TrackingStatus =
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'at_local_facility'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'delivered'
  | 'delayed'
  | 'exception'
  | 'returned';

type TrackingData = {
  shopifyOrderId?: string;
  orderName?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: TrackingStatus;
  friendlyStatus?: string;
  latestEventTitle?: string;
  latestEventDescription?: string;
  latestEventLocation?: string;
  latestEventAt?: string;
  estimatedDelivery?: string;
  trackingHistory?: {
    status: string;
    title?: string;
    description?: string;
    location?: string;
    at?: string;
  }[];
  updatedAt?: string;
};

const TRACKER_STEPS = ['Ordered', 'Packed', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered'];

// Progress index per normalized status (matches backend utils/tracking.js).
const PROGRESS_INDEX: Record<string, number> = {
  confirmed: 0,
  processing: 0,
  packed: 1,
  shipped: 2,
  in_transit: 3,
  at_local_facility: 3,
  out_for_delivery: 4,
  delivery_attempted: 4,
  delivered: 5,
  delayed: -1,
  exception: -1,
  returned: -1,
};

const OFF_TRACK = new Set(['delayed', 'exception', 'returned']);

// ─── Status meta ────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; tone: 'ok' | 'warn' | 'err' }
> = {
  confirmed: { label: 'Order confirmed', icon: 'receipt-outline', color: '#2e7d32', tone: 'ok' },
  processing: { label: 'Processing', icon: 'cog-outline', color: '#ff6a00', tone: 'warn' },
  packed: { label: 'Packed', icon: 'cube-outline', color: '#1686d9', tone: 'ok' },
  shipped: { label: 'Shipped', icon: 'cube-outline', color: '#1686d9', tone: 'ok' },
  in_transit: { label: 'In transit', icon: 'car-outline', color: '#1686d9', tone: 'ok' },
  at_local_facility: { label: 'At local facility', icon: 'business-outline', color: '#1686d9', tone: 'ok' },
  out_for_delivery: { label: 'Out for delivery', icon: 'car-sport-outline', color: '#1686d9', tone: 'ok' },
  delivery_attempted: { label: 'Delivery attempted', icon: 'alert-circle-outline', color: '#ff6a00', tone: 'warn' },
  delivered: { label: 'Delivered', icon: 'checkmark-done-circle-outline', color: '#2e7d32', tone: 'ok' },
  delayed: { label: 'Delayed', icon: 'time-outline', color: '#ff6a00', tone: 'warn' },
  exception: { label: 'Delivery exception', icon: 'warning-outline', color: '#ff3b30', tone: 'err' },
  returned: { label: 'Returned to sender', icon: 'return-down-back-outline', color: '#ff3b30', tone: 'err' },
};

function statusMeta(status: string) {
  return STATUS_META[status] || STATUS_META.confirmed;
}

function formatWhen(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function formatEta(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Animated sub-components ────────────────────────────────────────────

function AnimatedCheck({ reached, reducedMotion }: { reached: boolean; reducedMotion: boolean }) {
  const scale = useSharedValue(reached ? 1 : 0.6);
  const opacity = useSharedValue(reached ? 1 : 0.4);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    scale.value = withSpring(reached ? 1 : 0.6, { damping: 12, stiffness: 180 });
    opacity.value = withTiming(reached ? 1 : 0.4, { duration: 250 });
  }, [reached, reducedMotion, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.checkCircle, style]}>
      <Ionicons name={reached ? 'checkmark' : 'ellipse-outline'} size={13} color="#fff" />
    </Animated.View>
  );
}

function StatusAnimation({ status, reducedMotion }: { status: string; reducedMotion: boolean }) {
  const drift = useSharedValue(0);
  const pulse = useSharedValue(0.4);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion || OFF_TRACK.has(status)) return;
    drift.value = 0;
    pulse.value = 0.4;
    spin.value = 0;

    if (status === 'processing') {
      pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else if (status === 'shipped' || status === 'in_transit' || status === 'at_local_facility') {
      drift.value = withRepeat(withSequence(withTiming(6, { duration: 900 }), withTiming(-6, { duration: 900 })), -1, true);
    } else if (status === 'out_for_delivery') {
      drift.value = withRepeat(withSequence(withTiming(10, { duration: 500 }), withTiming(0, { duration: 500 })), -1, true);
      pulse.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }), -1, true);
    } else if (status === 'delivered') {
      pulse.value = withSequence(withTiming(1, { duration: 500 }), withDelay(250, withTiming(0.4, { duration: 500 })));
      spin.value = withSequence(withTiming(0, { duration: 0 }), withTiming(360, { duration: 900 }));
    }
  }, [status, reducedMotion, drift, pulse, spin]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }, { rotate: `${spin.value}deg` }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.85 + pulse.value * 0.2 }],
  }));

  const meta = statusMeta(status);

  if (reducedMotion || OFF_TRACK.has(status)) {
    return (
      <View style={styles.statusIconWrap}>
        <Ionicons name={meta.icon} size={46} color={meta.color} />
      </View>
    );
  }

  return (
    <View style={styles.statusIconWrap}>
      <Animated.View style={[styles.statusHalo, { backgroundColor: `${meta.color}30` }, haloStyle]} />
      <Animated.View style={iconStyle}>
        <Ionicons name={meta.icon} size={46} color={meta.color} />
      </Animated.View>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────

export default function TrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { orders } = useCart();

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => setReducedMotion(false));
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReducedMotion);
    return () => sub?.remove?.();
  }, []);

  // Local order fallback (from the cart/orders context) for the header.
  const localOrder = useMemo(() => {
    if (!orderId) return null;
    return (orders || []).find(
      (o: any) => String(o?.id) === String(orderId) || String(o?.shopifyOrderId) === String(orderId) || String(o?.name) === String(orderId)
    );
  }, [orders, orderId]);

  const loadTracking = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await getBackendJson<any>(`/api/tracking/${encodeURIComponent(orderId)}`, {
        timeoutMs: 10000,
      });
      if (data?.success && data?.tracking) {
        setTracking(data.tracking);
      } else {
        setTracking(null);
      }
    } catch {
      setTracking(null);
    }
  }, [orderId]);

  useEffect(() => {
    void loadTracking();
  }, [loadTracking]);

  // Effective status: backend normalized status, else inferred from local order.
  const status: string = tracking?.status || inferLocalStatus(localOrder);
  const meta = statusMeta(status);
  const progressIndex = PROGRESS_INDEX[status] != null ? PROGRESS_INDEX[status] : -1;
  const offTrack = OFF_TRACK.has(status);

  const carrier = tracking?.carrier || localOrder?.carrier || localOrder?.trackingCompany || localOrder?.tracking_company || '';
  const trackingNumber =
    tracking?.trackingNumber ||
    localOrder?.trackingNumber ||
    localOrder?.tracking_number ||
    localOrder?.fulfillment?.trackingNumber ||
    localOrder?.fulfillments?.[0]?.trackingNumber ||
    '';
  const trackingUrl =
    tracking?.trackingUrl ||
    localOrder?.trackingUrl ||
    localOrder?.tracking_url ||
    localOrder?.fulfillment?.trackingUrl ||
    localOrder?.fulfillments?.[0]?.trackingUrl ||
    '';
  const orderLabel = tracking?.orderName || localOrder?.name || `Order ${String(orderId || '').slice(-8)}`;
  const eta = formatEta(tracking?.estimatedDelivery);

  const handleCopyTracking = () => {
    if (!trackingNumber) return;
    Clipboard.setString(String(trackingNumber));
    noodAlert('Tracking number copied', String(trackingNumber));
  };

  const handleTrack = () => {
    const url =
      trackingUrl ||
      (trackingNumber ? `https://t.17track.net/en#nums=${encodeURIComponent(String(trackingNumber))}` : '');
    if (!url) return;
    void Linking.openURL(url).catch(() => {});
  };

  const handleSupport = () => {
    router.push('/account/support' as any);
  };

  const handleViewOrder = () => {
    router.push({
      pathname: '/account/orders',
      params: orderId ? { orderId } : undefined,
    } as any);
  };

  const timeline = useMemo(() => {
    const history = Array.isArray(tracking?.trackingHistory) ? tracking.trackingHistory : [];
    if (history.length) return history;
    // Fall back to a single "current status" event so the timeline is never empty.
    return [
      {
        status,
        title: meta.label,
        description: tracking?.latestEventDescription || '',
        location: tracking?.latestEventLocation || '',
        at: tracking?.latestEventAt || tracking?.updatedAt,
      },
    ];
  }, [tracking, status, meta.label]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Order Tracking</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header card */}
        <View style={[styles.heroCard, { borderTopColor: meta.color }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.orderNumber}>{orderLabel}</Text>
              <View style={[styles.statusPill, { backgroundColor: `${meta.color}16` }]}>
                <Ionicons name={meta.icon} size={13} color={meta.color} />
                <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>
            <StatusAnimation status={status} reducedMotion={reducedMotion} />
          </View>

          {eta ? (
            <View style={styles.etaRow}>
              <Ionicons name="calendar-outline" size={14} color="#6f5a4e" />
              <Text style={styles.etaText}>Estimated delivery: {eta}</Text>
            </View>
          ) : null}
          {tracking?.latestEventLocation ? (
            <View style={styles.etaRow}>
              <Ionicons name="location-outline" size={14} color="#6f5a4e" />
              <Text style={styles.etaText}>{tracking.latestEventLocation}</Text>
            </View>
          ) : null}
        </View>

        {/* Progress tracker */}
        <View style={styles.trackerCard}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.trackerRow}>
            {TRACKER_STEPS.map((step, index) => {
              const reached = !offTrack && index <= progressIndex;
              const isCurrent = !offTrack && index === progressIndex;
              return (
                <View key={step} style={styles.trackerStep}>
                  <View style={styles.trackerStepLeft}>
                    <AnimatedCheck reached={reached} reducedMotion={reducedMotion} />
                    {index < TRACKER_STEPS.length - 1 ? (
                      <View
                        style={[
                          styles.trackerLine,
                          reached && index < progressIndex ? styles.trackerLineReached : null,
                        ]}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.trackerLabel,
                      reached ? styles.trackerLabelReached : null,
                      isCurrent ? styles.trackerLabelCurrent : null,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>

          {offTrack ? (
            <View style={[styles.offTrackBanner, { backgroundColor: `${meta.color}14` }]}>
              <Ionicons name="warning-outline" size={16} color={meta.color} />
              <Text style={[styles.offTrackText, { color: meta.color }]}>
                {meta.label} — we&apos;re on it. Need help? Tap below.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Tracking info */}
        {trackingNumber ? (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Tracking information</Text>

            {carrier ? (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={16} color="#9a8b80" />
                <Text style={styles.infoLabel}>Carrier</Text>
                <Text style={styles.infoValue}>{carrier}</Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Ionicons name="barcode-outline" size={16} color="#9a8b80" />
              <Text style={styles.infoLabel}>Tracking number</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {trackingNumber}
              </Text>
            </View>

            {tracking?.latestEventDescription ? (
              <View style={styles.latestEventBox}>
                <Text style={styles.latestEventTitle}>{tracking.latestEventTitle || 'Latest update'}</Text>
                <Text style={styles.latestEventDesc}>{tracking.latestEventDescription}</Text>
                {formatWhen(tracking.latestEventAt) ? (
                  <Text style={styles.latestEventTime}>{formatWhen(tracking.latestEventAt)}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.9} onPress={handleTrack}>
                <Ionicons name="navigate-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Track package</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGhost]}
                activeOpacity={0.9}
                onPress={handleCopyTracking}
              >
                <Ionicons name="copy-outline" size={16} color="#ff6a00" />
                <Text style={[styles.actionBtnText, styles.actionBtnGhostText]}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Timeline */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Tracking timeline</Text>
          {timeline.length ? (
            timeline.map((event, index) => {
              const evtMeta = statusMeta(event.status);
              const isLast = index === timeline.length - 1;
              return (
                <View key={`${event.at || index}-${index}`} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: evtMeta.color }]}>
                      <Ionicons name={evtMeta.icon} size={11} color="#fff" />
                    </View>
                    {!isLast ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineTitle}>{event.title || evtMeta.label}</Text>
                    {event.description ? (
                      <Text style={styles.timelineDesc}>{event.description}</Text>
                    ) : null}
                    {event.location ? (
                      <Text style={styles.timelineLoc}>
                        <Ionicons name="location-outline" size={11} color="#9a8b80" /> {event.location}
                      </Text>
                    ) : null}
                    {formatWhen(event.at) ? (
                      <Text style={styles.timelineTime}>{formatWhen(event.at)}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              {status === 'confirmed' || status === 'processing'
                ? 'Your order is being prepared. Tracking updates will appear here as your package moves.'
                : 'No tracking events yet.'}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.linkRow} activeOpacity={0.9} onPress={handleViewOrder}>
            <Ionicons name="receipt-outline" size={18} color="#ff6a00" />
            <Text style={styles.linkRowText}>View order details</Text>
            <Ionicons name="chevron-forward" size={16} color="#9a8b80" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} activeOpacity={0.9} onPress={handleSupport}>
            <Ionicons name="help-buoy-outline" size={18} color="#ff6a00" />
            <Text style={styles.linkRowText}>Get help / Contact support</Text>
            <Ionicons name="chevron-forward" size={16} color="#9a8b80" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Local status inference fallback ────────────────────────────────────

function inferLocalStatus(order: any): TrackingStatus {
  const raw = String(
    order?.fulfillmentStatus ||
      order?.fulfillment_status ||
      order?.status ||
      order?.fulfillment?.status ||
      order?.fulfillments?.[0]?.status ||
      ''
  )
    .trim()
    .toLowerCase();
  const hasTracking = Boolean(
    order?.trackingNumber ||
      order?.tracking_number ||
      order?.fulfillments?.[0]?.tracking_number ||
      order?.trackingUrl
  );
  if (!raw && !hasTracking) return 'confirmed';
  if (raw.includes('deliver')) return 'delivered';
  if (raw.includes('out for delivery') || raw.includes('out_for_delivery')) return 'out_for_delivery';
  if (raw.includes('transit')) return 'in_transit';
  if (raw.includes('ship') || raw.includes('fulfill') || hasTracking) return 'shipped';
  if (raw.includes('pack')) return 'packed';
  if (raw.includes('process')) return 'processing';
  return 'confirmed';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f4f2' },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f2c7ab',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '900', color: '#111' },
  headerSpacer: { width: 42 },

  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTextWrap: { flex: 1, paddingRight: 12 },
  orderNumber: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 8 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  statusPillText: { fontSize: 12, fontWeight: '900' },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  etaText: { color: '#6f5a4e', fontSize: 13, fontWeight: '700', flex: 1 },

  statusIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff7f2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statusHalo: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  trackerCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 12 },
  trackerRow: { paddingLeft: 4 },
  trackerStep: { flexDirection: 'row', alignItems: 'flex-start' },
  trackerStepLeft: { width: 26, alignItems: 'center' },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerLine: {
    width: 3,
    height: 34,
    backgroundColor: '#eadfd6',
    marginTop: 2,
    alignSelf: 'center',
  },
  trackerLineReached: { backgroundColor: '#ff6a00' },
  trackerLabel: {
    marginLeft: 10,
    paddingTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#9a8b80',
  },
  trackerLabelReached: { color: '#111' },
  trackerLabelCurrent: { fontWeight: '900', color: '#ff6a00' },

  offTrackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  offTrackText: { flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 18 },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  infoLabel: { color: '#9a8b80', fontSize: 13, fontWeight: '700', width: 110 },
  infoValue: { flex: 1, color: '#111', fontSize: 14, fontWeight: '800' },

  latestEventBox: {
    backgroundColor: '#fff7f2',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  latestEventTitle: { color: '#111', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  latestEventDesc: { color: '#5d514b', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  latestEventTime: { color: '#9a8b80', fontSize: 11, fontWeight: '700', marginTop: 6 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ff6a00',
    borderRadius: 14,
    paddingVertical: 12,
  },
  actionBtnGhost: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f2c7ab' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  actionBtnGhostText: { color: '#ff6a00' },

  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: { width: 3, flex: 1, minHeight: 26, backgroundColor: '#eadfd6', marginTop: 4 },
  timelineBody: { flex: 1, paddingLeft: 10, paddingBottom: 16 },
  timelineTitle: { color: '#111', fontSize: 14, fontWeight: '900' },
  timelineDesc: { color: '#5d514b', fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 3 },
  timelineLoc: { color: '#9a8b80', fontSize: 11, fontWeight: '700', marginTop: 3 },
  timelineTime: { color: '#9a8b80', fontSize: 11, fontWeight: '700', marginTop: 3 },

  emptyText: { color: '#6f5a4e', fontSize: 13, lineHeight: 19, fontWeight: '600' },

  footerActions: { marginTop: 2 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f2c7ab',
    padding: 16,
    marginBottom: 10,
  },
  linkRowText: { flex: 1, color: '#111', fontSize: 14, fontWeight: '800' },
});
