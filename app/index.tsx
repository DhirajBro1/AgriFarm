/**
 * HomeScreen Component - Main dashboard for the AgriFarm app
 *
 * Features:
 * - First-time user setup (username and farming region selection)
 * - Monthly crop recommendations based on user's region
 * - Quick access to main app features (crops, tips, tools)
 * - Crop statistics and seasonal information
 * - Responsive design for different screen sizes
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import BottomNav from "../components/BottomNav";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useTheme } from "../theme/ThemeProvider";
import CSVParser, { CropData } from "../utils/csvParser";
import { getCurrentNepaliMonth } from "../utils/farmingData";

// Get device width for responsive design
const { width } = Dimensions.get("window");

export default function HomeScreen() {
  // Navigation and theme hooks
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // User setup and loading states
  const [isFirstTime, setIsFirstTime] = useState(true); // Track if user needs initial setup
  const [isLoading, setIsLoading] = useState(true); // Loading state for data initialization

  // User data
  const [username, setUsername] = useState(""); // User's name for personalization
  const [region, setRegion] = useState(""); // User's farming region (high/mid/terai)
  const [currentMonth, setCurrentMonth] = useState(""); // Current Nepali month

  // Data management
  const [csvParser] = useState(() => CSVParser.getInstance()); // Singleton CSV parser instance
  const [monthCrops, setMonthCrops] = useState<CropData[]>([]); // Crops suitable for current month
  const [totalCrops, setTotalCrops] = useState(0); // Total number of crops in database

  /**
   * Initialize CSV data parser and load crop database
   * This callback loads all farming data from CSV files
   */
  const initializeDataCallback = React.useCallback(async () => {
    try {
      await csvParser.initialize();
      const allCrops = csvParser.getAllCrops();
      setTotalCrops(allCrops.length);
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  }, [csvParser]);

  // Initialize app data and check if user is new
  useEffect(() => {
    checkFirstTime();
    initializeDataCallback();
  }, [initializeDataCallback]);

  // Load monthly crop recommendations when region or month changes
  useEffect(() => {
    if (region && currentMonth) {
      const crops = csvParser.getCropsByMonth(
        currentMonth,
        region as "high" | "mid" | "terai",
      );
      setMonthCrops(crops.slice(0, 6)); // Show top 6 crops for dashboard preview
    }
  }, [region, currentMonth, csvParser]);

  /**
   * Check if this is user's first time using the app
   * Loads stored user data (username and region) from AsyncStorage
   */
  const checkFirstTime = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      const storedRegion = await AsyncStorage.getItem("region");

      // If user data exists, load it and proceed to main dashboard
      if (storedUsername && storedRegion) {
        setUsername(storedUsername);
        setRegion(storedRegion);
        setCurrentMonth(getCurrentNepaliMonth());
        setIsFirstTime(false);
      } else {
        // New user - show setup screen
        setIsFirstTime(true);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setIsFirstTime(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle user setup completion
   * Validates input, saves user data, and transitions to main dashboard
   */
  const handleSetup = async () => {
    // Validate required fields
    if (!username.trim() || !region) {
      Alert.alert(
        "Missing Information",
        "Please enter your name and select your farming region to continue.",
      );
      return;
    }

    try {
      // Save user data to persistent storage
      await AsyncStorage.setItem("username", username.trim());
      await AsyncStorage.setItem("region", region);
      setCurrentMonth(getCurrentNepaliMonth());
      setIsFirstTime(false);

      // Load crop data for the user's region
      await initializeDataCallback();
    } catch (error) {
      console.error("Error saving data:", error);
      Alert.alert(
        "Setup Error",
        "Failed to save your information. Please try again.",
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="leaf" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Loading AgriFarm...</Text>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View
              style={[styles.dot, { backgroundColor: colors.primaryMuted }]}
            />
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>
    );
  }

  if (isFirstTime) {
    return (
      <View style={styles.container}>
        <View style={styles.setupHeader}>
          <View style={styles.setupHeaderContent}>
            <Ionicons name="leaf" size={24} color="#fff" />
            <Text style={styles.setupHeaderTitle}>AgriFarm</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.setupContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.setupCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="leaf" size={50} color={colors.primary} />
            </View>

            <Text style={styles.title}>Welcome to AgriFarm</Text>
            <Text style={styles.subtitle}>
              Let&apos;s set up your farming profile
            </Text>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person" size={18} color={colors.text} />
                <Text style={styles.label}>Your Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your name"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location" size={18} color={colors.text} />
                <Text style={styles.label}>Farming Region</Text>
              </View>

              <View style={styles.regionGrid}>
                {[
                  {
                    key: "high",
                    label: "High Hills (Above 2000m)",
                    desc: "Cool climate, high altitude crops",
                  },
                  {
                    key: "mid",
                    label: "Mid Hills (600-2000m)",
                    desc: "Moderate climate, diverse crops",
                  },
                  {
                    key: "terai",
                    label: "Terai Plains (Below 600m)",
                    desc: "Warm climate, rice, wheat crops",
                  },
                ].map((regionOption) => (
                  <TouchableOpacity
                    key={regionOption.key}
                    style={[
                      styles.regionButton,
                      region === regionOption.key &&
                        styles.regionButtonSelected,
                    ]}
                    onPress={() => setRegion(regionOption.key)}
                  >
                    <Text
                      style={[
                        styles.regionButtonText,
                        region === regionOption.key &&
                          styles.regionButtonTextSelected,
                      ]}
                    >
                      {regionOption.label}
                    </Text>
                    <Text
                      style={[
                        styles.regionButtonDesc,
                        region === regionOption.key &&
                          styles.regionButtonDescSelected,
                      ]}
                    >
                      {regionOption.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.setupButton,
                (!username.trim() || !region) && styles.setupButtonDisabled,
              ]}
              onPress={handleSetup}
              disabled={!username.trim() || !region}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-forward" size={18} color="#fff" />
              <Text style={styles.setupButtonText}>Complete Setup</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Main dashboard view for returning users
  return (
    <View style={styles.container}>
      {/* App header with user info */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Ionicons name="leaf" size={28} color="#FFFFFF" />
            <Text style={styles.headerTitle}>AgriFarm</Text>
          </View>
          {/* Profile button */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/account")}
          >
            <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {/* Welcome message and location */}
        <View style={styles.headerBottom}>
          <Text style={styles.welcomeText}>Welcome back, {username}!</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#FFFFFF" />
            <Text style={styles.locationText}>
              {region === "high"
                ? "High Hills"
                : region === "mid"
                  ? "Mid Hills"
                  : "Terai"}{" "}
              Region
            </Text>
          </View>
        </View>
      </View>

      {/* Main scrollable content area */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Current month summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.summaryTitle}>Current Month</Text>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{currentMonth}</Text>
            </View>
          </View>
          <Text style={styles.summarySubtitle}>
            {monthCrops.length} crops suitable for planting this month
          </Text>
        </View>

        {/* Statistics cards showing crop counts and region info */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="leaf" size={24} color="#27AE60" />
            <Text style={styles.statNumber}>{totalCrops}</Text>
            <Text style={styles.statLabel}>Total Crops</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#3498DB" />
            <Text style={styles.statNumber}>{monthCrops.length}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="location" size={24} color="#9B59B6" />
            <Text style={styles.statNumber}>
              {region === "high" ? "High" : region === "mid" ? "Mid" : "Terai"}
            </Text>
            <Text style={styles.statLabel}>Region</Text>
          </View>
        </View>

        {/* Monthly crop recommendations card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flower" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Recommended for {currentMonth}</Text>
            <TouchableOpacity
              onPress={() => router.push("/crops")}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Show empty state if no crops found, otherwise show crop grid */}
          {monthCrops.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={32} color={colors.muted} />
              <Text style={styles.emptyText}>
                No crops recommended for this month in your region
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/crops")}
              >
                <Text style={styles.emptyButtonText}>Explore All Crops</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cropsGrid}>
              {monthCrops.map((crop, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.cropCard}
                  onPress={() => router.push("/crops")}
                  activeOpacity={0.7}
                >
                  <View style={styles.cropIcon}>
                    <Ionicons name="leaf" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.cropName}>{crop.crop}</Text>
                  <Text style={styles.cropVariety}>{crop.variety}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick actions card with navigation shortcuts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActionsContainer}>
            <View style={styles.actionsRow}>
              {/* Navigate to crop calendar */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/crops")}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons name="leaf" size={28} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>Crop Calendar</Text>
                <Text style={styles.actionDesc}>
                  Find best crops for your region
                </Text>
              </TouchableOpacity>

              {/* Navigate to farming tools */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/tools")}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#3498DB15" }]}
                >
                  <Ionicons name="calculator" size={28} color="#3498DB" />
                </View>
                <Text style={styles.actionLabel}>Calculators</Text>
                <Text style={styles.actionDesc}>Yield & fertilizer tools</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/tips")}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#F39C1215" }]}
                >
                  <Ionicons name="bulb" size={28} color="#F39C12" />
                </View>
                <Text style={styles.actionLabel}>Expert Tips</Text>
                <Text style={styles.actionDesc}>Proven farming advice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/disease-detection" as any)}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#E74C3C15" }]}
                >
                  <Ionicons name="camera" size={28} color="#E74C3C" />
                </View>
                <Text style={styles.actionLabel}>Disease Detection</Text>
                <Text style={styles.actionDesc}>AI-powered plant analysis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNav active="home" />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingContent: {
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.muted,
      fontWeight: "500",
    },
    loadingDots: {
      flexDirection: "row",
      marginTop: 16,
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    setupHeader: {
      backgroundColor: colors.primary,
      paddingTop: 44,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    setupHeaderContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    setupHeaderTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#fff",
      marginLeft: 8,
    },
    setupContainer: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
    },
    setupCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 32,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    iconContainer: {
      width: 80,
      height: 80,
      backgroundColor: colors.primaryMuted,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.muted,
      textAlign: "center",
      marginBottom: 32,
    },
    inputGroup: {
      marginBottom: 24,
    },
    labelContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 8,
    },
    input: {
      backgroundColor: colors.cardMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    regionGrid: {
      gap: 12,
    },
    regionButton: {
      backgroundColor: colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    regionButtonSelected: {
      backgroundColor: colors.primary + "10",
      borderColor: colors.primary,
    },
    regionButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 4,
    },
    regionButtonTextSelected: {
      color: colors.primary,
    },
    regionButtonDesc: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
    },
    regionButtonDescSelected: {
      color: colors.primary + "CC",
    },
    setupButton: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
    },
    setupButtonDisabled: {
      backgroundColor: colors.cardMuted,
    },
    setupButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    header: {
      backgroundColor: colors.primary,
      paddingTop: 44,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#fff",
      marginLeft: 6,
    },
    profileButton: {
      padding: 4,
    },
    headerBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    welcomeText: {
      fontSize: 14,
      color: "rgba(255,255,255,0.9)",
      fontWeight: "500",
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    locationText: {
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
      marginLeft: 4,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
    },

    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    monthBadge: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    monthBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    summarySubtitle: {
      fontSize: 14,
      color: colors.muted,
    },
    statsContainer: {
      flexDirection: "row",
      marginTop: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    viewAllText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "500",
      marginRight: 4,
    },
    cropsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    cropCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 10,
      padding: 12,
      alignItems: "center",
      width: (width - 64) / 3, // 3 items per row with gaps
      borderWidth: 1,
      borderColor: colors.border,
    },
    cropIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryMuted,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    cropName: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
      marginBottom: 2,
    },
    cropVariety: {
      fontSize: 10,
      color: colors.muted,
      textAlign: "center",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      marginVertical: 12,
      lineHeight: 20,
    },
    emptyButton: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    emptyButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "500",
    },
    quickActionsContainer: {
      gap: 16,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 16,
    },
    actionButton: {
      flex: 1,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
      marginBottom: 4,
    },
    actionDesc: {
      fontSize: 11,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 14,
    },
    bottomSpacing: {
      height: 120, // Adequate space for bottom navigation with safe area
    },
  });
