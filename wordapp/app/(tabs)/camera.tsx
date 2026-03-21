import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Fonts } from '@/constants/theme';
import { detectObject, type DetectResult } from '@/services/api';
import HamburgerMenu from '@/components/hamburger-menu';

export default function CameraScreen() {
  const router = useRouter();
  const { langCode, langLocale, langLabel } = useLocalSearchParams<{
    langCode: string;
    langLocale: string;
    langLabel: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const styles = createStyles();

  // Detection state
  const isProcessing = useRef(false);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guessMode, setGuessMode] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessResult, setGuessResult] = useState<'correct' | 'incorrect' | null>(null);
  const [seenWords, setSeenWords] = useState<DetectResult[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Animations
  const cornerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cornerFade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-capture loop
  useEffect(() => {
    if (!permission?.granted) return;

    const interval = setInterval(async () => {
      if (isProcessing.current || !cameraRef.current) return;

      isProcessing.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });

        if (photo?.base64 && langCode) {
          const detection = await detectObject(photo.base64, langCode);
          setResult(detection);
          setRevealed(false);
          setGuessMode(false);
          setGuess('');
          setGuessResult(null);

          setSeenWords((prev) => {
            const exists = prev.some(
              (w) => w.english.toLowerCase() === detection.english.toLowerCase()
            );
            if (exists) return prev;
            const next = [...prev, detection];
            return next.length > 20 ? next.slice(-20) : next;
          });
        }
      } catch {
        // Silently fail — next interval will retry
      } finally {
        isProcessing.current = false;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [permission?.granted, langCode]);

  const handleSpeak = useCallback(() => {
    if (result?.target && langLocale) {
      Speech.speak(result.target, { language: langLocale });
    }
  }, [result, langLocale]);

  const handleCheckGuess = useCallback(() => {
    if (!result) return;
    const isCorrect =
      guess.toLowerCase().trim() === result.target.toLowerCase().trim();
    setGuessResult(isCorrect ? 'correct' : 'incorrect');
    Keyboard.dismiss();
  }, [guess, result]);

  // --- Permission not yet determined ---
  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Initializing camera…</Text>
      </View>
    );
  }

  // --- Permission denied ---
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permText}>
          Fluency uses your camera to detect objects and teach you vocabulary.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full-screen camera */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Fluency</Text>
            {langLabel ? (
              <Text style={styles.topLang}>{langLabel}</Text>
            ) : null}
          </View>

          <View style={styles.wordCounter}>
            <Text style={styles.wordCountText}>{seenWords.length}</Text>
            <Text style={styles.wordCountLabel}>learned</Text>
          </View>
        </View>

        {/* Center crosshair */}
        <Animated.View style={[styles.crosshairWrapper, { opacity: cornerFade }]}>
          <View style={styles.crosshair} />
        </Animated.View>

        {/* Bottom area */}
        <View style={styles.bottomArea}>
          {/* Result card */}
          {result ? (
            <View style={styles.resultCard}>
              {/* English word */}
              <Text style={styles.englishWord}>{result.english}</Text>

              {/* Target word row */}
              <View style={styles.targetRow}>
                {revealed ? (
                  <Text style={styles.targetWord}>{result.target}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.revealButton}
                    onPress={() => setRevealed(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.revealText}>Tap to Reveal</Text>
                  </TouchableOpacity>
                )}

                {/* Speaker button */}
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={handleSpeak}
                  activeOpacity={0.7}
                >
                  <Text style={styles.speakerIcon}>🔊</Text>
                </TouchableOpacity>
              </View>

              {/* Check / Guess area */}
              {guessMode ? (
                <View style={styles.guessArea}>
                  <TextInput
                    style={styles.guessInput}
                    placeholder="Type the translation…"
                    placeholderTextColor="rgba(62,48,36,0.4)"
                    value={guess}
                    onChangeText={(text) => {
                      setGuess(text);
                      setGuessResult(null);
                    }}
                    onSubmitEditing={handleCheckGuess}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.submitGuess}
                    onPress={handleCheckGuess}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.submitGuessText}>→</Text>
                  </TouchableOpacity>
                  {guessResult === 'correct' && (
                    <Text style={styles.guessCorrect}>✓ Correct!</Text>
                  )}
                  {guessResult === 'incorrect' && (
                    <Text style={styles.guessIncorrect}>✗ Try again</Text>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={() => setGuessMode(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.checkText}>Check</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                Point at any object to detect and translate
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Hamburger menu overlay */}
      <HamburgerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permTitle: {
    fontSize: 22,
    color: '#2C241C',
    marginBottom: 4,
    fontFamily: Fonts.serif,
  },
  permText: {
    fontSize: 14,
    color: 'rgba(62,48,36,0.74)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Fonts.sans,
  },
  permButton: {
    marginTop: 8,
    backgroundColor: '#D9772B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  permButtonText: {
    color: '#FFF9F3',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
    fontFamily: Fonts.sans,
  },
  backLink: {
    marginTop: 4,
    padding: 8,
  },
  backLinkText: {
    color: 'rgba(62,48,36,0.64)',
    fontSize: 14,
    fontFamily: Fonts.sans,
  },

  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },

  // Top bar
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  menuLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#2C241C',
  },
  topCenter: {
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 24,
    color: '#2C241C',
    letterSpacing: 0.1,
    fontFamily: Fonts.serif,
  },
  topLang: {
    fontSize: 11,
    color: '#3A8F8A',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.3,
  },
  wordCounter: {
    alignItems: 'center',
    minWidth: 40,
  },
  wordCountText: {
    fontSize: 18,
    color: '#3A8F8A',
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },
  wordCountLabel: {
    fontSize: 9,
    color: 'rgba(62,48,36,0.6)',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.3,
  },

  // Crosshair
  crosshairWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(217,119,43,0.78)',
    shadowColor: '#D9772B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },

  // Bottom area
  bottomArea: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },

  // Result card
  resultCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(58,143,138,0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  englishWord: {
    fontSize: 22,
    color: '#2C241C',
    fontWeight: '600',
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  targetWord: {
    fontSize: 20,
    color: '#3A8F8A',
    fontWeight: '600',
    fontFamily: Fonts.rounded,
  },
  revealButton: {
    backgroundColor: 'rgba(58,143,138,0.1)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(58,143,138,0.2)',
  },
  revealText: {
    fontSize: 14,
    color: '#3A8F8A',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.2,
  },
  speakerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(58,143,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIcon: {
    fontSize: 18,
  },
  checkButton: {
    alignSelf: 'center',
    backgroundColor: '#3A8F8A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  checkText: {
    color: '#FFF9F3',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.2,
  },

  // Guess area
  guessArea: {
    gap: 8,
    alignItems: 'center',
  },
  guessInput: {
    width: '100%',
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(58,143,138,0.24)',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#2C241C',
    fontFamily: Fonts.sans,
    backgroundColor: '#FFFFFF',
  },
  submitGuess: {
    backgroundColor: '#3A8F8A',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitGuessText: {
    color: '#FFF9F3',
    fontSize: 18,
    fontWeight: '600',
  },
  guessCorrect: {
    color: '#2D8F4E',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.rounded,
  },
  guessIncorrect: {
    color: '#C44D3F',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.rounded,
  },

  // Hint box (when no result)
  hintBox: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.18)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  hintText: {
    color: 'rgba(62,48,36,0.78)',
    fontSize: 12,
    letterSpacing: 0.2,
    textAlign: 'center',
    fontFamily: Fonts.sans,
  },
});
