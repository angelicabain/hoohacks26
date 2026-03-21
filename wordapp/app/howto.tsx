import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '@/constants/theme';

const STEPS = [
  { num: '1', text: 'Select your target language on the home screen' },
  { num: '2', text: 'Tap "Start Learning" to open the camera' },
  { num: '3', text: 'Point your camera at everyday objects' },
  { num: '4', text: 'The app automatically detects and translates what it sees' },
  { num: '5', text: 'Tap "Reveal" to see the translation' },
  { num: '6', text: 'Use the speaker icon to hear the pronunciation' },
  { num: '7', text: 'Tap "Check" to test yourself by typing the translation' },
];

export default function HowToScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How To Use</Text>

        <View style={styles.steps}>
          {STEPS.map((step) => (
            <View key={step.num} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

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
    padding: 32,
    paddingTop: 48,
    gap: 24,
  },
  title: {
    fontSize: 28,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },
  steps: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(58,143,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNum: {
    fontSize: 13,
    color: '#3A8F8A',
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(62,48,36,0.8)',
    lineHeight: 22,
    fontFamily: Fonts.sans,
    paddingTop: 3,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 12,
    padding: 8,
  },
  backText: {
    color: '#3A8F8A',
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
});
