import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '@/constants/theme';

export default function QuizScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>✏️</Text>
        <Text style={styles.title}>Quiz Mode</Text>
        <Text style={styles.subtitle}>
          Coming soon! Test your vocabulary with interactive quizzes.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(62,48,36,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Fonts.sans,
    maxWidth: 280,
  },
  backButton: {
    marginTop: 12,
    padding: 8,
  },
  backText: {
    color: '#D9772B',
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
});
