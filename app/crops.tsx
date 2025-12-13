/**
 * CropsScreen Component - Browse and search crops by season, category, and region
 *
 * Features:
 * - Calendar view: Browse crops by Nepali months
 * - Library view: Browse all crops with search functionality
 * - Fertilizer view: Browse crops by fertilizer requirements
 * - Seeds view: Browse crops by seed information
 * - Region-based filtering (High Hills, Mid Hills, Terai)
 * - Detailed crop information with expandable cards
 * - Search functionality across all crop data
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { ThemeColors, useTheme } from "../theme/ThemeProvider";
import CSVParser, { CropData } from "../utils/csvParser";
import { getCurrentNepaliMonth, NEPALI_MONTHS } from "../utils/farmingData";

type IoniconsName = keyof typeof Ionicons.glyphMap;
type TabType = "calendar" | "library" | "fertilizer" | "seeds";

export default function CropsScreen() {
  // Theme and styling
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Navigation and view state
  const [activeTab, setActiveTab] = useState<TabType>("calendar"); // Current tab selection
  const [selectedMonth, setSelectedMonth] = useState(getCurrentNepaliMonth()); // Selected Nepali month
  const [searchQuery, setSearchQuery] = useState(""); // Search input text
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null); // Currently expanded crop card

  // Data management
  const [csvParser] = useState(() => CSVParser.getInstance()); // Singleton CSV parser instance
  const [cropsData, setCropsData] = useState<CropData[]>([]); // All crops data
  const [filteredCrops, setFilteredCrops] = useState<CropData[]>([]); // Filtered crops based on current view
  const [region, setRegion] = useState<"high" | "mid" | "terai">("mid"); // User's farming region

  /**
   * Initialize CSV data parser and load crop database
   * Loads user's region from storage and sets initial filtered crops
   */
  const initializeDataCallback = React.useCallback(async () => {
    try {
      await csvParser.initialize();
      const storedRegion = (await AsyncStorage.getItem("region")) || "mid";
      setRegion(storedRegion as "high" | "mid" | "terai");
      setCropsData(csvParser.getCropsData());

      // Load crops for current month and region
      const monthCrops = csvParser.getCropsByMonth(
        selectedMonth,
        storedRegion as "high" | "mid" | "terai",
      );
      setFilteredCrops(monthCrops);
    } catch (error) {
      console.error("Error initializing crop data:", error);
    }
  }, [csvParser, selectedMonth]);

  useEffect(() => {
    initializeDataCallback();
  }, [initializeDataCallback]);

  useEffect(() => {
    if (activeTab === "calendar") {
      const monthCrops = csvParser.getCropsByMonth(selectedMonth, region);
      setFilteredCrops(monthCrops);
    } else if (activeTab === "library") {
      const searchResults = searchQuery
        ? csvParser.searchCrops(searchQuery)
        : csvParser.getCropsData();
      setFilteredCrops(searchResults);
    } else {
      setFilteredCrops(csvParser.getCropsData());
    }
  }, [selectedMonth, searchQuery, activeTab, region, csvParser]);

  const renderCalendarTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Crop Calendar</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          Best planting times for{" "}
          {region === "high"
            ? "High Hills"
            : region === "mid"
              ? "Mid Hills"
              : "Terai Plains"}
        </Text>

        <View style={styles.monthGrid}>
          {NEPALI_MONTHS.map((month) => (
            <TouchableOpacity
              key={month}
              style={[
                styles.monthButton,
                selectedMonth === month && styles.monthButtonSelected,
              ]}
              onPress={() => setSelectedMonth(month)}
            >
              <Text
                style={[
                  styles.monthButtonText,
                  selectedMonth === month && styles.monthButtonTextSelected,
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cropsSection}>
          <View style={styles.cropsHeader}>
            <Ionicons name="leaf" size={18} color={colors.primary} />
            <Text style={styles.cropsTitle}>
              Recommended for {selectedMonth} ({filteredCrops.length} crops)
            </Text>
          </View>

          {filteredCrops.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={40} color={colors.muted} />
              <Text style={styles.emptyText}>
                No crops recommended for this month in {region} hill region
              </Text>
            </View>
          ) : (
            <View style={styles.cropsGrid}>
              {filteredCrops.map((crop, index) => (
                <TouchableOpacity
                  key={`${crop.crop}-${crop.variety}-${index}`}
                  style={styles.cropCard}
                  onPress={() => {
                    setExpandedCrop(
                      expandedCrop === `${crop.crop}-${crop.variety}`
                        ? null
                        : `${crop.crop}-${crop.variety}`,
                    );
                  }}
                >
                  <View style={styles.cropCardHeader}>
                    <Ionicons name="leaf" size={16} color={colors.primary} />
                    <Text style={styles.cropName}>{crop.crop}</Text>
                  </View>
                  <Text style={styles.cropVariety}>{crop.variety}</Text>
                  {crop.remarks && (
                    <Text style={styles.cropRemarks}>{crop.remarks}</Text>
                  )}

                  {expandedCrop === `${crop.crop}-${crop.variety}` && (
                    <View style={styles.expandedInfo}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Seed Rate:</Text>
                        <Text style={styles.infoValue}>{crop.seedRate}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Maturity:</Text>
                        <Text style={styles.infoValue}>
                          {crop.maturityDays} days
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Expected Yield:</Text>
                        <Text style={styles.infoValue}>
                          {crop.yield} kg/ropani
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderLibraryTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="library" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Crop Information Library</Text>
        </View>

        {/* Search functionality */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color={colors.muted} />
            <TextInput
              style={styles.textInput}
              placeholder="Search crops, varieties, fertilizer..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredCrops}
          keyExtractor={(item, index) =>
            `${item.crop}-${item.variety}-${index}`
          }
          renderItem={({ item }) => (
            <View style={styles.cropDetailCard}>
              <View style={styles.cropDetailHeader}>
                <View style={styles.cropDetailTitle}>
                  <Ionicons name="leaf" size={18} color={colors.primary} />
                  <Text style={styles.cropDetailName}>{item.crop}</Text>
                </View>
                <Text style={styles.cropDetailVariety}>{item.variety}</Text>
              </View>

              <View style={styles.cropDetailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Plant Spacing</Text>
                  <Text style={styles.detailValue}>{item.plantSpacing} cm</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Row Spacing</Text>
                  <Text style={styles.detailValue}>{item.rowSpacing} cm</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Seed Rate</Text>
                  <Text style={styles.detailValue}>{item.seedRate}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Maturity</Text>
                  <Text style={styles.detailValue}>
                    {item.maturityDays} days
                  </Text>
                </View>
              </View>

              <View style={styles.sowingInfo}>
                <Text style={styles.sowingTitle}>Planting Seasons:</Text>
                <View style={styles.sowingGrid}>
                  {item.highHillSowing && (
                    <View style={styles.sowingItem}>
                      <Text style={styles.sowingRegion}>High Hill:</Text>
                      <Text style={styles.sowingPeriod}>
                        {item.highHillSowing}
                      </Text>
                    </View>
                  )}
                  {item.midHillSowing && (
                    <View style={styles.sowingItem}>
                      <Text style={styles.sowingRegion}>Mid Hill:</Text>
                      <Text style={styles.sowingPeriod}>
                        {item.midHillSowing}
                      </Text>
                    </View>
                  )}
                  {item.teraiSowing && (
                    <View style={styles.sowingItem}>
                      <Text style={styles.sowingRegion}>Terai:</Text>
                      <Text style={styles.sowingPeriod}>
                        {item.teraiSowing}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {item.remarks && (
                <View style={styles.remarksContainer}>
                  <Text style={styles.remarksText}>{item.remarks}</Text>
                </View>
              )}
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderFertilizerTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="nutrition" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Fertilizer Guide</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          NPK requirements per Ropani (508 sq.m)
        </Text>

        <FlatList
          data={cropsData.slice(0, 15)}
          keyExtractor={(item, index) =>
            `fert-${item.crop}-${item.variety}-${index}`
          }
          renderItem={({ item }) => (
            <View style={styles.fertilizerCard}>
              <View style={styles.fertilizerHeader}>
                <Text style={styles.fertilizerCrop}>{item.crop}</Text>
                <Text style={styles.fertilizerVariety}>{item.variety}</Text>
              </View>

              <View style={styles.fertilizerGrid}>
                <View style={styles.fertilizerItem}>
                  <View
                    style={[
                      styles.fertilizerIcon,
                      { backgroundColor: "#8B4513" },
                    ]}
                  >
                    <Ionicons name="leaf" size={14} color="#fff" />
                  </View>
                  <Text style={styles.fertilizerLabel}>Compost</Text>
                  <Text style={styles.fertilizerValue}>{item.compost} kg</Text>
                </View>

                <View style={styles.fertilizerItem}>
                  <View
                    style={[
                      styles.fertilizerIcon,
                      { backgroundColor: "#4A90E2" },
                    ]}
                  >
                    <Text style={styles.fertilizerSymbol}>N</Text>
                  </View>
                  <Text style={styles.fertilizerLabel}>Nitrogen</Text>
                  <Text style={styles.fertilizerValue}>{item.nitrogen} kg</Text>
                </View>

                <View style={styles.fertilizerItem}>
                  <View
                    style={[
                      styles.fertilizerIcon,
                      { backgroundColor: "#E74C3C" },
                    ]}
                  >
                    <Text style={styles.fertilizerSymbol}>P</Text>
                  </View>
                  <Text style={styles.fertilizerLabel}>Phosphorus</Text>
                  <Text style={styles.fertilizerValue}>
                    {item.phosphorus} kg
                  </Text>
                </View>

                <View style={styles.fertilizerItem}>
                  <View
                    style={[
                      styles.fertilizerIcon,
                      { backgroundColor: "#27AE60" },
                    ]}
                  >
                    <Text style={styles.fertilizerSymbol}>K</Text>
                  </View>
                  <Text style={styles.fertilizerLabel}>Potassium</Text>
                  <Text style={styles.fertilizerValue}>
                    {item.potassium} kg
                  </Text>
                </View>
              </View>

              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={14} color="#F39C12" />
                <Text style={styles.warningText}>
                  Apply fertilizer 2-3 days before rain. Avoid application
                  during windy conditions.
                </Text>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );

  const renderSeedsTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="leaf" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Seed Selection Guide</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          Choose the right seeds for better yield
        </Text>

        <FlatList
          data={cropsData}
          keyExtractor={(item, index) =>
            `seed-${item.crop}-${item.variety}-${index}`
          }
          renderItem={({ item }) => (
            <View style={styles.seedCard}>
              <View style={styles.seedHeader}>
                <View style={styles.seedTitleContainer}>
                  <Ionicons name="leaf" size={16} color={colors.primary} />
                  <Text style={styles.seedCrop}>{item.crop}</Text>
                </View>
                <View
                  style={[
                    styles.seedTypeBadge,
                    {
                      backgroundColor:
                        item.variety === "Local" ? "#95A5A6" : "#27AE60",
                    },
                  ]}
                >
                  <Text style={styles.seedTypeText}>
                    {item.variety === "Local" ? "Local" : "Improved"}
                  </Text>
                </View>
              </View>

              <Text style={styles.seedVariety}>{item.variety}</Text>

              <View style={styles.seedDetails}>
                <View style={styles.seedDetailItem}>
                  <Ionicons name="archive" size={14} color={colors.primary} />
                  <Text style={styles.seedDetailText}>
                    Rate: {item.seedRate}
                  </Text>
                </View>
                <View style={styles.seedDetailItem}>
                  <Ionicons name="time" size={14} color={colors.primary} />
                  <Text style={styles.seedDetailText}>
                    Maturity: {item.maturityDays} days
                  </Text>
                </View>
                <View style={styles.seedDetailItem}>
                  <Ionicons
                    name="trending-up"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.seedDetailText}>
                    Yield: {item.yield} kg/ropani
                  </Text>
                </View>
              </View>

              {item.remarks && (
                <View style={styles.seedRecommendation}>
                  <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
                  <Text style={styles.seedRecommendationText}>
                    {item.remarks}
                  </Text>
                </View>
              )}
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const tabs: {
    key: TabType;
    label: string;
    icon: IoniconsName;
  }[] = [
    { key: "calendar" as TabType, label: "Calendar", icon: "calendar" },
    { key: "library" as TabType, label: "Library", icon: "library" },
    { key: "fertilizer" as TabType, label: "Fertilizer", icon: "nutrition" },
    { key: "seeds" as TabType, label: "Seeds", icon: "leaf" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="leaf" size={20} color="#fff" />
            <Text style={styles.headerTitle}>Crop Management</Text>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.headerLocation}>
              {region === "high"
                ? "High Hills"
                : region === "mid"
                  ? "Mid Hills"
                  : "Terai Plains"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
              onPress={() => {
                setActiveTab(tab.key);
                setSearchQuery("");
                setExpandedCrop(null);
              }}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {activeTab === "calendar" && renderCalendarTab()}
        {activeTab === "library" && renderLibraryTab()}
        {activeTab === "fertilizer" && renderFertilizerTab()}
        {activeTab === "seeds" && renderSeedsTab()}
      </View>

      <BottomNav active="crops" />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      paddingTop: 44,
      paddingBottom: 8,
      paddingHorizontal: 16,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
      marginLeft: 6,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerLocation: {
      fontSize: 11,
      color: "rgba(255,255,255,0.8)",
      marginLeft: 3,
    },
    tabsContainer: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabsScrollContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    tabButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: colors.cardMuted,
    },
    tabButtonActive: {
      backgroundColor: colors.primaryMuted,
    },
    tabText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.muted,
      marginLeft: 4,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
    tabContent: {
      flex: 1,
      padding: 12,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    bottomSpacing: {
      height: 100,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      marginBottom: 90,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 14,
    },
    monthGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 16,
    },
    monthButton: {
      backgroundColor: colors.cardMuted,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 6,
      minWidth: "30%",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    monthButtonText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: "600",
    },
    monthButtonTextSelected: {
      color: "#fff",
    },
    cropsSection: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cropsHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    cropsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
    },
    cropsGrid: {
      gap: 10,
    },
    cropCard: {
      backgroundColor: colors.card,
      padding: 10,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cropCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 3,
    },
    cropName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
    },
    cropVariety: {
      fontSize: 11,
      color: colors.muted,
      marginBottom: 3,
    },
    cropRemarks: {
      fontSize: 10,
      color: colors.muted,
      fontStyle: "italic",
    },
    expandedInfo: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    infoLabel: {
      fontSize: 11,
      color: colors.muted,
    },
    infoValue: {
      fontSize: 11,
      color: colors.text,
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 30,
    },
    emptyText: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 8,
      textAlign: "center",
    },
    searchContainer: {
      marginBottom: 12,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardMuted,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      marginLeft: 6,
      marginRight: 6,
    },
    cropDetailCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cropDetailHeader: {
      marginBottom: 10,
    },
    cropDetailTitle: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 3,
    },
    cropDetailName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
    },
    cropDetailVariety: {
      fontSize: 12,
      color: colors.muted,
    },
    cropDetailGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 10,
    },
    detailItem: {
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      minWidth: "45%",
      alignItems: "center",
    },
    detailLabel: {
      fontSize: 10,
      color: colors.muted,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    sowingInfo: {
      marginBottom: 8,
    },
    sowingTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    sowingGrid: {
      gap: 6,
    },
    sowingItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
    },
    sowingRegion: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
      minWidth: 60,
    },
    sowingPeriod: {
      fontSize: 11,
      color: colors.text,
      flex: 1,
    },
    remarksContainer: {
      backgroundColor: colors.primaryMuted,
      padding: 8,
      borderRadius: 6,
      borderLeftWidth: 2,
      borderLeftColor: colors.primary,
    },
    remarksText: {
      fontSize: 11,
      color: colors.text,
      fontStyle: "italic",
    },
    fertilizerCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fertilizerHeader: {
      marginBottom: 10,
    },
    fertilizerCrop: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    fertilizerVariety: {
      fontSize: 12,
      color: colors.muted,
    },
    fertilizerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 10,
    },
    fertilizerItem: {
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: "center",
      minWidth: "45%",
    },
    fertilizerIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 4,
    },
    fertilizerSymbol: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#fff",
    },
    fertilizerLabel: {
      fontSize: 10,
      color: colors.muted,
      marginBottom: 2,
    },
    fertilizerValue: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    warningContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FEF3CD",
      padding: 8,
      borderRadius: 6,
      borderLeftWidth: 2,
      borderLeftColor: "#F39C12",
    },
    warningText: {
      fontSize: 11,
      color: "#8B4513",
      marginLeft: 6,
      flex: 1,
    },
    seedCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    seedHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    seedTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    seedCrop: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
    },
    seedTypeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    seedTypeText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#fff",
    },
    seedVariety: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 8,
    },
    seedDetails: {
      gap: 4,
      marginBottom: 8,
    },
    seedDetailItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    seedDetailText: {
      fontSize: 11,
      color: colors.text,
      marginLeft: 6,
    },
    seedRecommendation: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E8F5E8",
      padding: 8,
      borderRadius: 6,
      borderLeftWidth: 2,
      borderLeftColor: "#27AE60",
    },
    seedRecommendationText: {
      fontSize: 11,
      color: "#2D6A2D",
      marginLeft: 6,
      flex: 1,
      fontStyle: "italic",
    },
  });
