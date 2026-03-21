import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ScrollView,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { Fonts } from '@/constants/theme';
import {
  type DetectResult,
  type SentenceResult,
  type GradeResult,
  generateSentences,
  gradeSentences,
} from '@/services/api';

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

type Phase = 'recall' | 'recall-summary' | 'sentences' | 'grading' | 'final';

// Octopus images
const OCTOPUS = {
  smiling: require('@/assets/images/smiling.png'),
  happy: require('@/assets/images/happy.png'),
  upset: require('@/assets/images/frown.png'),
  thinking: require('@/assets/images/thinking.png'),
};

export default function QuizScreen() {
  const router = useRouter();
  const { words, langCode, langLabel } = useLocalSearchParams<{
    words?: string;
    langCode?: string;
    langLocale?: string;
    langLabel?: string;
  }>();

  const quizWords: DetectResult[] = useMemo(
    () => (words ? JSON.parse(words) : []),
    [words],
  );
  const effectiveLangCode = langCode ?? 'es';
  const effectiveLangLabel = langLabel ?? 'Spanish';

  // Phase state
  const [phase, setPhase] = useState<Phase>('recall');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [recallScore, setRecallScore] = useState(0);
  const [recallResults, setRecallResults] = useState<boolean[]>([]);

  // Phase 2 state
  const [sentences, setSentences] = useState<SentenceResult[]>([]);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [sentenceGuess, setSentenceGuess] = useState('');
  const [sentenceLoading, setSentenceLoading] = useState(false);
  const [sentenceAttempts, setSentenceAttempts] = useState<string[]>([]);
  const [grades, setGrades] = useState<GradeResult[]>([]);

  // Animations
  const octopusBob = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const keyboardLift = useRef(new Animated.Value(0)).current;
  const correctAnswerPlayer = useAudioPlayer(
    require('@/assets/sounds/ui-button-load-more-roy-s-noise-2-2-00-01.mp3')
  );
  const wrongAnswerPlayer = useAudioPlayer(
    require('@/assets/sounds/844147__mihacappy__sfx_wrong_generic.wav')
  );

  const playCorrectSound = useCallback(() => {
    void (async () => {
      try {
        await correctAnswerPlayer.seekTo(0);
        correctAnswerPlayer.play();
      } catch {
        // Ignore sound errors so quiz flow is never blocked.
      }
    })();
  }, [correctAnswerPlayer]);

  const playWrongSound = useCallback(() => {
    void (async () => {
      try {
        await wrongAnswerPlayer.seekTo(0);
        wrongAnswerPlayer.play();
      } catch {
        // Ignore sound errors so quiz flow is never blocked.
      }
    })();
  }, [wrongAnswerPlayer]);

  // Octopus bob loop
  useEffect(() => {
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
  }, []);

  // Keyboard lift
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      Animated.timing(keyboardLift, {
        toValue: Math.max(0, event.endCoordinates.height - 40),
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

  const playBounce = useCallback(() => {
    bounceAnim.setValue(1);
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Phase 1: Recall ---
  const handleRecallSubmit = useCallback(() => {
    if (showFeedback || !quizWords[currentIndex]) return;
    Keyboard.dismiss();

    const correct = quizWords[currentIndex].target.toLowerCase().trim();
    const attempt = guess.toLowerCase().trim();
    const dist = levenshtein(attempt, correct);
    const matched = dist <= 2;

    setIsCorrect(matched);
    setShowFeedback(true);
    setRecallResults((prev) => [...prev, matched]);
    if (matched) {
      setRecallScore((s) => s + 1);
      playBounce();
      playCorrectSound();
    } else {
      playShake();
      playWrongSound();
    }

    // Move to next after delay
    const delay = matched ? 1500 : 2500;
    setTimeout(() => {
      setShowFeedback(false);
      setGuess('');
      if (currentIndex < quizWords.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setPhase('recall-summary');
      }
    }, delay);
  }, [showFeedback, guess, currentIndex, quizWords, playBounce, playShake, playCorrectSound, playWrongSound]);

  // --- Phase 2: Generate all sentences in one batch call ---
  const startSentencePhase = useCallback(async () => {
    setPhase('sentences');
    setSentenceIndex(0);
    setSentenceGuess('');
    setSentenceAttempts([]);
    setGrades([]);
    setSentenceLoading(true);

    try {
      const wordPairs = quizWords.map((w) => ({ english: w.english, target: w.target }));
      const result = await generateSentences(wordPairs, effectiveLangCode);
      setSentences(result);
    } catch {
      setSentences([]);
    }
    setSentenceLoading(false);
  }, [quizWords, effectiveLangCode]);

  // Batch grade all sentence attempts in one call
  const batchGrade = useCallback(async (attempts: string[]) => {
    setPhase('grading');

    const pairs = sentences.map((s, i) => ({
      correct: s.sentence_target,
      attempt: attempts[i] ?? '',
    }));

    try {
      const result = await gradeSentences(pairs, effectiveLangCode);
      setGrades(result);
    } catch {
      setGrades(sentences.map(() => ({ score: 0, feedback: 'Could not grade' })));
    }

    setPhase('final');
  }, [sentences, effectiveLangCode]);

  // Submit sentence attempt — no grading, just collect and move on
  const handleSentenceSubmit = useCallback(() => {
    Keyboard.dismiss();

    const attempt = sentenceGuess.trim();
    const expected = (sentences[sentenceIndex]?.sentence_target ?? '').toLowerCase().trim();
    const normalizedAttempt = attempt.toLowerCase().trim();
    const sentenceDistance = levenshtein(normalizedAttempt, expected);
    const tolerance = Math.max(2, Math.floor(expected.length * 0.12));

    if (expected.length > 0 && sentenceDistance <= tolerance) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    const newAttempts = [...sentenceAttempts, attempt];
    setSentenceAttempts(newAttempts);
    setSentenceGuess('');

    if (sentenceIndex < sentences.length - 1) {
      setSentenceIndex((i) => i + 1);
    } else {
      batchGrade(newAttempts);
    }
  }, [sentenceGuess, sentenceAttempts, sentenceIndex, sentences, batchGrade, playCorrectSound, playWrongSound]);

  // --- Octopus face logic ---
  const getRecallOctopus = () => {
    if (!showFeedback) return OCTOPUS.smiling;
    return isCorrect ? OCTOPUS.happy : OCTOPUS.upset;
  };

  const getFinalOctopus = () => {
    const avgSentence = grades.length > 0
      ? grades.reduce((a, b) => a + b.score, 0) / grades.length
      : 0;
    const recallPct = quizWords.length > 0 ? recallScore / quizWords.length : 0;
    return (recallPct >= 0.6 && avgSentence >= 5) ? OCTOPUS.happy : OCTOPUS.smiling;
  };

  // No words passed — fallback
  if (quizWords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Image source={OCTOPUS.smiling} style={styles.octopusLarge} resizeMode="contain" />
          <Text style={styles.emptyTitle}>No words to quiz yet!</Text>
          <Text style={styles.emptySubtitle}>
            Learn at least 5 words with the camera first.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Back to camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- PHASE 1: Quick Recall ---
  if (phase === 'recall') {
    const word = quizWords[currentIndex];
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.quizContent, { transform: [{ translateY: Animated.multiply(keyboardLift, -1) }] }]}>
          {/* Octopus + speech bubble */}
          <View style={styles.octopusSection}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                {showFeedback
                  ? isCorrect
                    ? 'Great job! 🎉'
                    : `It's "${word.target}"`
                  : `What's "${word.english}" in ${effectiveLangLabel}?`}
              </Text>
              <View style={styles.speechTriangle} />
            </View>
            <Animated.View style={{
              transform: [
                { translateY: octopusBob },
                { scale: showFeedback && isCorrect ? bounceAnim : 1 },
                { translateX: showFeedback && !isCorrect ? shakeAnim : 0 },
              ],
            }}>
              <Image
                source={getRecallOctopus()}
                style={styles.octopusLarge}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Progress */}
          <Text style={styles.progress}>{currentIndex + 1}/{quizWords.length} words</Text>

          {/* English word */}
          <Text style={styles.wordDisplay}>{word.english}</Text>

          {/* Feedback or input */}
          {showFeedback ? (
            <View style={styles.feedbackArea}>
              {isCorrect ? (
                <Text style={styles.correctFeedback}>✓ Correct!</Text>
              ) : (
                <Text style={styles.incorrectFeedback}>✗ {word.target}</Text>
              )}
            </View>
          ) : (
            <View style={styles.inputArea}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.quizInput}
                  placeholder="Type the translation…"
                  placeholderTextColor="rgba(62,48,36,0.4)"
                  value={guess}
                  onChangeText={setGuess}
                  onSubmitEditing={handleRecallSubmit}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleRecallSubmit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.submitBtnText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  // --- RECALL SUMMARY ---
  if (phase === 'recall-summary') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.summaryContent}>
          <View style={styles.octopusSection}>
            <Animated.View style={{ transform: [{ translateY: octopusBob }] }}>
              <Image
                source={recallScore >= quizWords.length * 0.6 ? OCTOPUS.happy : OCTOPUS.smiling}
                style={styles.octopusLarge}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <Text style={styles.summaryTitle}>Quick Recall Complete!</Text>
          <Text style={styles.summaryScore}>
            {recallScore}/{quizWords.length} correct
          </Text>

          {/* Word-by-word breakdown */}
          <View style={styles.breakdownList}>
            {quizWords.map((w, i) => (
              <View key={i} style={styles.breakdownRow}>
                <Text style={styles.breakdownIcon}>
                  {recallResults[i] ? '✓' : '✗'}
                </Text>
                <Text style={styles.breakdownWord}>{w.english}</Text>
                <Text style={styles.breakdownTarget}>{w.target}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={startSentencePhase}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continue to Sentences</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- PHASE 2: Contextual Sentences ---
  if (phase === 'sentences') {
    if (sentenceLoading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingState}>
            <Animated.View style={{ transform: [{ translateY: octopusBob }] }}>
              <Image source={OCTOPUS.thinking} style={styles.octopusLarge} resizeMode="contain" />
            </Animated.View>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                Generating sentences…
              </Text>
              <View style={styles.speechTriangleUp} />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    if (sentences.length === 0) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyState}>
            <Image source={OCTOPUS.upset} style={styles.octopusLarge} resizeMode="contain" />
            <Text style={styles.emptyTitle}>Could not generate sentences</Text>
            <Text style={styles.emptySubtitle}>There was a problem reaching the server.</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← Back to camera</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    const currentSentence = sentences[sentenceIndex];

    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.quizContent, { transform: [{ translateY: Animated.multiply(keyboardLift, -1) }] }]}>
          {/* Octopus */}
          <View style={styles.octopusSection}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>Translate this sentence!</Text>
              <View style={styles.speechTriangle} />
            </View>
            <Animated.View style={{ transform: [{ translateY: octopusBob }] }}>
              <Image
                source={OCTOPUS.smiling}
                style={styles.octopusLarge}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Progress */}
          <Text style={styles.progress}>{sentenceIndex + 1}/{sentences.length} sentences</Text>

          {/* English sentence */}
          <View style={styles.sentenceCard}>
            <Text style={styles.sentenceLabel}>Translate to {effectiveLangLabel}:</Text>
            <Text style={styles.sentenceEnglish}>{currentSentence.sentence_english}</Text>
          </View>

          {/* Input */}
          <View style={styles.inputArea}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.quizInput}
                placeholder="Type the sentence…"
                placeholderTextColor="rgba(62,48,36,0.4)"
                value={sentenceGuess}
                onChangeText={setSentenceGuess}
                onSubmitEditing={handleSentenceSubmit}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSentenceSubmit}
                activeOpacity={0.7}
              >
                <Text style={styles.submitBtnText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // --- GRADING: batch grading in progress ---
  if (phase === 'grading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Animated.View style={{ transform: [{ translateY: octopusBob }] }}>
            <Image source={OCTOPUS.thinking} style={styles.octopusLarge} resizeMode="contain" />
          </Animated.View>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>Grading your answers…</Text>
            <View style={styles.speechTriangleUp} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- FINAL SUMMARY ---
  const avgSentence = grades.length > 0
    ? Math.round(grades.reduce((a, b) => a + b.score, 0) / grades.length * 10) / 10
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.summaryContent}>
        <View style={styles.octopusSection}>
          <Animated.View style={{ transform: [{ translateY: octopusBob }] }}>
            <Image source={getFinalOctopus()} style={styles.octopusLarge} resizeMode="contain" />
          </Animated.View>
        </View>

        <Text style={styles.summaryTitle}>Quiz Complete!</Text>

        <View style={styles.finalScoreCards}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardLabel}>Quick Recall</Text>
            <Text style={styles.scoreCardValue}>{recallScore}/{quizWords.length}</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardLabel}>Sentences</Text>
            <Text style={styles.scoreCardValue}>{avgSentence}/10</Text>
          </View>
        </View>

        {/* Per-sentence breakdown */}
        {grades.length > 0 && (
          <View style={styles.breakdownList}>
            {sentences.map((s, i) => (
              <View key={i} style={styles.breakdownRow}>
                <Text style={[
                  styles.breakdownIcon,
                  { color: (grades[i]?.score ?? 0) >= 7 ? '#2D8F4E' : (grades[i]?.score ?? 0) >= 4 ? '#D9772B' : '#C44D3F' },
                ]}>
                  {grades[i]?.score ?? '–'}/10
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.breakdownWord}>{s.sentence_english}</Text>
                  <Text style={styles.breakdownFeedback}>{grades[i]?.feedback ?? ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Back to Camera</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Empty / loading states
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(62,48,36,0.7)',
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  // Main quiz layout
  quizContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },

  // Octopus + bubble
  octopusSection: {
    alignItems: 'center',
    gap: 4,
  },
  octopusLarge: {
    width: 120,
    height: 120,
  },
  speechBubble: {
    backgroundColor: 'rgba(245,240,235,0.95)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  speechText: {
    fontSize: 14,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
    textAlign: 'center',
    lineHeight: 20,
  },
  speechTriangle: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    left: '45%',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(245,240,235,0.95)',
  },
  speechTriangleUp: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    left: '45%',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(245,240,235,0.95)',
  },

  // Progress
  progress: {
    fontSize: 13,
    color: 'rgba(62,48,36,0.5)',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.3,
  },

  // Word display
  wordDisplay: {
    fontSize: 32,
    color: '#2C241C',
    fontWeight: '700',
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },

  // Input
  inputArea: {
    width: '100%',
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  quizInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(217,119,43,0.24)',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2C241C',
    fontFamily: Fonts.sans,
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#D9772B',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFF9F3',
    fontSize: 20,
    fontWeight: '600',
  },

  // Feedback
  feedbackArea: {
    alignItems: 'center',
    gap: 6,
  },
  correctFeedback: {
    fontSize: 20,
    color: '#2D8F4E',
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },
  incorrectFeedback: {
    fontSize: 20,
    color: '#C44D3F',
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },

  // Sentence phase
  sentenceCard: {
    width: '100%',
    backgroundColor: 'rgba(217,119,43,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.15)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 6,
  },
  sentenceLabel: {
    fontSize: 12,
    color: 'rgba(62,48,36,0.5)',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.3,
  },
  sentenceEnglish: {
    fontSize: 18,
    color: '#2C241C',
    fontFamily: Fonts.sans,
    lineHeight: 26,
  },
  sentenceScore: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Fonts.rounded,
  },
  correctSentence: {
    fontSize: 13,
    color: 'rgba(62,48,36,0.6)',
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 20,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(62,48,36,0.5)',
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },

  // Summary
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 20,
  },
  summaryTitle: {
    fontSize: 26,
    color: '#2C241C',
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },
  summaryScore: {
    fontSize: 22,
    color: '#D9772B',
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },

  // Breakdown
  breakdownList: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245,240,235,0.6)',
    borderRadius: 12,
  },
  breakdownIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
    color: '#D9772B',
    fontWeight: '700',
  },
  breakdownWord: {
    flex: 1,
    fontSize: 15,
    color: '#2C241C',
    fontFamily: Fonts.sans,
  },
  breakdownTarget: {
    fontSize: 15,
    color: '#D9772B',
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  breakdownFeedback: {
    fontSize: 12,
    color: 'rgba(62,48,36,0.55)',
    fontFamily: Fonts.sans,
    lineHeight: 16,
  },

  // Buttons
  continueBtn: {
    backgroundColor: '#D9772B',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 8,
  },
  continueBtnText: {
    color: '#FFF9F3',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.2,
  },
  backBtn: {
    marginTop: 12,
    padding: 8,
  },
  backBtnText: {
    color: '#D9772B',
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },

  // Final summary
  finalScoreCards: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(217,119,43,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.15)',
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
  },
  scoreCardLabel: {
    fontSize: 12,
    color: 'rgba(62,48,36,0.5)',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.3,
  },
  scoreCardValue: {
    fontSize: 24,
    color: '#D9772B',
    fontWeight: '800',
    fontFamily: Fonts.rounded,
  },
});
