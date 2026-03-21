import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.tint,
      background: Colors.light.background,
      card: '#FFFFFF',
      text: Colors.light.text,
      border: 'rgba(217,119,43,0.18)',
      notification: Colors.light.tint,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="quiz" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="about" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="howto" options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
