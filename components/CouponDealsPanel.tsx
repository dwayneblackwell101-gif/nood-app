import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  claimCoupon,
  COUPON_DEALS,
  getActiveCoupons,
  getCouponRemainingMs,
  hasActiveCoupon,
  type CouponDeal,
} from '../utils/coupon-deals';
import { hapticSuccess, hapticTap } from '../utils/haptics';
import { CountdownTimer } from './CountdownTimer';

/**
 * Temu-style countdown coupon deals row.
 * Shows each coupon with a live countdown once claimed.
 */
export function CouponDealsPanel() {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(async () => {
    const active = await getActiveCoupons();
    setActiveIds(new Set(active.map((c) => c.id)));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshTick]);

  const handleClaim = async (deal: CouponDeal) => {
    const already = await hasActiveCoupon(deal.id);
    if (already) {
      void hapticTap();
      return;
    }
    const claimed = await claimCoupon(deal.id);
    if (claimed) {
      void hapticSuccess();
      setRefreshTick((t) => t + 1);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Limited-time coupons</Text>
        <Text style={styles.subtitle}>Claim now — they expire fast</Text>
      </View>

      {COUPON_DEALS.map((deal) => (
        <CouponRow
          key={deal.id}
          deal={deal}
          claimed={activeIds.has(deal.id)}
          onClaim={() => handleClaim(deal)}
        />
      ))}
    </View>
  );
}

function CouponRow({
  deal,
  claimed,
  onClaim,
}: {
  deal: CouponDeal;
  claimed: boolean;
  onClaim: () => void;
}) {
  return (
    <View style={[styles.couponCard, claimed && styles.couponCardClaimed]}>
      <View style={styles.couponLeft}>
        <Text style={styles.couponEmoji}>{deal.emoji}</Text>
        <View>
          <Text style={styles.couponTitle}>{deal.title}</Text>
          <Text style={styles.couponDesc}>{deal.description}</Text>
          {deal.minSpend ? (
            <Text style={styles.couponMin}>Min. order ${deal.minSpend}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.couponRight}>
        {claimed ? (
          <CouponCountdown dealId={deal.id} />
        ) : (
          <TouchableOpacity style={styles.claimButton} activeOpacity={0.85} onPress={onClaim}>
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function CouponCountdown({ dealId }: { dealId: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCouponRemainingMs(dealId).then((ms) => {
      if (!cancelled) setRemaining(ms);
    });
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  if (remaining === null || remaining <= 0) {
    return (
      <View style={styles.expiredPill}>
        <Text style={styles.expiredText}>Expired</Text>
      </View>
    );
  }

  return (
    <View style={styles.countdownWrap}>
      <Text style={styles.countdownLabel}>Expires in</Text>
      <CountdownTimer
        targetTimeMs={Date.now() + remaining}
        showLabels={false}
        style={styles.timer}
        segmentStyle={styles.timerSegment}
        numberStyle={styles.timerNumber}
        colonStyle={styles.timerColon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 14,
    marginBottom: 14,
  },
  header: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  title: { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: '#8a7a6f', fontWeight: '600', marginTop: 2 },

  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffd6b8',
    padding: 14,
    marginBottom: 10,
  },
  couponCardClaimed: {
    borderColor: '#ff8a3d',
    backgroundColor: '#fff7ee',
  },
  couponLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  couponEmoji: { fontSize: 28 },
  couponTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
  couponDesc: { fontSize: 12, color: '#6f5a4e', marginTop: 2 },
  couponMin: { fontSize: 11, color: '#ff6a00', fontWeight: '700', marginTop: 4 },

  couponRight: { marginLeft: 10 },
  claimButton: {
    backgroundColor: '#ff6a00',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  claimButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  countdownWrap: { alignItems: 'flex-end' },
  countdownLabel: { fontSize: 10, color: '#8a7a6f', fontWeight: '700', marginBottom: 4 },
  timer: { alignSelf: 'flex-end' },
  timerSegment: {
    minWidth: 24,
    backgroundColor: '#ff6a00',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  timerNumber: { fontSize: 12, lineHeight: 14 },
  timerColon: { fontSize: 12, color: '#ff6a00' },

  expiredPill: {
    backgroundColor: '#f3ede7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  expiredText: { color: '#999', fontSize: 12, fontWeight: '800' },
});
