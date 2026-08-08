import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * Confetti / sparkle burst rendered behind a game popup.
 * Deterministic pseudo-random particles fly outward from the bottom-center
 * and fade, giving the "you won something" moment.
 */

const PARTICLE_COLORS = ['#ffd166', '#ff6a00', '#ff3b30', '#34c759', '#5c31ff', '#ffb400', '#ffffff'];
const PARTICLE_COUNT = 22;

type ParticleSpec = {
  color: string;
  size: number;
  angle: number;
  distance: number;
  delay: number;
  rotate: number;
};

function makeParticles(seed: number): ParticleSpec[] {
  const particles: ParticleSpec[] = [];
  let s = seed || 7;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    particles.push({
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: 5 + rand() * 7,
      angle: -160 + rand() * 320, // degrees, mostly upward-ish spread
      distance: 90 + rand() * 130,
      delay: i * 18,
      rotate: (rand() - 0.5) * 540,
    });
  }
  return particles;
}

export function GameConfetti({ active }: { active: boolean }) {
  if (!active) return null;
  return <ConfettiParticles key={String(Date.now())} />;
}

function ConfettiParticles() {
  const particles = React.useMemo(() => makeParticles(Math.floor(Math.random() * 100000)), []);

  return (
    <View style={styles.layer} pointerEvents="none">
      {particles.map((p, i) => (
        <Particle key={i} spec={p} />
      ))}
    </View>
  );
}

function Particle({ spec }: { spec: ParticleSpec }) {
  const progress = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Pre-compute the travel offset so it's stable across renders.
  const offset = React.useMemo(() => {
    const rad = (spec.angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * spec.distance,
      y: Math.sin(rad) * spec.distance,
    };
  }, [spec.angle, spec.distance]);

  useEffect(() => {
    opacity.value = withDelay(spec.delay, withSequence(withTiming(1, { duration: 40 }), withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) })));
    progress.value = withDelay(
      spec.delay,
      withSpring(1, { damping: 14, stiffness: 90, mass: 0.8 })
    );
    rotate.value = withDelay(spec.delay, withTiming(spec.rotate, { duration: 800 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * offset.x },
      { translateY: progress.value * offset.y },
      { rotate: `${rotate.value}deg` },
      { scale: 1 - progress.value * 0.35 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
  },
});
