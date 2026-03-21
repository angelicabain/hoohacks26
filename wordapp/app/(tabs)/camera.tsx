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
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Fonts } from '@/constants/theme';
import { detectObject, type DetectResult } from '@/services/api';
import HamburgerMenu from '@/components/hamburger-menu';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.4;

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

  // State machine: 'scanning' | 'learning'
  const [mode, setMode] = useState<'scanning' | 'learning'>('scanning');
  const isProcessing = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detection / learning state
  const [result, setResult] = useState<DetectResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guessMode, setGuessMode] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessResult, setGuessResult] = useState<'correct' | 'incorrect' | null>(null);
  const [seenWords, setSeenWords] = useState<DetectResult[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Animations
  const cornerFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cornerFade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Scan loop: start/stop based on mode ---
  const startScanning = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (isProcessing.current || !cameraRef.current) return;

      isProcessing.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });

        if (photo?.base64 && langCode) {
          const detection = await detectObject(photo.base64, langCode);

          // Stop scanning, transition to learning
          stopScanning();
          setResult(detection);
          setRevealed(false);
          setGuessMode(false);
          setGuess('');
          setGuessResult(null);
          setMode('learning');

          // Slide card up
          cardSlide.setValue(CARD_HEIGHT);
          cardOpacity.setValue(0);
          Animated.parallel([
            Animated.timing(cardSlide, {
              toValue: 0,
              duration: 350,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } catch {
        // Silently fail — next interval will retry
      } finally {
        isProcessing.current = false;
      }
    }, 4000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langCode]);

  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start scanning when permission granted
  useEffect(() => {
    if (permission?.granted && mode === 'scanning') {
      startScanning();
    }
    return () => stopScanning();
  }, [permission?.granted, mode, startScanning, stopScanning]);

  // --- Dismiss card: add word, animate out, resume scanning ---
  const handleDismiss = useCallback(() => {
    // Add to seen words
    if (result) {
      setSeenWords((prev) => {
        const exists = prev.some(
          (w) => w.english.toLowerCase() === result.english.toLowerCase()
        );
        if (exists) return prev;
        const next = [...prev, result];
        return next.length > 20 ? next.slice(-20) : next;
      });
    }

    // Slide card down / fade out
    Animated.parallel([
      Animated.timing(cardSlide, {
        toValue: CARD_HEIGHT,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setResult(null);
      setMode('scanning');
      Keyboard.dismiss();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

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
        {/* Top bar — always visible */}
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

        {/* Center area */}
        <View style={styles.centerArea}>
          {/* Crosshair — always visible */}
          <Animated.View style={[styles.crosshairWrapper, { opacity: cornerFade }]}>
            <View style={styles.crosshair} />
          </Animated.View>

          {/* Scanning indicator */}
          {mode === 'scanning' && (
            <Text style={styles.scanningText}>Scanning…</Text>
          )}
        </View>

        {/* Spacer to push content to bottom */}
        <View />
      </SafeAreaView>

      {/* Learning card — slides up from bottom */}
      {result && (
        <Animated.View
          style={[
            styles.learningCard,
            {
              transform: [{ translateY: cardSlide }],
              opacity: cardOpacity,
            },
          ]}
        >
          {/* Dismiss X button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>

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
              <View style={styles.guessRow}>
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
              </View>
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
        </Animated.View>
      )}

      {/* Hamburger menu overlay */}
      <HamburgerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
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
      color: '#FFFFFF',
      letterSpacing: 0.1,
      fontFamily: Fonts.serif,
    },
    topLang: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.8)',
      fontFamily: Fonts.rounded,
      letterSpacing: 0.3,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    wordCounter: {
      alignItems: 'center',
      minWidth: 40,
      backgroundColor: 'rgba(255,255,255,0.86)',
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: 'rgba(58,143,138,0.24)',
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

    // Center area
    centerArea: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
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
      shadowOpacity: 0.7,
      shadowRadius: 6,
    },
    scanningText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
      fontFamily: Fonts.rounded,
      letterSpacing: 0.4,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    // Learning card
    learningCard: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: CARD_HEIGHT,
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
      gap: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 12,
    },
    dismissButton: {
      position: 'absolute',
      top: 16,
      right: 20,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(62,48,36,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dismissText: {
      fontSize: 16,
      color: 'rgba(62,48,36,0.5)',
      fontWeight: '600',
    },

    // Card content
    englishWord: {
      fontSize: 28,
      color: '#2C241C',
      fontWeight: '700',
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
      fontSize: 24,
      color: '#3A8F8A',
      fontWeight: '600',
      fontFamily: Fonts.rounded,
    },
    revealButton: {
      backgroundColor: 'rgba(58,143,138,0.1)',
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(58,143,138,0.2)',
    },
    revealText: {
      fontSize: 15,
      color: '#3A8F8A',
      fontFamily: Fonts.rounded,
      letterSpacing: 0.2,
    },
    speakerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(58,143,138,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    speakerIcon: {
      fontSize: 20,
    },
    checkButton: {
      backgroundColor: '#3A8F8A',
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 22,
    },
    checkText: {
      color: '#FFF9F3',
      fontSize: 15,
      fontWeight: '600',
      fontFamily: Fonts.rounded,
      letterSpacing: 0.2,
    },

    // Guess area
    guessArea: {
      width: '100%',
      gap: 10,
      alignItems: 'center',
    },
    guessRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 10,
      alignItems: 'center',
    },
    guessInput: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor: 'rgba(58,143,138,0.24)',
      borderRadius: 14,
      paddingHorizontal: 14,
      fontSize: 15,
      color: '#2C241C',
      fontFamily: Fonts.sans,
      backgroundColor: '#FFFFFF',
    },
    submitGuess: {
      backgroundColor: '#3A8F8A',
      width: 40,
      height: 40,
      borderRadius: 20,
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
      fontSize: 15,
      fontWeight: '600',
      fontFamily: Fonts.rounded,
    },
    guessIncorrect: {
      color: '#C44D3F',
      fontSize: 15,
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
