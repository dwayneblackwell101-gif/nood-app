import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveCustomerStorageKey } from './customer-storage';
import { getBackendJson, postBackendJson } from './backend';

/**
 * Style Challenges — weekly UGC contests.
 *
 * Each week has a theme (e.g. "Summer Brunch"). Users submit a photo of
 * their look, others vote, and winners earn locked store credit.
 * Locked rewards keep the payout capped (require qualifying spend).
 */

export type StyleChallenge = {
  id: string;
  theme: string;
  subtitle: string;
  emoji: string;
  prizeUsd: number;
  endsAt: string;
  /** Whether submissions are open. */
  active: boolean;
};

export type ChallengeSubmission = {
  id: string;
  challengeId: string;
  userId: string;
  username: string;
  photoUri: string;
  caption: string;
  votes: number;
  createdAt: string;
  /** Users who voted (dedupe). */
  voterIds: string[];
};

const CHALLENGES_KEY = 'NOOD_STYLE_CHALLENGES_V1';
const SUBMISSIONS_KEY = 'NOOD_CHALLENGE_SUBMISSIONS_V1';
const VOTES_KEY = 'NOOD_CHALLENGE_VOTES_V1';
const USER_SUBMISSION_KEY = 'NOOD_CHALLENGE_USER_SUBMISSION_V1';

export const CHALLENGE_PRIZE_USD = 5;
export const CHALLENGE_DURATION_DAYS = 7;

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

/** Default weekly challenge lineup. Extend/rotate as desired. */
export const DEFAULT_CHALLENGES: StyleChallenge[] = [
  {
    id: 'summer-brunch',
    theme: 'Summer Brunch',
    subtitle: 'Show us your brunch fit',
    emoji: '🍹',
    prizeUsd: CHALLENGE_PRIZE_USD,
    endsAt: isoDaysFromNow(CHALLENGE_DURATION_DAYS),
    active: true,
  },
  {
    id: 'street-style',
    theme: 'Street Style',
    subtitle: 'Your best streetwear look',
    emoji: '🛹',
    prizeUsd: CHALLENGE_PRIZE_USD,
    endsAt: isoDaysFromNow(CHALLENGE_DURATION_DAYS * 2),
    active: true,
  },
  {
    id: 'date-night',
    theme: 'Date Night',
    subtitle: 'Dress to impress',
    emoji: '🌹',
    prizeUsd: CHALLENGE_PRIZE_USD,
    endsAt: isoDaysFromNow(CHALLENGE_DURATION_DAYS * 3),
    active: true,
  },
];

export function getChallengeStorageKey(profileId: string, email = '', isSignedIn = false): string {
  return `${CHALLENGES_KEY}:${resolveCustomerStorageKey(profileId, email, isSignedIn)}`;
}

export async function getChallenges(): Promise<StyleChallenge[]> {
  // Try backend (shared across users) first.
  try {
    const data = await getBackendJson<{ success: boolean; challenges: StyleChallenge[] }>(
      '/api/challenges',
      { timeoutMs: 6000 }
    );
    if (data?.success && Array.isArray(data.challenges) && data.challenges.length) {
      return data.challenges;
    }
  } catch {
    // fall through to local
  }

  // Local fallback.
  try {
    const raw = await AsyncStorage.getItem(CHALLENGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_CHALLENGES;
}

export async function getSubmissions(challengeId: string): Promise<ChallengeSubmission[]> {
  // Try backend (shared across users) first.
  try {
    const data = await getBackendJson<{ success: boolean; submissions: ChallengeSubmission[] }>(
      `/api/challenges/${encodeURIComponent(challengeId)}/submissions`,
      { timeoutMs: 6000 }
    );
    if (data?.success && Array.isArray(data.submissions)) {
      return data.submissions;
    }
  } catch {
    // fall through to local
  }

  // Local fallback.
  try {
    const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, ChallengeSubmission[]>;
    const list = parsed[challengeId] || [];
    return [...list].sort((a, b) => b.votes - a.votes);
  } catch {
    return [];
  }
}

export async function addSubmission(input: {
  challengeId: string;
  userId: string;
  username: string;
  photoUri: string;
  caption: string;
}): Promise<ChallengeSubmission | null> {
  // Try backend first (shared across users).
  try {
    const data = await postBackendJson<{
      success: boolean;
      message?: string;
      submission?: ChallengeSubmission;
    }>(
      `/api/challenges/${encodeURIComponent(input.challengeId)}/submissions`,
      {
        userId: input.userId,
        username: input.username,
        photoUri: input.photoUri,
        caption: input.caption,
      }
    );
    if (data?.success && data.submission) {
      return data.submission;
    }
    if (data?.message === 'already_submitted') {
      return null;
    }
  } catch {
    // fall through to local
  }

  const submission: ChallengeSubmission = {
    id: `${input.userId}:${input.challengeId}`,
    challengeId: input.challengeId,
    userId: input.userId,
    username: input.username,
    photoUri: input.photoUri,
    caption: input.caption,
    votes: 0,
    voterIds: [],
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, ChallengeSubmission[]>) : {};
    const list = parsed[input.challengeId] || [];
    const existing = list.find((s) => s.userId === input.userId);
    if (existing) return existing; // already submitted this challenge

    parsed[input.challengeId] = [...list, submission];
    await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(parsed));
    return submission;
  } catch {
    return null;
  }
}

export async function voteOnSubmission(
  challengeId: string,
  submissionId: string,
  userId: string
): Promise<ChallengeSubmission | null> {
  // Try backend first.
  try {
    const data = await postBackendJson<{ success: boolean; voted: boolean; votes: number }>(
      `/api/challenges/${encodeURIComponent(challengeId)}/submissions/${encodeURIComponent(submissionId)}/vote`,
      { userId }
    );
    if (data?.success && data.voted) {
      // Fetch updated submission from backend to return full object.
      const subs = await getSubmissions(challengeId);
      return subs.find((s) => s.id === submissionId) || null;
    }
    if ((data as any)?.message === 'already_voted') return null;
  } catch {
    // fall through to local
  }

  try {
    const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, ChallengeSubmission[]>;
    const list = parsed[challengeId] || [];
    const index = list.findIndex((s) => s.id === submissionId);
    if (index === -1) return null;
    if (list[index].voterIds.includes(userId)) return list[index]; // already voted

    list[index].voterIds.push(userId);
    list[index].votes += 1;
    parsed[challengeId] = list;
    await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(parsed));
    return list[index];
  } catch {
    return null;
  }
}

export async function hasUserSubmitted(
  challengeId: string,
  userId: string
): Promise<boolean> {
  try {
    const submissions = await getSubmissions(challengeId);
    return submissions.some((s) => s.userId === userId);
  } catch {
    return false;
  }
}

export async function hasUserVoted(
  challengeId: string,
  submissionId: string,
  userId: string
): Promise<boolean> {
  try {
    const submissions = await getSubmissions(challengeId);
    const submission = submissions.find((s) => s.id === submissionId);
    return Boolean(submission?.voterIds.includes(userId));
  } catch {
    return false;
  }
}
