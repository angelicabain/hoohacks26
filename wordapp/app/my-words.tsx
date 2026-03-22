import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Fonts } from '@/constants/theme';
import { useWords } from '@/contexts/WordsContext';

export default function MyWordsScreen() {
  const router = useRouter();
  const { words } = useWords();

  const handleExport = async () => {
    if (words.length === 0) {
      Alert.alert('No words yet', 'Learn some words with the camera first!');
      return;
    }
    const tsvText = words.map((w) => `${w.english}\t${w.target}`).join('\n');
    await Clipboard.setStringAsync(tsvText);
    Alert.alert(
      'Copied!',
      'Open Quizlet \u2192 Create Set \u2192 Import \u2192 paste your words',
      [
        {
          text: 'Open Quizlet',
          onPress: () => Linking.openURL('https://quizlet.com/create-set'),
        },
        { text: 'Done', style: 'cancel' },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>&larr; Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Words</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Count */}
      <Text style={styles.count}>
        {words.length} {words.length === 1 ? 'word' : 'words'} collected
      </Text>

      {/* Word list */}
      {words.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No words yet</Text>
          <Text style={styles.emptySubtitle}>
            Point your camera at objects to start building your word list.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {words.map((w, i) => (
            <View key={i} style={styles.wordRow}>
              <Text style={styles.wordEnglish}>{w.english}</Text>
              <Text style={styles.wordTarget}>{w.target}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Sticky export button */}
      {words.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            activeOpacity={0.8}
          >
            <Text style={styles.exportBtnText}>Export to Quizlet</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 16,
    color: '#D9772B',
    fontFamily: Fonts.rounded,
    width: 60,
  },
  title: {
    fontSize: 22,
    color: '#2C241C',
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },
  count: {
    fontSize: 14,
    color: 'rgba(62,48,36,0.6)',
    fontFamily: Fonts.rounded,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(62,48,36,0.6)',
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,119,43,0.12)',
  },
  wordEnglish: {
    fontSize: 16,
    color: '#2C241C',
    fontFamily: Fonts.sans,
    flex: 1,
  },
  wordTarget: {
    fontSize: 16,
    color: '#D9772B',
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217,119,43,0.12)',
  },
  exportBtn: {
    backgroundColor: '#D9772B',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#FFF9F3',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.2,
  },
});
