import { Stack } from 'expo-router';
import React from 'react';
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
  const segments = useSegments();
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  // 🔁 OTA UPDATE CHECK (runs once on app start)
  useEffect(() => {
    async function checkForOTA() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log('OTA update error:', e);
      }
    }

    checkForOTA();
  }, []);
  useEffect(() => {
    // Only check once when the app first loads
    if (!hasChecked) {
      checkOnboarding();
    }
  }, [hasChecked]);

  const checkOnboarding = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      const username = await AsyncStorage.getItem('username');
      const region = await AsyncStorage.getItem('region');

      console.log('=== Onboarding Check ===');
      console.log('Onboarding complete:', onboardingComplete);
      console.log('Username:', username);
      console.log('Region:', region);
      console.log('Current segment:', segments[0]);
      console.log('=======================');

      // If onboarding not complete, go to welcome
      if (!onboardingComplete) {
        console.log('Redirecting to welcome screen');
        router.replace('/welcome');
      } else {
        console.log('Onboarding complete, staying on current route');
        // If onboarding is complete, ensure we're on a valid route
        // Only redirect if we're somehow stuck on welcome
        if (segments[0] === 'welcome') {
          console.log('On welcome but onboarding complete, redirecting to tabs');
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsChecking(false);
      setHasChecked(true);
    }
  };

  if (isChecking) {
    return null; // Or return a loading screen
  }

  return <>{children}</>;
}