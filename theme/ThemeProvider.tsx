/**
 * ThemeProvider - Manages app-wide theming with light/dark mode support
 *
 * Features:
 * - Dynamic light/dark theme switching
 * - Persistent theme preference storage
 * - System theme detection and following
 * - Comprehensive color palette for farming app UI
 * - Context-based theme access throughout the app
 * - Smooth theme transitions
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Theme mode options
export type ThemeMode = "light" | "dark";

/**
 * Complete color palette interface for the AgriFarm app
 * Includes all colors needed for a comprehensive farming app UI
 */
export type ThemeColors = {
  background: string; // Main app background color
  card: string; // Card and container background color
  cardMuted: string; // Muted card background for less prominent content
  surface: string; // Surface color for elevated components
  primary: string; // Primary brand color (agricultural green)
  primaryMuted: string; // Muted primary color for backgrounds
  text: string; // Primary text color
  muted: string; // Secondary/muted text color
  border: string; // Border color for separators and outlines
  accent: string; // Accent color for highlights
  navBackground: string; // Navigation bar background
  navActive: string; // Active navigation item color
};

/**
 * Theme context value interface
 * Provides theme state and control functions
 */
type ThemeContextValue = {
  theme: ThemeMode; // Current theme mode
  colors: ThemeColors; // Current color palette
  toggleTheme: () => void; // Function to toggle between light/dark
  setTheme: (mode: ThemeMode) => void; // Function to set specific theme
};

// React context for theme management
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// AsyncStorage key for persisting theme preference
const STORAGE_KEY = "theme-preference";

/**
 * Color palettes for light and dark themes
 * Carefully designed for agricultural app with nature-inspired colors
 */
const palette: Record<ThemeMode, ThemeColors> = {
  light: {
    background: "#f9fafb", // Light gray background
    card: "#ffffff", // Pure white for cards
    cardMuted: "#f3f4f6", // Light gray for muted cards
    surface: "#f8fafc", // Slightly off-white surface
    primary: "#16a34a", // Agricultural green
    primaryMuted: "#dcfce7", // Light green background
    text: "#111827", // Dark gray for text
    muted: "#6b7280", // Medium gray for secondary text
    border: "#e5e7eb", // Light gray borders
    accent: "#f0fdf4", // Very light green accent
    navBackground: "#ffffff",
    navActive: "#16a34a",
  },
  dark: {
    background: "#0f172a",
    card: "#111827",
    cardMuted: "#1f2937",
    surface: "#1e293b",
    primary: "#22c55e",
    primaryMuted: "#064e3b",
    text: "#e5e7eb",
    muted: "#94a3b8",
    border: "#1f2937",
    accent: "#0d1b2a",
    navBackground: "#0b1220",
    navActive: "#22c55e",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState<ThemeMode>(
    systemScheme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = (await AsyncStorage.getItem(
          STORAGE_KEY,
        )) as ThemeMode | null;
        if (storedTheme === "light" || storedTheme === "dark") {
          setTheme(storedTheme);
        }
      } catch (error) {
        console.warn("Failed to load theme preference", error);
      }
    };
    loadTheme();
  }, []);

  const persistTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn("Failed to save theme preference", error);
    }
  };

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      persistTheme(next);
      return next;
    });
  }, []);

  const handleSetTheme = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    persistTheme(mode);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      colors: palette[theme],
      toggleTheme,
      setTheme: handleSetTheme,
    }),
    [theme, toggleTheme, handleSetTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
