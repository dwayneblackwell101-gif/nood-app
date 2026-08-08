import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveCustomerStorageKey } from './customer-storage';
import { StyleDNAProfile, STYLE_DNA_DEFAULTS } from './style-dna';

const STYLE_DNA_KEY = 'NOOD_STYLE_DNA_V1';

export function getStyleDNAKey(
  profileId: string,
  email = '',
  isSignedIn = false
): string {
  return `${STYLE_DNA_KEY}:${resolveCustomerStorageKey(profileId, email, isSignedIn)}`;
}

export async function getStyleDNA(
  profileId: string,
  email = '',
  isSignedIn = false
): Promise<StyleDNAProfile> {
  try {
    const key = getStyleDNAKey(profileId, email, isSignedIn);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { ...STYLE_DNA_DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...STYLE_DNA_DEFAULTS, ...parsed };
  } catch {
    return { ...STYLE_DNA_DEFAULTS };
  }
}

export async function saveStyleDNA(
  profileId: string,
  email: string,
  isSignedIn: boolean,
  dna: Partial<StyleDNAProfile>
): Promise<StyleDNAProfile> {
  const existing = await getStyleDNA(profileId, email, isSignedIn);
  const updated: StyleDNAProfile = {
    ...existing,
    ...dna,
    updatedAt: new Date().toISOString(),
    version: (existing.version || 0) + 1,
  };
  const key = getStyleDNAKey(profileId, email, isSignedIn);
  await AsyncStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export async function completeStyleDNAOnboarding(
  profileId: string,
  email: string,
  isSignedIn: boolean,
  dna: Partial<StyleDNAProfile>
): Promise<StyleDNAProfile> {
  const completed: StyleDNAProfile = {
    ...STYLE_DNA_DEFAULTS,
    ...dna,
    completedOnboarding: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  const key = getStyleDNAKey(profileId, email, isSignedIn);
  await AsyncStorage.setItem(key, JSON.stringify(completed));
  return completed;
}

export async function resetStyleDNA(
  profileId: string,
  email = '',
  isSignedIn = false
): Promise<void> {
  const key = getStyleDNAKey(profileId, email, isSignedIn);
  await AsyncStorage.removeItem(key);
}

export async function getStyleDNAForPersonalization(
  profileId: string,
  email = '',
  isSignedIn = false
): Promise<StyleDNAProfile> {
  return getStyleDNA(profileId, email, isSignedIn);
}
