import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { type DetectResult } from '@/services/api';

export default function WordsScreen() {
  const router = useRouter();
  const { words, langLabel } = useLocalSearchParams<{
    words?: string;
    langLabel?: string;
  }>();

  const effectiveLangLabel = langLabel ?? 'Target Language';

  const learnedWords: DetectResult[] = useMemo(() => {
    if (!words) return [];
    try {
      return JSON.parse(words);
    } catch {
      return [];
    }
  }, [words]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Learned Words</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{learnedWords.length}</Text>
        </View>
      </View>

      {learnedWords.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No words yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan objects in camera mode to build your word list.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {learnedWords.map((word, index) => (
            <View key={`${word.english}-${index}`} style={styles.wordRow}>
              <View style={styles.wordCol}>
                <Text style={styles.englishLabel}>English</Text>
                <Text style={styles.englishWord}>{word.english}</Text>
              </View>
              <View style={styles.wordCol}>
                <Text style={styles.targetLabel}>{effectiveLangLabel}</Text>
                <Text style={styles.targetWord}>{word.target}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDFB',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 15,
    color: '#B65E1C',
    fontFamily: Fonts.sans,
  },
  title: {
    fontSize: 22,
    color: '#2C241C',
    fontFamily: Fonts.serif,
  },
  countPill: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,119,43,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.24)',
  },
  countText: {
    fontSize: 15,
    color: '#D9772B',
    fontFamily: Fonts.rounded,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 22,
    color: '#2C241C',
    fontFamily: Fonts.serif,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(62,48,36,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Fonts.sans,
  },
  listContent: {
    paddingBottom: 28,
    gap: 10,
  },
  wordRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(217,119,43,0.18)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  wordCol: {
    flex: 1,
    gap: 4,
  },
  englishLabel: {
    fontSize: 11,
    color: 'rgba(62,48,36,0.5)',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.25,
  },
  targetLabel: {
    fontSize: 11,
    color: 'rgba(62,48,36,0.5)',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.25,
    textAlign: 'right',
  },
  englishWord: {
    fontSize: 19,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
  },
  targetWord: {
    fontSize: 19,
    color: '#D9772B',
    fontFamily: Fonts.rounded,
    textAlign: 'right',
  },
});
