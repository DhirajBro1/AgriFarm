import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  card: string;
  cardMuted: string;
  primary: string;
  primaryMuted: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  navBackground: string;
  navActive: string;
};

type ThemeContextValue = {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'theme-preference';

const palette: Record<ThemeMode, ThemeColors> = {
  light: {
    background: '#f9fafb',
    card: '#ffffff',
    cardMuted: '#f3f4f6',
    primary: '#16a34a',
    primaryMuted: '#dcfce7',
    text: '#111827',
    muted: '#6b7280',
    border: '#e5e7eb',
    accent: '#f0fdf4',
    navBackground: '#ffffff',
    navActive: '#16a34a',
  },
  dark: {
    background: '#0f172a',
    card: '#111827',
    cardMuted: '#1f2937',
    primary: '#22c55e',
    primaryMuted: '#064e3b',
    text: '#e5e7eb',
    muted: '#94a3b8',
    border: '#1f2937',
    accent: '#0d1b2a',
    navBackground: '#0b1220',
    navActive: '#22c55e',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme);
        }
      } catch (error) {
        console.warn('Failed to load theme preference', error);
      }
    };
    loadTheme();
  }, []);

  const persistTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference', error);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      persistTheme(next);
      return next;
    });
  };

  const handleSetTheme = (mode: ThemeMode) => {
    setTheme(mode);
    persistTheme(mode);
  };

  const value = useMemo(
    () => ({
      theme,
      colors: palette[theme],
      toggleTheme,
      setTheme: handleSetTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

