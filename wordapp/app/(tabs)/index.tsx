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
import { Fonts } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const styles = createStyles();

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const ring1 = useRef(new Animated.Value(0.6)).current;
  const ring2 = useRef(new Animated.Value(0.4)).current;
  const ring3 = useRef(new Animated.Value(0.2)).current;
  const bubbleX1 = useRef(new Animated.Value(width * 0.08)).current;
  const bubbleY1 = useRef(new Animated.Value(height * 0.12)).current;
  const bubbleX2 = useRef(new Animated.Value(width * 0.76)).current;
  const bubbleY2 = useRef(new Animated.Value(height * 0.32)).current;
  const bubbleX3 = useRef(new Animated.Value(width * 0.12)).current;
  const bubbleY3 = useRef(new Animated.Value(height * 0.55)).current;
  const bubbleX4 = useRef(new Animated.Value(width * 0.7)).current;
  const bubbleY4 = useRef(new Animated.Value(height * 0.7)).current;
  const bubbleX5 = useRef(new Animated.Value(width * 0.06)).current;
  const bubbleY5 = useRef(new Animated.Value(height * 0.82)).current;
  const bubbleX6 = useRef(new Animated.Value(width * 0.74)).current;
  const bubbleY6 = useRef(new Animated.Value(height * 0.1)).current;
  const bubbleX7 = useRef(new Animated.Value(width * 0.14)).current;
  const bubbleY7 = useRef(new Animated.Value(height * 0.42)).current;
  const bubbleX8 = useRef(new Animated.Value(width * 0.72)).current;
  const bubbleY8 = useRef(new Animated.Value(height * 0.9)).current;

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

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    let cancelled = false;
    const floatBubble = (
      xAnim: Animated.Value,
      yAnim: Animated.Value,
      minDuration: number,
      maxDuration: number,
      delay = 0
    ) => {
      const step = (stepDelay: number) => {
        if (cancelled) {
          return;
        }

        const targetX = randomInRange(width * 0.04, width * 0.82);
        const targetY = randomInRange(height * 0.05, height * 0.9);
        const duration = randomInRange(minDuration, maxDuration);

        Animated.sequence([
          Animated.delay(stepDelay),
          Animated.parallel([
            Animated.timing(xAnim, {
              toValue: targetX,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(yAnim, {
              toValue: targetY,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ]).start(({ finished }) => {
          if (finished && !cancelled) {
            step(0);
          }
        });
      };

      step(delay);
    };

    floatBubble(bubbleX1, bubbleY1, 8200, 11600, 0);
    floatBubble(bubbleX2, bubbleY2, 9000, 12800, 220);
    floatBubble(bubbleX3, bubbleY3, 9600, 13200, 120);
    floatBubble(bubbleX4, bubbleY4, 8800, 12200, 340);
    floatBubble(bubbleX5, bubbleY5, 9800, 13800, 260);
    floatBubble(bubbleX6, bubbleY6, 9200, 12600, 380);
    floatBubble(bubbleX7, bubbleY7, 9400, 13400, 180);
    floatBubble(bubbleX8, bubbleY8, 9000, 13000, 320);

    return () => {
      cancelled = true;
    };
  // Animation refs are intentionally stable for a single mount lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const buildBubbleRandomStyle = (xAnim: Animated.Value, yAnim: Animated.Value) => ({
    opacity: yAnim.interpolate({
      inputRange: [height * 0.05, height * 0.45, height * 0.9],
      outputRange: [0.6, 0.72, 0.58],
    }),
    transform: [
      { translateX: xAnim },
      { translateY: yAnim },
      {
        scale: xAnim.interpolate({
          inputRange: [width * 0.04, width * 0.43, width * 0.82],
          outputRange: [0.98, 1.03, 0.99],
        }),
      },
      {
        rotate: yAnim.interpolate({
          inputRange: [height * 0.05, height * 0.45, height * 0.9],
          outputRange: ['-1deg', '1.2deg', '-0.8deg'],
        }),
      },
    ],
  });

  const bubbleOneAnimatedStyle = buildBubbleRandomStyle(bubbleX1, bubbleY1);
  const bubbleTwoAnimatedStyle = buildBubbleRandomStyle(bubbleX2, bubbleY2);
  const bubbleThreeAnimatedStyle = buildBubbleRandomStyle(bubbleX3, bubbleY3);
  const bubbleFourAnimatedStyle = buildBubbleRandomStyle(bubbleX4, bubbleY4);
  const bubbleFiveAnimatedStyle = buildBubbleRandomStyle(bubbleX5, bubbleY5);
  const bubbleSixAnimatedStyle = buildBubbleRandomStyle(bubbleX6, bubbleY6);
  const bubbleSevenAnimatedStyle = buildBubbleRandomStyle(bubbleX7, bubbleY7);
  const bubbleEightAnimatedStyle = buildBubbleRandomStyle(bubbleX8, bubbleY8);

  function FeaturePill({ icon, label }: { icon: string; label: string }) {
    return (
      <View style={styles.pill}>
        <Text style={styles.pillIcon}>{icon}</Text>
        <Text style={styles.pillLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Minimal bubble background */}
      <View style={styles.bgGradient} />
      <Animated.View style={[styles.bubble, styles.bubbleA, bubbleOneAnimatedStyle]} />
      <Animated.View style={[styles.bubble, styles.bubbleB, bubbleTwoAnimatedStyle]} />
      <Animated.View style={[styles.bubble, styles.bubbleC, bubbleThreeAnimatedStyle]} />
      <Animated.View style={[styles.bubble, styles.bubbleD, bubbleFourAnimatedStyle]} />
      <Animated.View style={[styles.bubble, styles.bubbleE, bubbleFiveAnimatedStyle]} />
      <Animated.View style={[styles.bubble, styles.bubbleF, bubbleSixAnimatedStyle]} />
      <Animated.View style={[styles.bubble, styles.bubbleG, bubbleSevenAnimatedStyle]} />
      <Animated.View style={[styles.bubble, styles.bubbleH, bubbleEightAnimatedStyle]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <Text style={styles.logoText}>Fluency</Text>
          <Text style={styles.logoAccent}>Translate the world around you.</Text>
        </Animated.View>

        {/* Middle launch button */}
        <View style={styles.middleSection}>
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
                  <Text style={styles.buttonLabel}>Tap to start</Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bottom info */}
        <Animated.View
          style={[
            styles.footer,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <View style={styles.featureRow}>
            <FeaturePill icon="👁" label="Detect" />
            <FeaturePill icon="📝" label="Translate" />
            <FeaturePill icon="🔊" label="Speak" />
          </View>
          <Text style={styles.footerNote}>
            Point your camera at any object to build everyday fluency
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const BUTTON_SIZE = 210;
const RING_SIZE = BUTTON_SIZE + 40;

const createStyles = () =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(217,119,43,0.06)',
    borderWidth: 1.2,
    borderColor: 'rgba(217,119,43,0.26)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  bubbleA: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  bubbleB: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  bubbleC: {
    width: 132,
    height: 132,
    borderRadius: 66,
  },
  bubbleD: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  bubbleE: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  bubbleF: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  bubbleG: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  bubbleH: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
    paddingBottom: 28,
  },

  middleSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: 6,
  },
  logoText: {
    fontSize: 56,
    color: '#873429',
    fontFamily: Fonts.serif,
    letterSpacing: 0.2,
    lineHeight: 62,
  },
  logoAccent: {
    fontSize: 18,
    color: '#000000',
    fontFamily: Fonts.sans,
    letterSpacing: 0.4,
    lineHeight: 26,
    marginTop: 14,
    textShadowColor: 'rgba(217, 119, 43, 0.14)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
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
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.24)',
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
    backgroundColor: 'rgba(217,119,43,0.08)',
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D9772B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  buttonLabel: {
    fontSize: 16,
    color: 'rgba(62,48,36,0.78)',
    letterSpacing: 0.4,
    fontFamily: Fonts.sans,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 30,
    paddingBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 6,
  },
  pillIcon: {
    fontSize: 15,
    opacity: 0.75,
  },
  pillLabel: {
    fontSize: 13,
    color: 'rgba(62,48,36,0.68)',
    letterSpacing: 0.2,
    fontFamily: Fonts.sans,
  },
  footerNote: {
    fontSize: 13,
    color: 'rgba(62,48,36,0.62)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Fonts.sans,
  },
});
