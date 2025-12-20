/**
 * ThemeProvider - Modern Minimal Design System
 * Focus: Cleanliness, Whitespace, Readability
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, TextStyle } from "react-native";

export type ThemeMode = "light" | "dark";

export const Typography = {
  sizes: {
    mobile: 14,
    base: 16,     // Standard readable size
    large: 20,    // Subheaders
    header: 28,   // Section headers
    display: 32,  // Hero/Page Titles
  },
  weights: {
    regular: "400" as TextStyle["fontWeight"],
    medium: "500" as TextStyle["fontWeight"],
    bold: "600" as TextStyle["fontWeight"], // Slightly lighter bold for elegance
    heavy: "800" as TextStyle["fontWeight"],
  },
  lineHeights: {
    base: 24,
    header: 34,
  }
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  screenPadding: 24, // Generous padding
};

export type ThemeColors = {
  background: string;
  card: string;
  cardMuted: string;
  surface: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  navBackground: string;
  navActive: string;
  navInactive: string;
  shadow: string; // New shadow color
};

type ThemeContextValue = {
  theme: ThemeMode;
  colors: ThemeColors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "theme-preference";

const palette: Record<ThemeMode, ThemeColors> = {
  light: {
    background: "#FAFAFA",      // Off-white, soft on eyes
    card: "#FFFFFF",            // Pure white
    cardMuted: "#F5F5F5",
    surface: "#FFFFFF",
    primary: "#10B981",         // Vibrant but clean Emerald
    primaryDark: "#047857",
    primaryLight: "#ECFDF5",    // Very light mint
    text: "#171717",            // Soft Black
    textSecondary: "#737373",   // Neutral Gray
    border: "#E5E5E5",          // Subtle border
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    navBackground: "#FFFFFF",
    navActive: "#10B981",
    navInactive: "#A3A3A3",
    shadow: "#000000",
  },
  dark: {
    background: "#000000",      // Pure Black (OLED friendly) or deep gray
    card: "#171717",            // Dark Gray
    cardMuted: "#262626",
    surface: "#171717",
    primary: "#34D399",
    primaryDark: "#10B981",
    primaryLight: "#064E3B",
    text: "#FAFAFA",
    textSecondary: "#A3A3A3",
    border: "#262626",
    error: "#EF4444",
    success: "#10B981",
    warning: "#FBBF24",
    navBackground: "#000000",
    navActive: "#34D399",
    navInactive: "#525252",
    shadow: "#000000",
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState<ThemeMode>(
    systemScheme === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEY) as ThemeMode | null;
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

  const value = useMemo(() => ({
    theme,
    colors: palette[theme],
    typography: Typography,
    spacing: Spacing,
    toggleTheme,
    setTheme: handleSetTheme,
  }), [theme, toggleTheme, handleSetTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
