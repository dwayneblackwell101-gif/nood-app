import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { useHistoryEvents } from '../context/HistoryContext';
import {
  getChallenges,
  getSubmissions,
  addSubmission,
  voteOnSubmission,
  hasUserSubmitted,
  hasUserVoted,
  type StyleChallenge,
  type ChallengeSubmission,
} from '../utils/style-challenges';
import { hapticSuccess, hapticTap } from '../utils/haptics';

/**
 * Style Challenges — weekly UGC contests.
 * Submit your look, vote on others, winners earn locked store credit.
 */
export default function StyleChallengesScreen() {
  const router = useRouter();
  const { profileId, isSignedIn, displayName } = useUser();
  const cart = useCart() as any;
  const addLockedReward = cart?.addLockedReward;
  const { addHistoryEvent } = useHistoryEvents();

  const [challenges, setChallenges] = useState<StyleChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<StyleChallenge | null>(null);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Submission form state
  const [showSubmit, setShowSubmit] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userId = isSignedIn && profileId ? profileId : 'guest';

  const loadChallenges = useCallback(async () => {
    const list = await getChallenges();
    setChallenges(list);
    setSelectedChallenge((prev) => prev || list[0] || null);
    setLoading(false);
  }, []);

  const loadSubmissions = useCallback(async (challengeId: string) => {
    const list = await getSubmissions(challengeId);
    setSubmissions(list);
  }, []);

  useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  useEffect(() => {
    if (selectedChallenge) {
      void loadSubmissions(selectedChallenge.id);
    }
  }, [selectedChallenge, loadSubmissions]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submitLook = async () => {
    if (!selectedChallenge || !photoUri) return;
    setSubmitting(true);
    try {
      const submission = await addSubmission({
        challengeId: selectedChallenge.id,
        userId,
        username: displayName || 'nood_user',
        photoUri,
        caption: caption.trim() || selectedChallenge.theme,
      });
      if (submission) {
        await loadSubmissions(selectedChallenge.id);
        void hapticSuccess();
        await addHistoryEvent({
          type: 'reward',
          title: 'Challenge submitted',
          description: `Entered "${selectedChallenge.theme}" style challenge`,
          status: 'completed',
          relatedId: selectedChallenge.id,
        });
      }
      setShowSubmit(false);
      setPhotoUri(null);
      setCaption('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (submission: ChallengeSubmission) => {
    if (!selectedChallenge) return;
    const alreadyVoted = await hasUserVoted(selectedChallenge.id, submission.id, userId);
    if (alreadyVoted) return;

    const updated = await voteOnSubmission(selectedChallenge.id, submission.id, userId);
    if (updated) {
      void hapticTap();
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)).sort((a, b) => b.votes - a.votes)
      );
    }
  };

  const handleSelectChallenge = (challenge: StyleChallenge) => {
    setSelectedChallenge(challenge);
    void hapticTap();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a00" />
        <Text style={styles.loadingText}>Loading challenges…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Style Challenges</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Challenge chips */}
      <FlatList
        data={challenges}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              selectedChallenge?.id === item.id && styles.chipActive,
            ]}
            activeOpacity={0.85}
            onPress={() => handleSelectChallenge(item)}
          >
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
            <View>
              <Text style={[styles.chipTitle, selectedChallenge?.id === item.id && styles.chipTitleActive]}>
                {item.theme}
              </Text>
              <Text style={styles.chipPrize}>${item.prizeUsd} prize</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Active challenge banner */}
      {selectedChallenge ? (
        <LinearGradient
          colors={['#1a1a2e', '#2a1a3e']}
          style={styles.challengeBanner}
        >
          <Text style={styles.bannerEmoji}>{selectedChallenge.emoji}</Text>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>{selectedChallenge.theme}</Text>
            <Text style={styles.bannerSubtitle}>{selectedChallenge.subtitle}</Text>
            <Text style={styles.bannerPrize}>Win ${selectedChallenge.prizeUsd} store credit</Text>
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.9}
            onPress={() => setShowSubmit(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </LinearGradient>
      ) : null}

      {/* Submissions */}
      <Text style={styles.sectionTitle}>Entries</Text>
      <FlatList
        data={submissions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.submissionsList}
        numColumns={2}
        columnWrapperStyle={styles.submissionsRow}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="images-outline" size={44} color="#ccc" />
            <Text style={styles.emptyText}>No entries yet — be the first!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SubmissionCard submission={item} onVote={() => handleVote(item)} />
        )}
      />

      {/* Submit modal */}
      {showSubmit ? (
        <View style={styles.submitOverlay}>
          <Pressable style={styles.submitBackdrop} onPress={() => setShowSubmit(false)} />
          <View style={styles.submitSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.submitTitle}>Submit your look</Text>

            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.submitPhoto} />
            ) : (
              <TouchableOpacity style={styles.photoPicker} onPress={() => void pickPhoto()}>
                <Ionicons name="camera-outline" size={32} color="#ff6a00" />
                <Text style={styles.photoPickerText}>Add a photo</Text>
              </TouchableOpacity>
            )}

            {photoUri ? (
              <TouchableOpacity style={styles.changePhoto} onPress={() => setPhotoUri(null)}>
                <Text style={styles.changePhotoText}>Change photo</Text>
              </TouchableOpacity>
            ) : null}

            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption…"
              placeholderTextColor="#999"
              maxLength={120}
            />

            <TouchableOpacity
              style={[styles.doneButton, (!photoUri || submitting) && styles.doneButtonDisabled]}
              onPress={() => void submitLook()}
              disabled={!photoUri || submitting}
              activeOpacity={0.9}
            >
              <Text style={styles.doneButtonText}>
                {submitting ? 'Submitting…' : 'Submit entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function SubmissionCard({
  submission,
  onVote,
}: {
  submission: ChallengeSubmission;
  onVote: () => void;
}) {
  return (
    <View style={styles.submissionCard}>
      <Image source={{ uri: submission.photoUri }} style={styles.submissionImage} />
      <View style={styles.submissionInfo}>
        <Text style={styles.submissionUsername} numberOfLines={1}>
          @{submission.username}
        </Text>
        <Text style={styles.submissionCaption} numberOfLines={2}>
          {submission.caption}
        </Text>
      </View>
      <TouchableOpacity style={styles.voteButton} activeOpacity={0.85} onPress={onVote}>
        <Ionicons name="heart" size={16} color="#fff" />
        <Text style={styles.voteCount}>{submission.votes}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf7f2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fbf7f2' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 15, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  headerSpacer: { width: 40 },

  chipsRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f0e2d3',
  },
  chipActive: { borderColor: '#ff6a00', backgroundColor: '#fff0e0' },
  chipEmoji: { fontSize: 22 },
  chipTitle: { fontSize: 13, fontWeight: '800', color: '#333' },
  chipTitleActive: { color: '#ff6a00' },
  chipPrize: { fontSize: 11, color: '#999', fontWeight: '600' },

  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  bannerEmoji: { fontSize: 34 },
  bannerCopy: { flex: 1 },
  bannerTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  bannerPrize: { color: '#ffd166', fontSize: 12, fontWeight: '800', marginTop: 4 },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff6a00',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submitButtonText: { color: '#fff', fontSize: 13, fontWeight: '900' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  submissionsList: { paddingHorizontal: 16, paddingBottom: 30 },
  submissionsRow: { justifyContent: 'space-between' },
  emptyWrap: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { marginTop: 12, color: '#999', fontSize: 14, fontWeight: '600' },

  submissionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e2d3',
  },
  submissionImage: { width: '100%', height: 180 },
  submissionInfo: { padding: 10 },
  submissionUsername: { fontSize: 13, fontWeight: '800', color: '#333' },
  submissionCaption: { fontSize: 12, color: '#777', marginTop: 2, lineHeight: 16 },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ff6a00',
    paddingVertical: 10,
  },
  voteCount: { color: '#fff', fontSize: 13, fontWeight: '900' },

  submitOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  submitBackdrop: { ...StyleSheet.absoluteFillObject },
  submitSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  submitTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 14 },
  submitPhoto: { width: '100%', height: 220, borderRadius: 14, marginBottom: 10 },
  photoPicker: {
    height: 160,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  photoPickerText: { color: '#ff6a00', fontSize: 14, fontWeight: '700' },
  changePhoto: { alignSelf: 'flex-start', marginBottom: 10 },
  changePhotoText: { color: '#ff6a00', fontSize: 13, fontWeight: '700' },
  captionInput: {
    backgroundColor: '#f5f0eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
    marginBottom: 14,
  },
  doneButton: {
    backgroundColor: '#ff6a00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonDisabled: { opacity: 0.5 },
  doneButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
