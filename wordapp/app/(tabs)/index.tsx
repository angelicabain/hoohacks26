import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const ring1 = useRef(new Animated.Value(0.6)).current;
  const ring2 = useRef(new Animated.Value(0.4)).current;
  const ring3 = useRef(new Animated.Value(0.2)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;

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
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    const ringAnimation = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.4, duration: 2800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    ringAnimation(ring1, 0);
    ringAnimation(ring2, 900);
    ringAnimation(ring3, 1800);

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    let cancelled = false;
    const floatBubble = (xAnim: Animated.Value, yAnim: Animated.Value, minDuration: number, maxDuration: number, delay = 0) => {
      const step = (stepDelay: number) => {
        if (cancelled) return;
        const targetX = randomInRange(width * 0.04, width * 0.82);
        const targetY = randomInRange(height * 0.05, height * 0.9);
        const duration = randomInRange(minDuration, maxDuration);
        Animated.sequence([
          Animated.delay(stepDelay),
          Animated.parallel([
            Animated.timing(xAnim, { toValue: targetX, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(yAnim, { toValue: targetY, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        ]).start(({ finished }) => { if (finished && !cancelled) step(0); });
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

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDropdown = () => {
    setDropdownOpen(true);
    Animated.spring(dropdownAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(() => setDropdownOpen(false));
  };

  const selectLanguage = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    closeDropdown();
  };

  const handleLaunch = () => {
    router.push({
      pathname: '/camera' as any,
      params: { langCode: selectedLang.code, langLocale: selectedLang.locale, langLabel: selectedLang.label },
    });
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const ringOpacity1 = ring1.interpolate({ inputRange: [0.6, 1.4], outputRange: [0.35, 0] });
  const ringOpacity2 = ring2.interpolate({ inputRange: [0.4, 1.4], outputRange: [0.25, 0] });
  const ringOpacity3 = ring3.interpolate({ inputRange: [0.2, 1.4], outputRange: [0.15, 0] });
  const dropdownScale = dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const dropdownOpacity = dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const buildBubbleStyle = (xAnim: Animated.Value, yAnim: Animated.Value) => ({
    opacity: yAnim.interpolate({ inputRange: [height * 0.05, height * 0.45, height * 0.9], outputRange: [0.6, 0.72, 0.58] }),
    transform: [
      { translateX: xAnim },
      { translateY: yAnim },
      { scale: xAnim.interpolate({ inputRange: [width * 0.04, width * 0.43, width * 0.82], outputRange: [0.98, 1.03, 0.99] }) },
      { rotate: yAnim.interpolate({ inputRange: [height * 0.05, height * 0.45, height * 0.9], outputRange: ['-1deg', '1.2deg', '-0.8deg'] }) },
    ],
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
      <View style={styles.bgGradient} />
      <Animated.View style={[styles.bubble, styles.bubbleA, buildBubbleStyle(bubbleX1, bubbleY1)]} />
      <Animated.View style={[styles.bubble, styles.bubbleB, buildBubbleStyle(bubbleX2, bubbleY2)]} />
      <Animated.View style={[styles.bubble, styles.bubbleC, buildBubbleStyle(bubbleX3, bubbleY3)]} />
      <Animated.View style={[styles.bubble, styles.bubbleD, buildBubbleStyle(bubbleX4, bubbleY4)]} />
      <Animated.View style={[styles.bubble, styles.bubbleE, buildBubbleStyle(bubbleX5, bubbleY5)]} />
      <Animated.View style={[styles.bubble, styles.bubbleF, buildBubbleStyle(bubbleX6, bubbleY6)]} />
      <Animated.View style={[styles.bubble, styles.bubbleG, buildBubbleStyle(bubbleX7, bubbleY7)]} />
      <Animated.View style={[styles.bubble, styles.bubbleH, buildBubbleStyle(bubbleX8, bubbleY8)]} />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <Text style={styles.logoText}>Fluency</Text>
          <Text style={styles.logoAccent}>Translate the world around you.</Text>
        </Animated.View>

        {/* Single pill language selector */}
        <Animated.View style={[styles.langSection, { opacity: fadeIn }]}>
          <Text style={styles.langSectionLabel}>Choose your language</Text>
          <TouchableOpacity style={styles.langPill} onPress={openDropdown} activeOpacity={0.75}>
            <Text style={styles.langFlag}>{selectedLang.flag}</Text>
            <Text style={styles.langPillLabel}>{selectedLang.label}</Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Launch button */}
        <View style={styles.middleSection}>
          <Animated.View style={[styles.buttonZone, { opacity: fadeIn }]}>
            <Animated.View style={[styles.ring, { transform: [{ scale: ring1 }], opacity: ringOpacity1 }]} />
            <Animated.View style={[styles.ring, styles.ringLarge, { transform: [{ scale: ring2 }], opacity: ringOpacity2 }]} />
            <Animated.View style={[styles.ring, styles.ringXL, { transform: [{ scale: ring3 }], opacity: ringOpacity3 }]} />
            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
            <TouchableOpacity onPress={handleLaunch} activeOpacity={0.85} style={styles.buttonWrapper}>
              <Animated.View style={[styles.button, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.buttonLabel}>Tap to start</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={styles.featureRow}>
            <FeaturePill icon="👁" label="Detect" />
            <FeaturePill icon="📝" label="Translate" />
            <FeaturePill icon="🔊" label="Speak" />
          </View>
          <Text style={styles.footerNote}>Point your camera at any object to build everyday fluency</Text>
        </Animated.View>
      </SafeAreaView>

      {/* Dropdown */}
      <Modal visible={dropdownOpen} transparent animationType="none" onRequestClose={closeDropdown}>
        <Pressable style={styles.modalBackdrop} onPress={closeDropdown}>
          <Animated.View style={[styles.dropdown, { opacity: dropdownOpacity, transform: [{ scale: dropdownScale }] }]}>
            {LANGUAGES.map((lang, index) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.dropdownItem,
                  selectedLang.code === lang.code && styles.dropdownItemSelected,
                  index === LANGUAGES.length - 1 && styles.dropdownItemLast,
                ]}
                onPress={() => selectLanguage(lang)}
                activeOpacity={0.65}
              >
                <Text style={styles.dropdownFlag}>{lang.flag}</Text>
                <Text style={[styles.dropdownLabel, selectedLang.code === lang.code && styles.dropdownLabelSelected]}>
                  {lang.label}
                </Text>
                {selectedLang.code === lang.code && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const BUTTON_SIZE = 210;
const RING_SIZE = BUTTON_SIZE + 40;

const createStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  bgGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF' },
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
  bubbleA: { width: 110, height: 110, borderRadius: 55 },
  bubbleB: { width: 64, height: 64, borderRadius: 32 },
  bubbleC: { width: 132, height: 132, borderRadius: 66 },
  bubbleD: { width: 46, height: 46, borderRadius: 23 },
  bubbleE: { width: 88, height: 88, borderRadius: 44 },
  bubbleF: { width: 36, height: 36, borderRadius: 18 },
  bubbleG: { width: 72, height: 72, borderRadius: 36 },
  bubbleH: { width: 54, height: 54, borderRadius: 27 },
  safeArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 32, paddingBottom: 28 },
  middleSection: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: 6 },
  logoText: { fontSize: 56, color: '#873429', fontFamily: Fonts.serif, letterSpacing: 0.2, lineHeight: 62 },
  logoAccent: { fontSize: 18, color: '#000000', fontFamily: Fonts.sans, letterSpacing: 0.4, lineHeight: 26, marginTop: 14 },
  langSection: { alignItems: 'center', gap: 12, width: '100%', marginTop: 8 },
  langSectionLabel: { fontSize: 13, color: 'rgba(62,48,36,0.6)', fontFamily: Fonts.sans, letterSpacing: 0.3 },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#D9772B',
    backgroundColor: 'rgba(217,119,43,0.07)',
  },
  langFlag: { fontSize: 20 },
  langPillLabel: { fontSize: 15, color: '#D9772B', fontFamily: Fonts.sans, fontWeight: '600', letterSpacing: 0.2 },
  chevron: { fontSize: 13, color: '#D9772B', marginLeft: 2 },
  buttonZone: { alignItems: 'center', justifyContent: 'center', width: RING_SIZE + 120, height: RING_SIZE + 120 },
  ring: { position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 1, borderColor: 'rgba(217,119,43,0.24)' },
  ringLarge: { width: RING_SIZE + 50, height: RING_SIZE + 50, borderRadius: (RING_SIZE + 50) / 2 },
  ringXL: { width: RING_SIZE + 100, height: RING_SIZE + 100, borderRadius: (RING_SIZE + 100) / 2 },
  glow: { position: 'absolute', width: BUTTON_SIZE + 60, height: BUTTON_SIZE + 60, borderRadius: (BUTTON_SIZE + 60) / 2, backgroundColor: 'rgba(217,119,43,0.08)' },
  buttonWrapper: { alignItems: 'center', justifyContent: 'center' },
  button: {
    width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(217,119,43,0.35)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D9772B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
  },
  buttonLabel: { fontSize: 16, color: 'rgba(62,48,36,0.78)', letterSpacing: 0.4, fontFamily: Fonts.sans },
  footer: { alignItems: 'center', gap: 16, paddingHorizontal: 30, paddingBottom: 4 },
  featureRow: { flexDirection: 'row', gap: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillIcon: { fontSize: 15, opacity: 0.75 },
  pillLabel: { fontSize: 13, color: 'rgba(62,48,36,0.68)', letterSpacing: 0.2, fontFamily: Fonts.sans },
  footerNote: { fontSize: 13, color: 'rgba(62,48,36,0.62)', textAlign: 'center', lineHeight: 20, fontFamily: Fonts.sans },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center' },
  dropdown: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(217,119,43,0.08)',
  },
  dropdownItemSelected: { backgroundColor: 'rgba(217,119,43,0.06)' },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownFlag: { fontSize: 20 },
  dropdownLabel: { flex: 1, fontSize: 15, color: 'rgba(62,48,36,0.75)', fontFamily: Fonts.sans },
  dropdownLabelSelected: { color: '#D9772B', fontWeight: '600' },
  checkmark: { fontSize: 14, color: '#D9772B', fontWeight: '600' },
});
