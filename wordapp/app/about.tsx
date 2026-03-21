import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '@/constants/theme';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Fluency</Text>
        <Text style={styles.tagline}>learn by looking</Text>

        <View style={styles.section}>
          <Text style={styles.body}>
            Fluency helps you build real-world vocabulary by pointing your phone
            camera at everyday objects. The app detects what you see, translates
            it into your target language, and lets you hear the pronunciation.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supported Languages</Text>
          <Text style={styles.body}>
            Spanish, French, Portuguese, Mandarin, Japanese, Korean
          </Text>
        </View>

        <Text style={styles.version}>v1.0.0</Text>

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
    gap: 12,
  },
  logo: {
    fontSize: 42,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
  },
  tagline: {
    fontSize: 16,
    color: '#3A8F8A',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.4,
    marginBottom: 20,
  },
  section: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    color: 'rgba(62,48,36,0.75)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Fonts.sans,
    maxWidth: 300,
  },
  version: {
    fontSize: 12,
    color: 'rgba(62,48,36,0.4)',
    fontFamily: Fonts.mono,
    marginTop: 16,
  },
  backButton: {
    marginTop: 12,
    padding: 8,
  },
  backText: {
    color: '#3A8F8A',
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
});
