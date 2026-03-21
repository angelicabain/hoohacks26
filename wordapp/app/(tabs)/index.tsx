import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const ring1 = useRef(new Animated.Value(0.6)).current;
  const ring2 = useRef(new Animated.Value(0.4)).current;
  const ring3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse the center button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow oscillation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered expanding rings
    const ringAnimation = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.4,
            duration: 2800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    ringAnimation(ring1, 0);
    ringAnimation(ring2, 900);
    ringAnimation(ring3, 1800);
  }, []);

  const handleLaunch = () => {
    router.push('/camera' as any);
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const ringOpacity1 = ring1.interpolate({
    inputRange: [0.6, 1.4],
    outputRange: [0.35, 0],
  });
  const ringOpacity2 = ring2.interpolate({
    inputRange: [0.4, 1.4],
    outputRange: [0.25, 0],
  });
  const ringOpacity3 = ring3.interpolate({
    inputRange: [0.2, 1.4],
    outputRange: [0.15, 0],
  });

  return (
    <View style={styles.container}>
      {/* Dark atmospheric background */}
      <View style={styles.bgGradient} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <Text style={styles.logoText}>LANG</Text>
          <Text style={styles.logoAccent}>LENS</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineDash} />
            <Text style={styles.tagline}>SEE THE WORLD, LEARN THE LANGUAGE</Text>
            <View style={styles.taglineDash} />
          </View>
        </Animated.View>

        {/* Center launch button */}
        <Animated.View
          style={[
            styles.buttonZone,
            { opacity: fadeIn },
          ]}
        >
          {/* Pulsing rings */}
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ scale: ring1 }],
                opacity: ringOpacity1,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ringLarge,
              {
                transform: [{ scale: ring2 }],
                opacity: ringOpacity2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ringXL,
              {
                transform: [{ scale: ring3 }],
                opacity: ringOpacity3,
              },
            ]}
          />

          {/* Glow layer */}
          <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

          {/* Main button */}
          <TouchableOpacity
            onPress={handleLaunch}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            <Animated.View
              style={[
                styles.button,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {/* Inner circle detail */}
              <View style={styles.buttonInner}>
                <Text style={styles.buttonIcon}>镜</Text>
                <Text style={styles.buttonLabel}>TAP TO START</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom info */}
        <Animated.View
          style={[
            styles.footer,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <View style={styles.featureRow}>
            <FeaturePill icon="👁" label="Detect" />
            <FeaturePill icon="文" label="Translate" />
            <FeaturePill icon="🔊" label="Pronounce" />
          </View>
          <Text style={styles.footerNote}>
            Point your camera at any object to learn it in Chinese
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function FeaturePill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const BUTTON_SIZE = 180;
const RING_SIZE = BUTTON_SIZE + 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060810',
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#060810',
  },
  bgCircle1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#0a1628',
    top: -width * 0.3,
    left: -width * 0.1,
  },
  bgCircle2: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: '#08111f',
    bottom: -width * 0.2,
    right: -width * 0.2,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 14,
    lineHeight: 56,
  },
  logoAccent: {
    fontSize: 52,
    fontWeight: '800',
    color: '#4DAAFF',
    letterSpacing: 14,
    lineHeight: 56,
    textShadowColor: 'rgba(77, 170, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  taglineDash: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tagline: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 3,
    fontWeight: '600',
  },

  // Button zone
  buttonZone: {
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE + 120,
    height: RING_SIZE + 120,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: '#4DAAFF',
  },
  ringLarge: {
    width: RING_SIZE + 50,
    height: RING_SIZE + 50,
    borderRadius: (RING_SIZE + 50) / 2,
  },
  ringXL: {
    width: RING_SIZE + 100,
    height: RING_SIZE + 100,
    borderRadius: (RING_SIZE + 100) / 2,
  },
  glow: {
    position: 'absolute',
    width: BUTTON_SIZE + 60,
    height: BUTTON_SIZE + 60,
    borderRadius: (BUTTON_SIZE + 60) / 2,
    backgroundColor: 'rgba(77, 170, 255, 0.15)',
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#0d1f3c',
    borderWidth: 2,
    borderColor: '#4DAAFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4DAAFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonIcon: {
    fontSize: 52,
    color: '#4DAAFF',
    textShadowColor: 'rgba(77, 170, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  buttonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 3,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 30,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
  },
  footerNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
