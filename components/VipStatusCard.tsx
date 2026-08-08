import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getVipProgress, getVipTier } from '../utils/vip-tiers';

/**
 * VIP status card — shows current tier, progress to next, and the perk.
 * "Don't lose your status" is the retention hook.
 */
export function VipStatusCard({
  qualifyingSpendUsd,
  formatMoney,
}: {
  qualifyingSpendUsd: number;
  formatMoney: (value: number) => string;
}) {
  const { current, next, progressPct, spendToNext } = getVipProgress(qualifyingSpendUsd);
  const tier = getVipTier(qualifyingSpendUsd);

  const tierColors: Record<number, string[]> = {
    1: ['#4a3420', '#6b4a2a', '#8a5a30'],
    2: ['#3a3a45', '#52525e', '#6a6a7a'],
    3: ['#3a2a00', '#5a4200', '#8a6300'],
    4: ['#1a2a3a', '#2a4058', '#3a5a78'],
  };
  const colors = tierColors[tier.level] || tierColors[1];

  return (
    <LinearGradient colors={colors as [string, string, string]} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <View style={styles.iconWrap}>
            <Ionicons name="diamond" size={16} color="#ffd166" />
          </View>
          <View>
            <Text style={styles.kicker}>YOUR VIP STATUS</Text>
            <Text style={styles.tierName}>{tier.name} member</Text>
          </View>
        </View>

        <View style={styles.multiplierBadge}>
          <Text style={styles.multiplierText}>{tier.rewardMultiplier}×</Text>
          <Text style={styles.multiplierLabel}>rewards</Text>
        </View>
      </View>

      <Text style={styles.perk}>💎 {tier.perk}</Text>

      {/* Progress to next tier */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {next ? `$${formatMoney(qualifyingSpendUsd)} / $${next.minSpendUsd.toFixed(0)}` : 'Max tier reached'}
        </Text>
        <Text style={styles.progressTarget}>
          {next ? `Next: ${next.name}` : 'VIP Elite'}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPct}%` }]} />
      </View>
      <Text style={styles.progressHint}>
        {next
          ? `${formatMoney(spendToNext)} more in qualifying orders to reach ${next.name}`
          : 'You’ve unlocked every VIP perk. Legend!'}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.3)',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,209,102,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { color: '#ffd166', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tierName: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 1 },
  multiplierBadge: {
    backgroundColor: 'rgba(255,209,102,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  multiplierText: { color: '#ffd166', fontSize: 16, fontWeight: '900' },
  multiplierLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700' },
  perk: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  progressLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
  progressTarget: { color: '#ffd166', fontSize: 11, fontWeight: '900' },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: '100%',
    backgroundColor: '#ffd166',
    borderRadius: 3,
  },
  progressHint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});
