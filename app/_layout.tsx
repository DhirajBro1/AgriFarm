import { Stack } from 'expo-router';
import React from 'react';
import '../i18n/i18n'; // Initialize i18n
import { ThemeProvider } from '../theme/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="disease-detection" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}