import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import '../i18n/i18n'; // Initialize i18n
import { ThemeProvider } from '../theme/ThemeProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});
  
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AnimatedSplashScreen>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="disease-detection" options={{ headerShown: false }} />
          </Stack>
        </AnimatedSplashScreen>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
