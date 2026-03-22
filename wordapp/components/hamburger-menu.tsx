import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Fonts } from '@/constants/theme';

const { height } = Dimensions.get('window');
const PANEL_WIDTH = 280;

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const TOP_MENU_ITEMS = [
  { label: 'Home', icon: '🏠', route: '/' },
  { label: 'Quiz Mode', icon: '✏️', route: '/quiz' },
  { label: 'My Words', icon: '📋', route: '/my-words' },
] as const;

const BOTTOM_MENU_ITEMS = [
  { label: 'About', icon: 'ℹ️', route: '/about' },
  { label: 'How To', icon: '📖', route: '/howto' },
] as const;

export default function HamburgerMenu({ visible, onClose }: HamburgerMenuProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -PANEL_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 220);
  };


  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.panelContent}>
          <View>

            {/* App title */}
            <Text style={styles.panelTitle}>Fluency</Text>

            {/* Top menu items */}
            <View style={styles.menuList}>
              {TOP_MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom menu items */}
          <View style={[styles.menuList, { marginBottom: 40 }]}>
            {BOTTOM_MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}


const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panelContent: {
    flex: 1,
    justifyContent: 'space-between', // keeps top items at top, bottom items at bottom
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: PANEL_WIDTH,
    height,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeText: {
    fontSize: 18,
    color: 'rgba(62,48,36,0.6)',
  },
  panelTitle: {
    fontSize: 28,
    color: '#2C241C',
    fontFamily: Fonts.serif,
    marginBottom: 32,
  },
  menuList: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,119,43,0.14)',
    gap: 14,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: 16,
    color: '#2C241C',
    fontFamily: Fonts.rounded,
    letterSpacing: 0.2,
  },
});
