import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const RETICLE = 220;

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  // Reticle corner animations
  const cornerFade = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(0)).current;
  const scanOpacity = useRef(new Animated.Value(0.6)).current;
  const statusPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in corners
    Animated.timing(cornerFade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Scan line loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scan line opacity flicker
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scanOpacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Status dot pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, {
          toValue: 1.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(statusPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scanLineY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RETICLE - 2],
  });

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
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>
          LangLens uses your camera to detect objects and teach you vocabulary.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Access</Text>
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

      {/* Dark vignette overlay */}
      <View style={styles.vignette} pointerEvents="none" />

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
            <Text style={styles.topTitle}>LANGLENS</Text>
          </View>

          {/* Status indicator */}
          <View style={styles.statusBadge}>
            <Animated.View
              style={[
                styles.statusDot,
                { transform: [{ scale: statusPulse }] },
              ]}
            />
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        </View>

        {/* Center reticle */}
        <Animated.View style={[styles.reticleWrapper, { opacity: cornerFade }]}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: scanLineY }],
                opacity: scanOpacity,
              },
            ]}
          />

          {/* Center crosshair dot */}
          <View style={styles.crosshair} />
        </Animated.View>

        {/* Bottom instruction */}
        <View style={styles.bottomBar}>
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Point at any object to detect & translate
            </Text>
          </View>
          <Text style={styles.chineseHint}>对准物体开始识别</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORNER_LENGTH = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#060810',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  permText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  permButton: {
    marginTop: 8,
    backgroundColor: '#4DAAFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  permButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  backLink: {
    marginTop: 4,
    padding: 8,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
  },

  // Camera UI
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Simulate vignette with semi-transparent edges
    borderWidth: 80,
    borderColor: 'rgba(0,0,0,0.45)',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
  topCenter: {
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4DFFAA',
    shadowColor: '#4DFFAA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusText: {
    color: '#4DFFAA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
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
    borderColor: '#4DAAFF',
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#4DAAFF',
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#4DAAFF',
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#4DAAFF',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1.5,
    backgroundColor: '#4DAAFF',
    shadowColor: '#4DAAFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  crosshair: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(77, 170, 255, 0.8)',
    shadowColor: '#4DAAFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  // Bottom bar
  bottomBar: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  hintBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  hintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  chineseHint: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
  },
});
