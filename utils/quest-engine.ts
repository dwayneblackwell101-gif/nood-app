import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveCustomerStorageKey } from './customer-storage';

/**
 * Quests engine — rewards high-value in-app behaviors (browsing categories,
 * submitting photo reviews, sharing) with LOCKED store credit.
 *
 * Everything stays within the locked-reward mechanic: rewards require
 * qualifying spend to unlock, so the effective discount is capped and no
 * cash ever leaves the store. This is the anti-Temu design: transparent,
 * predictable progress instead of deceptive exponential slowdowns.
 */

export type QuestId = 'browse-3-categories' | 'review-1-photo' | 'share-1-product';

export type QuestProgress = {
  questId: QuestId;
  current: number;
  target: number;
  rewardUsd: number;
  rewardNote: string;
  completedAt: string | null;
  claimedAt: string | null;
};

const QUESTS_KEY = 'NOOD_QUESTS_V1';

const QUEST_DEFS: Record<QuestId, { target: number; rewardUsd: number; rewardNote: string }> = {
  'browse-3-categories': {
    target: 3,
    rewardUsd: 0.25,
    rewardNote: 'Browse Quest — view 3 categories',
  },
  'review-1-photo': {
    target: 1,
    rewardUsd: 0.5,
    rewardNote: 'Review reward — photo review submitted',
  },
  'share-1-product': {
    target: 1,
    rewardUsd: 0.25,
    rewardNote: 'Share reward — product shared',
  },
};

function makeKey(profileId: string, email: string, isSignedIn: boolean): string {
  return `${QUESTS_KEY}:${resolveCustomerStorageKey(profileId, email, isSignedIn)}`;
}

function emptyProgress(): Record<QuestId, QuestProgress> {
  return {
    'browse-3-categories': {
      questId: 'browse-3-categories',
      current: 0,
      target: QUEST_DEFS['browse-3-categories'].target,
      rewardUsd: QUEST_DEFS['browse-3-categories'].rewardUsd,
      rewardNote: QUEST_DEFS['browse-3-categories'].rewardNote,
      completedAt: null,
      claimedAt: null,
    },
    'review-1-photo': {
      questId: 'review-1-photo',
      current: 0,
      target: QUEST_DEFS['review-1-photo'].target,
      rewardUsd: QUEST_DEFS['review-1-photo'].rewardUsd,
      rewardNote: QUEST_DEFS['review-1-photo'].rewardNote,
      completedAt: null,
      claimedAt: null,
    },
    'share-1-product': {
      questId: 'share-1-product',
      current: 0,
      target: QUEST_DEFS['share-1-product'].target,
      rewardUsd: QUEST_DEFS['share-1-product'].rewardUsd,
      rewardNote: QUEST_DEFS['share-1-product'].rewardNote,
      completedAt: null,
      claimedAt: null,
    },
  };
}

export async function getQuestProgress(
  profileId: string,
  email = '',
  isSignedIn = false
): Promise<Record<QuestId, QuestProgress>> {
  const key = makeKey(profileId, email, isSignedIn);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    const base = emptyProgress();
    for (const id of Object.keys(base) as QuestId[]) {
      if (parsed?.[id] && typeof parsed[id]?.current === 'number') {
        base[id] = { ...base[id], ...parsed[id] };
      }
    }
    return base;
  } catch {
    return emptyProgress();
  }
}

async function saveProgress(
  profileId: string,
  email: string,
  isSignedIn: boolean,
  progress: Record<QuestId, QuestProgress>
): Promise<void> {
  try {
    await AsyncStorage.setItem(makeKey(profileId, email, isSignedIn), JSON.stringify(progress));
  } catch {
    // non-fatal
  }
}

/**
 * Record quest progress (deduplicates by a per-quest marker stored alongside).
 * Returns the updated progress for the quest.
 */
export async function recordQuestProgress(
  scope: { profileId: string; email?: string; isSignedIn?: boolean },
  questId: QuestId,
  marker: string,
  step = 1
): Promise<QuestProgress> {
  const { profileId, email = '', isSignedIn = false } = scope;
  const progress = await getQuestProgress(profileId, email, isSignedIn);

  const quest = progress[questId];
  if (quest.completedAt) return quest; // already done this cycle

  const markerKey = `marker:${questId}:${marker}`;
  const seen = await AsyncStorage.getItem(markerKey).catch(() => null);
  if (seen === '1') return quest;

  const nextCurrent = Math.min(quest.target, quest.current + step);
  const next: QuestProgress = {
    ...quest,
    current: nextCurrent,
    completedAt: nextCurrent >= quest.target ? new Date().toISOString() : quest.completedAt,
  };

  progress[questId] = next;
  await saveProgress(profileId, email, isSignedIn, progress);
  await AsyncStorage.setItem(markerKey, '1').catch(() => {});

  return next;
}

/**
 * Claim a completed quest's reward. Returns the granted locked-reward amount
 * (0 if not claimable). The caller grants the locked reward.
 */
export async function claimQuestReward(
  scope: { profileId: string; email?: string; isSignedIn?: boolean },
  questId: QuestId
): Promise<{ grantedUsd: number; note: string }> {
  const { profileId, email = '', isSignedIn = false } = scope;
  const progress = await getQuestProgress(profileId, email, isSignedIn);
  const quest = progress[questId];

  if (!quest.completedAt || quest.claimedAt) {
    return { grantedUsd: 0, note: quest.rewardNote };
  }

  progress[questId] = { ...quest, claimedAt: new Date().toISOString() };
  await saveProgress(profileId, email, isSignedIn, progress);

  return { grantedUsd: quest.rewardUsd, note: quest.rewardNote };
}

/** Reset all quests (e.g. after a full cycle or for testing). */
export async function resetAllQuests(
  scope: { profileId: string; email?: string; isSignedIn?: boolean }
): Promise<void> {
  const { profileId, email = '', isSignedIn = false } = scope;
  await AsyncStorage.removeItem(makeKey(profileId, email, isSignedIn)).catch(() => {});
}
