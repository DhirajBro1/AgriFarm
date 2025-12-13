/**
 * BottomNav Component - Navigation bar for the AgriFarm app
 *
 * Features:
 * - Five main navigation sections: Home, Crops, Tools, Tips, Account
 * - Active state highlighting with different icons and colors
 * - Safe area inset handling for devices with notches/home indicators
 * - Theme-aware styling with dynamic colors
 * - Smooth navigation between screens using Expo Router
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors, useTheme } from "../theme/ThemeProvider";

// Type for available Ionicons names
type IoniconsName = keyof typeof Ionicons.glyphMap;

// Navigation keys matching the app's main screens
type NavKey = "home" | "crops" | "tools" | "tips" | "account";

// Component props interface
type Props = {
  active: NavKey; // Currently active navigation item
};

export default function BottomNav({ active }: Props) {
  // Hooks for navigation, theme, and safe area handling
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // Handle device safe areas (notches, home indicators)
  const styles = createStyles(colors);

  /**
   * Handle navigation to different screens
   * Uses Expo Router for smooth transitions between app sections
   */
  const handleNavigate = (target: NavKey) => {
    switch (target) {
      case "home":
        router.push("/"); // Navigate to home/dashboard
        break;
      case "crops":
        router.push("/crops"); // Navigate to crops browser
        break;
      case "tools":
        router.push("/tools"); // Navigate to farming tools
        break;
      case "tips":
        router.push("/tips"); // Navigate to farming tips
        break;
      case "account":
        router.push("/account"); // Navigate to user account
        break;
    }
  };

  // Navigation items configuration with icons and labels
  const navItems: {
    key: NavKey;
    icon: IoniconsName; // Icon for inactive state
    activeIcon: IoniconsName; // Icon for active state
    label: string; // Display label
  }[] = [
    {
      key: "home" as NavKey,
      icon: "home-outline",
      activeIcon: "home",
      label: "Home",
    },
    {
      key: "crops" as NavKey,
      icon: "leaf-outline",
      activeIcon: "leaf",
      label: "Crops",
    },
    {
      key: "tools" as NavKey,
      icon: "construct-outline",
      activeIcon: "construct",
      label: "Tools",
    },
    {
      key: "tips" as NavKey,
      icon: "bulb-outline",
      activeIcon: "bulb",
      label: "Tips",
    },
    {
      key: "account" as NavKey,
      icon: "person-outline",
      activeIcon: "person",
      label: "Account",
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom - 10, 2) },
      ]}
    >
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = active === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navButton}
              onPress={() => handleNavigate(item.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                ]}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={isActive ? 20 : 18}
                  color={isActive ? colors.primary : colors.muted}
                />
              </View>
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.navBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      elevation: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    bottomNav: {
      flexDirection: "row",
      backgroundColor: colors.navBackground,
      paddingHorizontal: 8,
      paddingTop: 12,
      paddingBottom: 8,
    },
    navButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 12,
    },
    iconContainer: {
      padding: 8,
      borderRadius: 12,
      marginBottom: 4,
    },
    iconContainerActive: {
      backgroundColor: `${colors.primary}15`,
    },
    navText: {
      fontSize: 10,
      color: colors.muted,
      fontWeight: "500",
      textAlign: "center",
    },
    navTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
  });
