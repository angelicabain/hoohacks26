import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '@/constants/theme';

const RETICLE = 220;

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const styles = createStyles();

  // Reticle corner animations
  const cornerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in corners
    Animated.timing(cornerFade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  // Animation refs are intentionally stable for a single mount lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      <SafeAreaView style={styles.safeArea}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Fluency</Text>
          </View>

          <View style={styles.topSpacer} />
        </View>

        {/* Center reticle */}
        <Animated.View style={[styles.reticleWrapper, { opacity: cornerFade }]}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Center crosshair dot */}
          <View style={styles.crosshair} />
        </Animated.View>

        {/* Bottom instruction */}
        <View style={styles.bottomBar}>
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Point at any object to detect and translate
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORNER_LENGTH = 22;
const CORNER_THICKNESS = 3;

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
    fontFamily: Fonts.rounded,
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
    backgroundColor: '#3A8F8A',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  permButtonText: {
    color: '#FFF9F3',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
    fontFamily: Fonts.rounded,
  },
  backLink: {
    marginTop: 4,
    padding: 8,
  },
  backLinkText: {
    color: 'rgba(62,48,36,0.64)',
    fontSize: 14,
    fontFamily: Fonts.rounded,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(58,143,138,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#2C241C',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
  topCenter: {
    alignItems: 'center',
  },
  topSpacer: {
    width: 40,
    height: 40,
  },
  topTitle: {
    fontSize: 24,
    color: '#2C241C',
    letterSpacing: 0.1,
    fontFamily: Fonts.rounded,
  },
  // Reticle
  reticleWrapper: {
    width: RETICLE,
    height: RETICLE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LENGTH,
    height: CORNER_LENGTH,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#3A8F8A',
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#3A8F8A',
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#3A8F8A',
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#3A8F8A',
  },
  crosshair: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(58,143,138,0.82)',
    shadowColor: '#3A8F8A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },

  // Bottom bar
  bottomBar: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  hintBox: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(58,143,138,0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  hintText: {
    color: 'rgba(62,48,36,0.78)',
    fontSize: 12,
    letterSpacing: 0.2,
    textAlign: 'center',
    fontFamily: Fonts.rounded,
  },
});
