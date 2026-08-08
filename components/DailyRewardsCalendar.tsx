import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCart } from '../context/CartContext';
import { hapticSuccess, hapticTap } from '../utils/haptics';
import {
  claimTodayReward,
  DAILY_REWARD_EXPIRY_HOURS,
  DAILY_REWARD_UNLOCK_REQUIREMENT_USD,
  getDailyRewardsCalendarState,
  type DailyRewardTile,
} from '../utils/daily-rewards-calendar';
import { formatGameRewardUsd } from '../utils/reward-currency';

/**
 * Casino-style 7-day Daily Rewards calendar.
 * Escalating locked rewards, day 7 bonus, and the "don't break your
 * streak" FOMO. Rewards are locked store credit (require qualifying spend),
 * so the merchant never hands out cash.
 */
export function DailyRewardsCalendar() {
  const cart = useCart() as any;
  const addLockedReward = cart?.addLockedReward;

  const [tiles, setTiles] = useState<DailyRewardTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [justClaimed, setJustClaimed] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);

  const refresh = useCallback(async () => {
    const state = await getDailyRewardsCalendarState();
    setTiles(state.tiles);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const todayTile = useMemo(() => tiles.find((t) => t.isToday), [tiles]);
  const claimedCount = useMemo(() => tiles.filter((t) => t.claimed).length, [tiles]);
  const nextAmount = todayTile?.claimed ? null : todayTile?.amountUsd ?? DAILY_REWARD_SCHEDULE_FIRST_AMOUNT;

  const handleClaim = useCallback(async () => {
    if (claiming || !todayTile || todayTile.claimed) return;
    setClaiming(true);
    try {
      const { grantedUsd, streak } = await claimTodayReward();

      if (grantedUsd > 0 && addLockedReward) {
        addLockedReward(
          grantedUsd,
          DAILY_REWARD_UNLOCK_REQUIREMENT_USD,
          `Day ${todayTile.day} reward — unlocks with qualifying spend`,
          DAILY_REWARD_EXPIRY_HOURS
        );
      }

      // Also grant any streak milestone (day 3/7/14/30 bonus) from this claim.
      if (streak.milestoneRewardUsd && streak.milestoneLabel && addLockedReward) {
        addLockedReward(
          streak.milestoneRewardUsd,
          DAILY_REWARD_UNLOCK_REQUIREMENT_USD,
          streak.milestoneLabel,
          72
        );
      }

      setJustClaimed(grantedUsd > 0 ? grantedUsd : null);
      void hapticSuccess();
      await refresh();
    } finally {
      setClaiming(false);
    }
  }, [addLockedReward, claiming, refresh, todayTile]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#ffd166" />
      </View>
    );
  }

  if (!tiles.length) return null;

  return (
    <LinearGradient
      colors={['#1c0f2e', '#2b1638', '#1c0f2e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={16} color="#b388ff" />
          </View>
          <View>
            <Text style={styles.kicker}>DAILY REWARDS</Text>
            <Text style={styles.title}>Check in every day. Win more.</Text>
          </View>
        </View>
        <View style={styles.claimedPill}>
          <Text style={styles.claimedPillText}>{claimedCount}/7 claimed</Text>
        </View>
      </View>

      {/* 7-day grid */}
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <RewardTile key={tile.day} tile={tile} />
        ))}
      </View>

      <Text style={styles.unlockNote}>
        Rewards unlock as store credit after qualifying orders (${DAILY_REWARD_UNLOCK_REQUIREMENT_USD}+). Not
        withdrawable cash.
      </Text>

      {/* Claim CTA */}
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.claimButton,
          (!todayTile || todayTile.claimed) && styles.claimButtonDone,
          pressed && styles.claimButtonPressed,
        ]}
        onPress={() => void handleClaim()}
        disabled={!todayTile || todayTile.claimed || claiming}
      >
        <LinearGradient
          colors={todayTile && !todayTile.claimed ? ['#b388ff', '#8a5cff'] : ['#3a2a4a', '#3a2a4a']}
          style={styles.claimGradient}
        >
          <Ionicons
            name={todayTile && !todayTile.claimed ? 'gift' : 'checkmark-circle'}
            size={16}
            color={todayTile && !todayTile.claimed ? '#fff' : '#b388ff'}
          />
          <Text style={styles.claimText}>
            {claiming
              ? 'Claiming…'
              : !todayTile
                ? 'Check in tomorrow'
                : todayTile.claimed
                  ? 'Claimed for today'
                  : `Claim ${todayTile.label}`}
          </Text>
        </LinearGradient>
      </Pressable>

      {justClaimed ? (
        <View style={styles.claimedBanner}>
          <Ionicons name="sparkles" size={14} color="#1c0f2e" />
          <Text style={styles.claimedBannerText}>
            +{formatGameRewardUsd(justClaimed)} added to your locked balance!
          </Text>
        </View>
      ) : null}

      {todayTile && !todayTile.claimed && !claiming ? (
        <Text style={styles.fomoCopy}>
          Miss a day and your streak resets — {nextAmount != null ? `claim ${nextAmount >= 1 ? formatGameRewardUsd(nextAmount) : `$${nextAmount.toFixed(2)}`} now.` : ''}
        </Text>
      ) : null}
    </LinearGradient>
  );
}

const DAILY_REWARD_SCHEDULE_FIRST_AMOUNT = 0.5;

function RewardTile({ tile }: { tile: DailyRewardTile }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (tile.isToday && !tile.claimed) {
      pulse.value = withRepeat(
        withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })),
        -1,
        false
      );
    } else {
      pulse.value = 0;
    }
  }, [tile.isToday, tile.claimed, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 }],
    borderColor: tile.isToday && !tile.claimed ? '#b388ff' : 'rgba(255,255,255,0.12)',
    borderWidth: 1,
  }));

  return (
    <Animated.View
      style={[
        styles.tile,
        tile.isBonus && styles.tileBonus,
        tile.claimed && styles.tileClaimed,
        tile.isToday && !tile.claimed && styles.tileToday,
        pulseStyle,
      ]}
    >
      <Text style={[styles.tileDay, tile.isBonus && styles.tileDayBonus]}>
        {tile.isBonus ? '⭐' : tile.day}
      </Text>
      <Text style={[styles.tileAmount, tile.claimed && styles.tileAmountClaimed]} numberOfLines={1}>
        {tile.label}
      </Text>
      {tile.claimed ? (
        <View style={styles.tileCheck}>
          <Ionicons name="checkmark" size={10} color="#1c0f2e" />
        </View>
      ) : tile.isToday ? (
        <View style={styles.tileTodayBadge}>
          <Text style={styles.tileTodayBadgeText}>TODAY</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  card: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(179,136,255,0.3)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(179,136,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { color: '#b388ff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 1 },
  claimedPill: {
    backgroundColor: 'rgba(179,136,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  claimedPillText: { color: '#b388ff', fontSize: 11, fontWeight: '800' },

  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tileBonus: {
    backgroundColor: 'rgba(179,136,255,0.22)',
  },
  tileToday: {
    backgroundColor: 'rgba(179,136,255,0.16)',
  },
  tileClaimed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tileDay: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  tileDayBonus: {
    fontSize: 13,
  },
  tileAmount: {
    marginTop: 4,
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  tileAmountClaimed: {
    color: 'rgba(255,255,255,0.35)',
  },
  tileCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#ffd166',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTodayBadge: {
    marginTop: 4,
    backgroundColor: '#b388ff',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  tileTodayBadgeText: { color: '#fff', fontSize: 7, fontWeight: '900' },

  unlockNote: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  claimButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  claimButtonDone: {
    opacity: 0.8,
  },
  claimButtonPressed: {
    opacity: 0.9,
  },
  claimGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  claimText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffd166',
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  claimedBannerText: {
    color: '#1c0f2e',
    fontSize: 12,
    fontWeight: '800',
  },
  fomoCopy: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
