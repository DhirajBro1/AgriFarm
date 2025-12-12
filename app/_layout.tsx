import { Stack } from 'expo-router';
import { ThemeProvider } from '../theme/ThemeProvider';

export default function Layout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ThemeProvider>
  );
}