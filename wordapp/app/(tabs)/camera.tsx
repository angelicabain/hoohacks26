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
  Platform,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useAudioPlayer } from 'expo-audio';
import { Fonts } from '@/constants/theme';
import { Audio } from 'expo-av';
import { detectObject, type DetectResult, transcribeAudio, type TranscribeResult } from '@/services/api';
import HamburgerMenu from '@/components/hamburger-menu';
import { useWords } from '@/contexts/WordsContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.4;
const QUIZ_THRESHOLD = 5;

export default function CameraScreen() {
  const router = useRouter();
  const { langCode, langLocale, langLabel } = useLocalSearchParams<{
    langCode?: string;
    langLocale?: string;
    langLabel?: string;
  }>();
  const effectiveLangCode = langCode ?? 'es';
  const effectiveLangLocale = langLocale ?? 'es-ES';
  const effectiveLangLabel = langLabel ?? 'Spanish';
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { words: globalWords, addWord } = useWords();
  const styles = createStyles();

  // State machine: 'scanning' | 'learning'
  const [mode, setMode] = useState<'scanning' | 'learning'>('scanning');
  const isProcessing = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detection / learning state
  const [result, setResult] = useState<DetectResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guessMode, setGuessMode] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessResult, setGuessResult] = useState<'correct' | 'incorrect' | null>(null);
  const [seenWords, setSeenWords] = useState<DetectResult[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Quiz prompt state
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);
  const [quizDismissedAt, setQuizDismissedAt] = useState(0);

  // Voice pronunciation state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<TranscribeResult | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const cornerFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const keyboardLift = useRef(new Animated.Value(0)).current;
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const octopusBob = useRef(new Animated.Value(0)).current;
  const correctAnswerPlayer = useAudioPlayer(
    require('../../assets/sounds/ui-button-load-more-roy-s-noise-2-2-00-01.mp3')
  );
  const wrongAnswerPlayer = useAudioPlayer(
    require('../../assets/sounds/844147__mihacappy__sfx_wrong_generic.wav')
  );

  useEffect(() => {
    Animated.timing(cornerFade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    };
  }, []);

  // Octopus bob animation
  useEffect(() => {
    if (!showQuizPrompt) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(octopusBob, {
          toValue: -5,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(octopusBob, {
          toValue: 5,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuizPrompt]);

  // Show quiz prompt when threshold reached
  useEffect(() => {
    if (
      mode === 'scanning' &&
      seenWords.length >= QUIZ_THRESHOLD &&
      seenWords.length - quizDismissedAt >= QUIZ_THRESHOLD &&
      !showQuizPrompt
    ) {
      setShowQuizPrompt(true);
    }
  }, [seenWords.length, mode, quizDismissedAt, showQuizPrompt]);

  // Keyboard lift
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const targetLift = Math.max(0, event.endCoordinates.height - 14);
      Animated.timing(keyboardLift, {
        toValue: targetLift,
        duration: event.duration ?? 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      Animated.timing(keyboardLift, {
        toValue: 0,
        duration: event.duration ?? 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardLift]);

  // --- Scan loop ---
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

        if (photo?.base64) {
          stopScanning();
          setResult(null);
          setIsDetecting(true);
          setDetectError(null);
          setRevealed(false);
          setGuessMode(false);
          setGuess('');
          setGuessResult(null);
          setVoiceResult(null);
          setShowQuizPrompt(false);
          setMode('learning');

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

          try {
            const detection = await detectObject(photo.base64, effectiveLangCode);
            setResult(detection);
            setDetectError(null);
          } catch {
            setDetectError('Could not detect object. Try scanning again.');
          } finally {
            setIsDetecting(false);
          }
        }
      } catch {
        // Silently fail
      } finally {
        isProcessing.current = false;
      }
    }, 4000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLangCode]);

  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (permission?.granted && mode === 'scanning') {
      startScanning();
    }
    return () => stopScanning();
  }, [permission?.granted, mode, startScanning, stopScanning]);

  // --- Dismiss learning card ---
  const handleDismiss = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    if (result) {
      addWord(result);
      setSeenWords((prev) => {
        const exists = prev.some(
          (w) => w.english.toLowerCase() === result.english.toLowerCase()
        );
        if (exists) return prev;
        const next = [...prev, result];
        return next.length > 20 ? next.slice(-20) : next;
      });
    }

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
      setIsDetecting(false);
      setDetectError(null);
      setMode('scanning');
      Keyboard.dismiss();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleSpeak = useCallback(() => {
    if (result?.target) {
      Speech.speak(result.target, {
        language: effectiveLangLocale,
        rate: 0.50,
      });
    }
  }, [result, effectiveLangLocale]);

  // --- Voice pronunciation ---
  const stopVoiceRecording = useCallback(async () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    const recording = recordingRef.current;
    if (!recording) return null;
    setIsRecording(false);
    recordingRef.current = null;
    try {
      await recording.stopAndUnloadAsync();
      return recording.getURI();
    } catch {
      return null;
    }
  }, []);

  const processVoiceRecording = useCallback(async (uri: string) => {
    if (!result) return;
    setVoiceProcessing(true);
    try {
      const res = await transcribeAudio(uri, effectiveLangCode, result.target);
      setVoiceResult(res);

      if (res.score >= 7) {
        void (async () => {
          try {
            await correctAnswerPlayer.seekTo(0);
            correctAnswerPlayer.play();
          } catch {/* ignore */ }
        })();
        autoCloseTimerRef.current = setTimeout(() => {
          handleDismiss();
        }, 1500);
      } else {
        void (async () => {
          try {
            await wrongAnswerPlayer.seekTo(0);
            wrongAnswerPlayer.play();
          } catch {/* ignore */ }
        })();
      }
    } catch {
      setVoiceResult(null);
    }
    setVoiceProcessing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, effectiveLangCode, handleDismiss, correctAnswerPlayer, wrongAnswerPlayer]);

  const handleMicPress = useCallback(async () => {
    if (isRecording) {
      const uri = await stopVoiceRecording();
      if (uri) processVoiceRecording(uri);
      return;
    }

    setVoiceResult(null);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);

      recordingTimerRef.current = setTimeout(async () => {
        const uri = await stopVoiceRecording();
        if (uri) processVoiceRecording(uri);
      }, 5000);
    } catch {
      setIsRecording(false);
    }
  }, [isRecording, stopVoiceRecording, processVoiceRecording]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => { });
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    };
  }, []);

  const handleCheckGuess = useCallback(() => {
    if (!result) return;

    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    const isCorrect =
      guess.toLowerCase().trim() === result.target.toLowerCase().trim();
    setGuessResult(isCorrect ? 'correct' : 'incorrect');
    Keyboard.dismiss();

    if (isCorrect) {
      void (async () => {
        try {
          await correctAnswerPlayer.seekTo(0);
          correctAnswerPlayer.play();
        } catch {
          // Ignore sound errors to avoid blocking answer flow.
        }
      })();

      autoCloseTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 650);
    } else {
      void (async () => {
        try {
          await wrongAnswerPlayer.seekTo(0);
          wrongAnswerPlayer.play();
        } catch {
          // Ignore sound errors to avoid blocking answer flow.
        }
      })();
    }
  }, [guess, result, handleDismiss, correctAnswerPlayer, wrongAnswerPlayer]);

  const handleStartQuiz = useCallback(() => {
    setShowQuizPrompt(false);
    stopScanning();
    router.push({
      pathname: '/quiz' as any,
      params: {
        words: JSON.stringify(seenWords),
        langCode: effectiveLangCode,
        langLocale: effectiveLangLocale,
        langLabel: effectiveLangLabel,
      },
    });
  }, [seenWords, effectiveLangCode, effectiveLangLocale, effectiveLangLabel, router, stopScanning]);

  const handleDismissQuiz = useCallback(() => {
    setShowQuizPrompt(false);
    setQuizDismissedAt(seenWords.length);
  }, [seenWords.length]);

  // --- Permission states ---
  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Initializing camera…</Text>
      </View>
    );
  }

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
            <Text style={styles.topLang}>{effectiveLangLabel}</Text>
          </View>

          <View style={styles.wordCounter}>
            <Text style={styles.wordCountText}>{seenWords.length}</Text>
            <Text style={styles.wordCountLabel}>learned</Text>
          </View>
        </View>

        {/* Center */}
        <View style={styles.centerArea}>
          <Animated.View style={[styles.crosshairWrapper, { opacity: cornerFade }]}>
            <View style={styles.crosshair} />
          </Animated.View>
          {mode === 'scanning' && (
            <Text style={styles.scanningText}>Scanning…</Text>
          )}
        </View>

        <View />
      </SafeAreaView>

      {/* Learning card */}
      {mode === 'learning' && (
        <Animated.View
          style={[
            styles.learningCard,
            {
              transform: [
                { translateY: cardSlide },
                { translateY: Animated.multiply(keyboardLift, -1) },
              ],
              opacity: cardOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>

          {isDetecting ? (
            <View style={styles.stateWrap}>
              <Text style={styles.stateTitle}>Detecting object...</Text>
              <Text style={styles.stateSubtitle}>Hold steady for a moment.</Text>
            </View>
          ) : detectError ? (
            <View style={styles.stateWrap}>
              <Text style={styles.stateTitle}>Scan failed</Text>
              <Text style={styles.stateSubtitle}>{detectError}</Text>
            </View>
          ) : result ? (
            <>
              <Text style={styles.englishWord}>{result.english}</Text>

              <View style={styles.targetRow}>
                {revealed ? (
                  <TouchableOpacity
                    onPress={() => setRevealed(false)}
                    activeOpacity={0.7}
                    style={styles.revealedWordButton}
                  >
                    <Text style={styles.targetWord}>{result.target}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.revealButton}
                    onPress={() => setRevealed(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.revealText}>Tap to Reveal</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={handleSpeak}
                  activeOpacity={0.7}
                >
                  <Text style={styles.speakerIcon}>🔊</Text>
                </TouchableOpacity>
              </View>

              {/* Speak / Write action row */}
              {!guessMode ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, isRecording && styles.actionButtonRecording]}
                    onPress={handleMicPress}
                    activeOpacity={0.7}
                    disabled={voiceProcessing}
                  >
                    <Text style={styles.actionIcon}>{isRecording ? '⏹' : '🎤'}</Text>
                    <Text style={[styles.actionLabel, isRecording && styles.actionLabelRecording]}>
                      {isRecording ? 'Stop' : 'Speak'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setGuessMode(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionIcon}>✏️</Text>
                    <Text style={styles.actionLabel}>Write</Text>
                  </TouchableOpacity>
                </View>
              ) : (
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
                      autoFocus
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
              )}

              {/* Recording / voice feedback */}
              {isRecording && (
                <View style={styles.voiceIndicator}>
                  <View style={styles.voiceDot} />
                  <Text style={styles.voiceIndicatorText}>Listening...</Text>
                </View>
              )}
              {voiceProcessing && (
                <Text style={styles.voiceProcessingText}>Processing...</Text>
              )}
              {voiceResult && !voiceProcessing && !isRecording && (
                voiceResult.score >= 7 ? (
                  <Text style={styles.voiceSuccessText}>
                    {voiceResult.score >= 9 ? '🎤 Perfect!' : '🎤 Great job!'}
                  </Text>
                ) : (
                  <View style={styles.voiceFailCard}>
                    <Text style={styles.voiceFailHeard}>
                      🎤 Heard: {voiceResult.heard} | Correct: {result?.target}
                    </Text>
                    <Text style={styles.voiceFailFeedback}>{voiceResult.feedback}</Text>
                  </View>
                )
              )}
            </>
          ) : null}
        </Animated.View>
      )}

      {/* Quiz prompt — octopus peeking from bottom */}
      {showQuizPrompt && mode === 'scanning' && (
        <View style={styles.quizPromptContainer}>
          {/* Speech bubble */}
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>Ready to test your memory?</Text>
            <View style={styles.speechTriangle} />
          </View>

          <View style={styles.quizPromptRow}>
            {/* Octopus */}
            <Animated.View style={{ transform: [{ translateY: octopusBob }] }}>
              <Image
                source={require('@/assets/images/smiling.png')}
                style={styles.octopusImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Buttons */}
            <View style={styles.quizPromptButtons}>
              <TouchableOpacity
                style={styles.startQuizButton}
                onPress={handleStartQuiz}
                activeOpacity={0.8}
              >
                <Text style={styles.startQuizText}>Start Quiz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.laterButton}
                onPress={handleDismissQuiz}
                activeOpacity={0.7}
              >
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
      borderColor: 'rgba(217,119,43,0.24)',
    },
    wordCountText: {
      fontSize: 18,
      color: '#D9772B',
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
      gap: 10,
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

    stateWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    stateTitle: {
      fontSize: 22,
      color: '#2C241C',
      fontFamily: Fonts.serif,
      textAlign: 'center',
    },
    stateSubtitle: {
      fontSize: 14,
      color: 'rgba(62,48,36,0.72)',
      fontFamily: Fonts.sans,
      textAlign: 'center',
      lineHeight: 20,
    },

    // Card content
    englishWord: {
      fontSize: 28,
      color: '#2C241C',
      fontWeight: '700',
      fontFamily: Fonts.serif,
      textAlign: 'center',
      marginBottom: 4,
    },
    targetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '86%',
      gap: 12,
    },
    revealedWordButton: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minHeight: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(217,119,43,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(217,119,43,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    targetWord: {
      fontSize: 24,
      color: '#D9772B',
      fontWeight: '600',
      fontFamily: Fonts.serif,
    },
    revealButton: {
      flex: 1,
      minHeight: 44,
      backgroundColor: 'rgba(217,119,43,0.1)',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(217,119,43,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    revealText: {
      fontSize: 15,
      color: '#D9772B',
      fontFamily: Fonts.serif,
      letterSpacing: 0.2,
    },
    speakerButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(217,119,43,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(217,119,43,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    speakerIcon: {
      fontSize: 20,
    },
    actionRow: {
      flexDirection: 'row',
      width: '86%',
      gap: 12,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: 'rgba(217,119,43,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(217,119,43,0.2)',
    },
    actionButtonRecording: {
      backgroundColor: 'rgba(196,77,63,0.1)',
      borderColor: '#C44D3F',
    },
    actionIcon: {
      fontSize: 20,
    },
    actionLabel: {
      fontSize: 15,
      color: '#2C241C',
      fontWeight: '600',
      fontFamily: Fonts.rounded,
      letterSpacing: 0.2,
    },
    actionLabelRecording: {
      color: '#C44D3F',
    },
    voiceIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    voiceDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#C44D3F',
    },
    voiceIndicatorText: {
      fontSize: 12,
      color: '#C44D3F',
      fontFamily: Fonts.rounded,
    },
    voiceProcessingText: {
      fontSize: 12,
      color: 'rgba(62,48,36,0.5)',
      fontFamily: Fonts.rounded,
    },
    voiceSuccessText: {
      fontSize: 15,
      color: '#2D8F4E',
      fontWeight: '700',
      fontFamily: Fonts.rounded,
      textAlign: 'center',
    },
    voiceFailCard: {
      width: '86%',
      gap: 4,
      paddingHorizontal: 4,
    },
    voiceFailHeard: {
      fontSize: 13,
      color: 'rgba(62,48,36,0.75)',
      fontFamily: Fonts.sans,
      textAlign: 'center',
      lineHeight: 18,
    },
    voiceFailFeedback: {
      fontSize: 12,
      color: '#B65E1C',
      fontFamily: Fonts.sans,
      textAlign: 'center',
      lineHeight: 16,
    },
    // Guess area
    guessArea: {
      width: '100%',
      gap: 10,
      alignItems: 'center',
    },
    guessRow: {
      flexDirection: 'row',
      width: '86%',
      alignSelf: 'center',
      gap: 10,
      alignItems: 'center',
    },
    guessInput: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor: 'rgba(217,119,43,0.24)',
      borderRadius: 14,
      paddingHorizontal: 14,
      fontSize: 15,
      color: '#2C241C',
      fontFamily: Fonts.sans,
      backgroundColor: '#FFFFFF',
    },
    submitGuess: {
      backgroundColor: '#D9772B',
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
      color: '#D9772B',
      fontSize: 15,
      fontWeight: '600',
      fontFamily: Fonts.rounded,
    },
    guessIncorrect: {
      color: '#B65E1C',
      fontSize: 15,
      fontWeight: '600',
      fontFamily: Fonts.rounded,
    },

    // Hint box
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

    // Quiz prompt
    quizPromptContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingBottom: 32,
      paddingHorizontal: 20,
    },
    speechBubble: {
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    speechText: {
      fontSize: 15,
      color: '#2C241C',
      fontFamily: Fonts.rounded,
      textAlign: 'center',
    },
    speechTriangle: {
      position: 'absolute',
      bottom: -8,
      left: 40,
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: 'rgba(255,255,255,0.95)',
    },
    quizPromptRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 16,
    },
    octopusImage: {
      width: 120,
      height: 120,
    },
    quizPromptButtons: {
      gap: 8,
      alignItems: 'center',
      paddingBottom: 10,
    },
    startQuizButton: {
      backgroundColor: '#D9772B',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 22,
    },
    startQuizText: {
      color: '#FFF9F3',
      fontSize: 15,
      fontWeight: '700',
      fontFamily: Fonts.rounded,
      letterSpacing: 0.2,
    },
    laterButton: {
      padding: 6,
    },
    laterText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 13,
      fontFamily: Fonts.rounded,
    },
  });
