import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { hapticSuccess } from '../utils/haptics';
import {
  claimQuestReward,
  getQuestProgress,
  type QuestId,
  type QuestProgress,
} from '../utils/quest-engine';
import { formatGameRewardUsd } from '../utils/reward-currency';

const QUEST_META: Record<
  QuestId,
  { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; desc: string }
> = {
  'browse-3-categories': {
    title: 'Browse 3 categories',
    icon: 'compass-outline',
    color: '#5c31ff',
    desc: 'Explore different departments',
  },
  'review-1-photo': {
    title: 'Submit a photo review',
    icon: 'camera-outline',
    color: '#ff6a00',
    desc: 'Review an item you bought',
  },
  'share-1-product': {
    title: 'Share a product',
    icon: 'share-social-outline',
    color: '#1a8a5a',
    desc: 'Send a deal to a friend',
  },
};

/**
 * Quests panel for the Rewards hub. Shows live progress bars for each
 * behavior-based quest and lets the user claim completed rewards as
 * locked store credit.
 */
export function QuestsPanel() {
  const { profileId, isSignedIn } = useUser();
  const cart = useCart() as any;
  const addLockedReward = cart?.addLockedReward;

  const [progress, setProgress] = useState<Record<QuestId, QuestProgress> | null>(null);
  const [claimingId, setClaimingId] = useState<QuestId | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const state = await getQuestProgress(profileId || 'guest', '', isSignedIn);
    setProgress(state);
  }, [isSignedIn, profileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleClaim = useCallback(
    async (questId: QuestId) => {
      if (claimingId) return;
      setClaimingId(questId);
      try {
        const { grantedUsd, note } = await claimQuestReward(
          { profileId: profileId || 'guest', isSignedIn },
          questId
        );
        if (grantedUsd > 0 && addLockedReward) {
          addLockedReward(grantedUsd, 25, note, 72);
          setFlash(note);
          void hapticSuccess();
        }
        await refresh();
        if (grantedUsd > 0) {
          setTimeout(() => setFlash(null), 3000);
        }
      } finally {
        setClaimingId(null);
      }
    },
    [addLockedReward, claimingId, isSignedIn, profileId, refresh]
  );

  if (!progress) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#ffd166" />
      </View>
    );
  }

  const quests = (Object.keys(QUEST_META) as QuestId[]).map((id) => ({
    id,
    meta: QUEST_META[id],
    state: progress[id],
  }));

  const activeCount = quests.filter((q) => !q.state.completedAt).length;
  if (activeCount === 0 && !flash) return null;

  return (
    <LinearGradient colors={['#12231a', '#0d1c15']} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.headerIcon}>
            <Ionicons name="flag" size={15} color="#7ee2a8" />
          </View>
          <View>
            <Text style={styles.kicker}>DAILY QUESTS</Text>
            <Text style={styles.title}>Do more. Earn more.</Text>
          </View>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{activeCount} active</Text>
        </View>
      </View>

      {quests.map(({ id, meta, state }) => {
        const done = Boolean(state.completedAt);
        const claimed = Boolean(state.claimedAt);
        const pct = Math.min(100, Math.round((state.current / Math.max(state.target, 1)) * 100));

        return (
          <View key={id} style={[styles.questRow, done && styles.questRowDone]}>
            <View style={[styles.questIcon, { backgroundColor: `${meta.color}22` }]}>
              <Ionicons name={claimed ? 'checkmark-circle' : done ? 'sparkles' : meta.icon} size={17} color={meta.color} />
            </View>

            <View style={styles.questBody}>
              <Text style={styles.questTitle}>{meta.title}</Text>
              <View style={styles.questProgressHeader}>
                <Text style={styles.questProgressText}>
                  {done
                    ? claimed
                      ? 'Reward claimed'
                      : `Ready — ${formatGameRewardUsd(state.rewardUsd)}`
                    : `${state.current}/${state.target}`}
                </Text>
                <Text style={styles.questReward}>{formatGameRewardUsd(state.rewardUsd)}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: meta.color }]} />
              </View>
            </View>

            {done && !claimed ? (
              <Pressable
                style={({ pressed }) => [styles.claimBtn, pressed && styles.claimBtnPressed]}
                onPress={() => void handleClaim(id)}
                disabled={claimingId === id}
              >
                <Text style={styles.claimBtnText}>{claimingId === id ? '…' : 'Claim'}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      <Text style={styles.footnote}>
        Quest rewards are locked store credit — they unlock with qualifying orders.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 36, alignItems: 'center' },
  card: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(126,226,168,0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(126,226,168,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { color: '#7ee2a8', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 1 },
  countPill: {
    backgroundColor: 'rgba(126,226,168,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countPillText: { color: '#7ee2a8', fontSize: 11, fontWeight: '800' },

  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  questRowDone: {
    backgroundColor: 'rgba(126,226,168,0.08)',
  },
  questIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  questBody: { flex: 1 },
  questTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  questProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  questProgressText: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700' },
  questReward: { color: '#7ee2a8', fontSize: 12, fontWeight: '900' },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: { height: '100%', borderRadius: 2 },

  claimBtn: {
    marginLeft: 10,
    backgroundColor: '#7ee2a8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  claimBtnPressed: { opacity: 0.85 },
  claimBtnText: { color: '#0d1c15', fontSize: 12, fontWeight: '900' },

  footnote: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
});
