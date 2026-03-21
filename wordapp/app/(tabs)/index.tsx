import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '@/constants/theme';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'es', locale: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', locale: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { code: 'pt', locale: 'pt-BR', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'zh', locale: 'zh-CN', label: 'Mandarin', flag: '🇨🇳' },
  { code: 'ja', locale: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', locale: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
];

export default function HomeScreen() {
  const router = useRouter();
  const styles = createStyles();
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

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
  // Animation refs are intentionally stable for a single mount lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLaunch = () => {
    router.push({
      pathname: '/camera' as any,
      params: {
        langCode: selectedLang.code,
        langLocale: selectedLang.locale,
        langLabel: selectedLang.label,
      },
    });
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
      {/* Soft layered background */}
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
          <Text style={styles.logoText}>Fluency</Text>
          <Text style={styles.logoAccent}>learn by looking</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineDash} />
            <Text style={styles.tagline}>Translate the world around you,{"\n"}one object at a time.</Text>
            <View style={styles.taglineDash} />
          </View>
        </Animated.View>

        {/* Language selector */}
        <Animated.View style={[styles.langSection, { opacity: fadeIn }]}>
          <Text style={styles.langSectionLabel}>Choose your language</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langScroll}
          >
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langPill,
                  selectedLang.code === lang.code && styles.langPillSelected,
                ]}
                onPress={() => setSelectedLang(lang)}
                activeOpacity={0.7}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.langLabel,
                    selectedLang.code === lang.code && styles.langLabelSelected,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
                <Text style={styles.buttonLabel}>Start Learning</Text>
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

const BUTTON_SIZE = 180;
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
  bgCircle1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#FFF2E8',
    top: -width * 0.3,
    left: -width * 0.1,
  },
  bgCircle2: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: '#FFF8F2',
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
    fontSize: 56,
    color: '#241A12',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.2,
    lineHeight: 62,
  },
  logoAccent: {
    fontSize: 18,
    color: '#3A8F8A',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.4,
    lineHeight: 26,
    textShadowColor: 'rgba(58, 143, 138, 0.12)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    paddingHorizontal: 28,
  },
  taglineDash: {
    width: 14,
    height: 1,
    backgroundColor: 'rgba(58,143,138,0.26)',
  },
  tagline: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(62,48,36,0.75)',
    letterSpacing: 0.2,
    lineHeight: 20,
    fontFamily: Fonts.rounded,
  },

  // Language selector
  langSection: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  langSectionLabel: {
    fontSize: 13,
    color: 'rgba(62,48,36,0.6)',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.3,
  },
  langScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(58,143,138,0.2)',
    backgroundColor: '#FFFFFF',
  },
  langPillSelected: {
    backgroundColor: 'rgba(58,143,138,0.1)',
    borderColor: '#3A8F8A',
  },
  langFlag: {
    fontSize: 18,
  },
  langLabel: {
    fontSize: 13,
    color: 'rgba(62,48,36,0.7)',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.2,
  },
  langLabelSelected: {
    color: '#3A8F8A',
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
    borderWidth: 1,
    borderColor: 'rgba(58,143,138,0.24)',
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
    backgroundColor: 'rgba(58,143,138,0.09)',
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
    borderColor: 'rgba(58,143,138,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A8F8A',
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
    fontSize: 14,
    color: 'rgba(62,48,36,0.78)',
    letterSpacing: 0.3,
    fontFamily: Fonts.rounded,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 30,
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
    fontFamily: Fonts.rounded,
  },
  footerNote: {
    fontSize: 13,
    color: 'rgba(62,48,36,0.62)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Fonts.sans,
  },
});
