import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { completeStyleDNAOnboarding } from '../../utils/style-dna-storage';
import {
  ONBOARDING_STEPS,
  STYLE_OPTIONS,
  computePrimaryVibe,
  computeColorPalette,
  computePriceSensitivity,
  computeTrendAdoption,
} from '../../utils/style-dna';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const CARD_HEIGHT = 150;

/**
 * Style DNA onboarding — OPT-IN only.
 * Accessed from Settings → Personalization → Style DNA.
 * Never forced at startup.
 */
export default function StyleDNAOnboardingScreen() {
  const router = useRouter();
  const { profileId, isSignedIn } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const stepOptions = STYLE_OPTIONS[step.id as keyof typeof STYLE_OPTIONS] || [];
  const selected = selections[step.id] || [];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const canProceed = selected.length > 0;

  const toggleSelection = (optionId: string) => {
    setSelections(prev => {
      const current = prev[step.id] || [];
      const next = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      return { ...prev, [step.id]: next };
    });
  };

  const handleNext = async () => {
    if (!canProceed) return;

    if (isLastStep) {
      await save();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const save = async () => {
    if (!profileId) return;
    setSaving(true);

    try {
      const vibes = selections.vibes || [];
      const colors = selections.colors || [];
      const brands = selections.brands || [];

      await completeStyleDNAOnboarding(profileId, '', isSignedIn, {
        colors,
        silhouettes: selections.silhouettes || [],
        vibes,
        brands,
        categories: selections.categories || [],
        occasions: selections.occasions || [],
        primaryVibe: computePrimaryVibe(vibes),
        colorPalette: computeColorPalette(colors),
        priceSensitivity: computePriceSensitivity(brands),
        trendAdoption: computeTrendAdoption(vibes, brands),
      });

      router.back();
    } catch (error) {
      console.error('Style DNA save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const progress = (currentStep + 1) / ONBOARDING_STEPS.length;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.background} />

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {ONBOARDING_STEPS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.stepNumber}>Step {currentStep + 1}</Text>
          <Text style={styles.title}>{step.label}</Text>
          <Text style={styles.subtitle}>{step.question}</Text>
        </View>

        <View style={styles.grid}>
          {stepOptions.map(option => {
            const isSelected = selected.includes(option.id);
            return (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => toggleSelection(option.id)}
              >
                {option.color ? (
                  <View style={[styles.colorSwatch, { backgroundColor: option.color }]} />
                ) : null}
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  {option.desc ? (
                    <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                      {option.desc}
                    </Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={24} color="#ff6a00" style={styles.checkmark} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.navButton, currentStep > 0 ? styles.navButtonEnabled : styles.navButtonDisabled]}
          onPress={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentStep > 0 ? '#fff' : '#666'} />
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButtonPrimary,
            canProceed ? styles.navButtonPrimaryEnabled : styles.navButtonPrimaryDisabled,
          ]}
          onPress={() => void handleNext()}
          disabled={!canProceed || saving}
        >
          {saving ? (
            <ActivityIndicator size={20} color="#fff" />
          ) : (
            <>
              <Text style={styles.navButtonTextPrimary}>{isLastStep ? 'Done' : 'Next'}</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6a00',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  stepNumber: {
    color: '#ff6a00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardSelected: {
    backgroundColor: 'rgba(255,106,0,0.15)',
    borderColor: '#ff6a00',
    borderWidth: 3,
  },
  cardPressed: { opacity: 0.9 },
  colorSwatch: {
    width: '100%',
    height: 60,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  optionContent: { padding: 12, flex: 1 },
  optionLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
  optionLabelSelected: { color: '#ff6a00' },
  optionDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  optionDescSelected: { color: 'rgba(255,106,0,0.8)' },
  checkmark: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
    backgroundColor: 'rgba(15,20,40,0.9)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  navButtonEnabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  navButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  navButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  navButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  navButtonPrimaryEnabled: {
    backgroundColor: '#ff6a00',
    shadowColor: '#ff6a00',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  navButtonPrimaryDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  navButtonTextPrimary: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
