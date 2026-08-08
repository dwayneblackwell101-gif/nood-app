import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  getDailyStreakState,
  recordDailyCheckIn,
  STREAK_POINTS_PER_DAY,
  type DailyStreakState,
} from '../utils/daily-streak';
import { useCart } from '../context/CartContext';

/**
 * Daily streak card for the Rewards hub.
 * Shows current streak, week dots, and a Check-in button. Check-ins can
 * unlock milestone NOOD Balance rewards (day 3/7/14/30) via addLockedReward.
 */
export function DailyStreakCard() {
  const router = useRouter();
  const cart = useCart() as any;
  const addLockedReward = cart?.addLockedReward;

  const [state, setState] = useState<DailyStreakState | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [justRewarded, setJustRewarded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await getDailyStreakState();
    setState(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const weekDots = useMemo(() => {
    if (!state) return [false, false, false, false, false, false, false];
    const withinWeek = ((state.currentStreak - 1) % 7) + 1;
    return Array.from({ length: 7 }, (_, i) => i < withinWeek);
  }, [state]);

  const handleCheckIn = useCallback(async () => {
    if (checkingIn || !state?.todayCheckedIn === false) return;
    setCheckingIn(true);
    try {
      const next = await recordDailyCheckIn();
      setState(next);

      if (next.milestoneRewardUsd && next.milestoneLabel) {
        if (addLockedReward) {
          addLockedReward(
            next.milestoneRewardUsd,
            25,
            `${next.milestoneLabel} (${next.milestoneRewardUsd > 5 ? 'streak' : 'streak bonus'})`,
            72
          );
        }
        setJustRewarded(next.milestoneLabel);
      }
    } finally {
      setCheckingIn(false);
    }
  }, [addLockedReward, checkingIn, state]);

  if (!state) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#ffd166" />
      </View>
    );
  }

  const streakLabel = state.currentStreak === 0 ? 'Start your streak' : `${state.currentStreak} day${state.currentStreak === 1 ? '' : 's'} in a row`;

  return (
    <LinearGradient
      colors={['#2b1b0e', '#4a2c12']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="flame" size={22} color="#ffd166" />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.kicker}>DAILY STREAK</Text>
          <Text style={styles.title}>{streakLabel}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{state.currentStreak}d</Text>
        </View>
      </View>

      {/* Streak protectors */}
      {state.streakProtectors > 0 ? (
        <View style={styles.protectorRow}>
          <Ionicons name="shield-checkmark" size={13} color="#ffd166" />
          <Text style={styles.protectorText}>
            {state.streakProtectors} streak freeze{state.streakProtectors === 1 ? '' : 's'} — miss a day and your streak is saved
          </Text>
        </View>
      ) : null}

      {/* Week dots */}
      <View style={styles.dotsRow}>
        {weekDots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled ? styles.dotFilled : styles.dotEmpty]}>
            {filled ? <Ionicons name="checkmark" size={10} color="#2b1b0e" /> : null}
          </View>
        ))}
      </View>

      <Text style={styles.copy}>
        Check in every day to earn {STREAK_POINTS_PER_DAY} pts/day and unlock streak bonuses.
      </Text>

      {justRewarded ? (
        <View style={styles.rewardBanner}>
          <Ionicons name="gift" size={14} color="#2b1b0e" />
          <Text style={styles.rewardBannerText}>{justRewarded} unlocked!</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, state.todayCheckedIn && styles.buttonDone]}
        activeOpacity={0.9}
        onPress={() => void handleCheckIn()}
        disabled={state.todayCheckedIn || checkingIn}
      >
        <Ionicons name={state.todayCheckedIn ? 'checkmark-circle' : 'flame'} size={18} color="#2b1b0e" />
        <Text style={styles.buttonText}>
          {checkingIn ? 'Checking in…' : state.todayCheckedIn ? 'Checked in today' : 'Check in today'}
        </Text>
      </TouchableOpacity>

      {state.daysToNextMilestone > 0 && state.nextMilestoneDay > 0 ? (
        <Text style={styles.nextMilestone}>
          {state.daysToNextMilestone} day{state.daysToNextMilestone === 1 ? '' : 's'} to the Day {state.nextMilestoneDay} bonus
        </Text>
      ) : null}

      <Pressable style={styles.viewAll} onPress={() => router.push('/account/rewards' as any)}>
        <Text style={styles.viewAllText}>View all rewards</Text>
        <Ionicons name="chevron-forward" size={13} color="#ffd166" />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 32, alignItems: 'center' },
  card: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.25)',
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,209,102,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleWrap: { flex: 1 },
  kicker: { color: '#ffd166', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 2 },
  badge: {
    backgroundColor: 'rgba(255,209,102,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: '#ffd166', fontSize: 13, fontWeight: '900' },
  protectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,209,102,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 12,
  },
  protectorText: { color: '#ffd166', fontSize: 11, fontWeight: '700', flex: 1 },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: { backgroundColor: '#ffd166' },
  dotEmpty: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  copy: { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 17, marginTop: 12 },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffd166',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 10,
  },
  rewardBannerText: { color: '#2b1b0e', fontSize: 12, fontWeight: '800' },
  button: {
    marginTop: 14,
    backgroundColor: '#ffd166',
    borderRadius: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  buttonDone: { backgroundColor: 'rgba(255,209,102,0.35)' },
  buttonText: { color: '#2b1b0e', fontSize: 15, fontWeight: '900' },
  nextMilestone: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  viewAllText: { color: '#ffd166', fontSize: 12, fontWeight: '800' },
});
