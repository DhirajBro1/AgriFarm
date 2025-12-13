/**
 * TipsScreen Component - Farming tips and pest/disease information hub
 *
 * Features:
 * - Tips tab: Browse farming tips by category (watering, fertilizer, planting, etc.)
 * - Pests tab: Browse pest and disease information with solutions
 * - Search functionality across all tips and pest data
 * - Category-based filtering for easy navigation
 * - Expandable cards with detailed information
 * - Practical advice for Nepali farming conditions
 */

import { Ionicons } from "@expo/vector-icons";
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
import {
  FARMING_TIPS,
  FarmingTip,
  PEST_DISEASE_DATA,
  PestDiseaseInfo,
} from "../utils/farmingData";

type IoniconsName = keyof typeof Ionicons.glyphMap;
type TipCategory =
  | "watering"
  | "fertilizer"
  | "planting"
  | "harvesting"
  | "general";
type TabType = "tips" | "pests";

export default function TipsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<TabType>("tips");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTips, setFilteredTips] = useState<FarmingTip[]>(FARMING_TIPS);
  const [filteredPests, setFilteredPests] =
    useState<PestDiseaseInfo[]>(PEST_DISEASE_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [expandedPest, setExpandedPest] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "tips") {
      let filtered = FARMING_TIPS;

      if (selectedCategory !== "all") {
        filtered = filtered.filter((tip) => tip.category === selectedCategory);
      }

      if (searchQuery) {
        filtered = filtered.filter(
          (tip) =>
            tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tip.description.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      setFilteredTips(filtered);
    } else {
      let filtered = PEST_DISEASE_DATA;

      if (selectedCategory !== "all") {
        filtered = filtered.filter((item) => item.type === selectedCategory);
      }

      if (searchQuery) {
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.crops.some((crop) =>
              crop.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        );
      }

      setFilteredPests(filtered);
    }
  }, [searchQuery, selectedCategory, activeTab]);

  const renderTipsTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="bulb" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Farming Tips</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          Practical tips to improve your farming success
        </Text>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tips..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.muted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.categorySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              "all",
              "watering",
              "fertilizer",
              "planting",
              "harvesting",
              "general",
            ].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category &&
                      styles.categoryChipTextSelected,
                  ]}
                >
                  {category === "all"
                    ? "All"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredTips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.tipCard,
                item.important && styles.importantTipCard,
              ]}
            >
              <TouchableOpacity
                style={styles.tipHeader}
                onPress={() =>
                  setExpandedTip(expandedTip === item.id ? null : item.id)
                }
              >
                <View style={styles.tipTitleContainer}>
                  <Ionicons
                    name={getCategoryIcon(item.category)}
                    size={18}
                    color={item.important ? "#E74C3C" : colors.primary}
                  />
                  <Text
                    style={[
                      styles.tipTitle,
                      item.important && styles.importantTipTitle,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.important && (
                    <View style={styles.importantBadge}>
                      <Text style={styles.importantBadgeText}>Important</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={expandedTip === item.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>

              {expandedTip === item.id && (
                <View style={styles.tipContent}>
                  <Text style={styles.tipDescription}>{item.description}</Text>
                  <View style={styles.tipMetadata}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(item.category) },
                      ]}
                    >
                      <Text style={styles.categoryBadgeText}>
                        {item.category}
                      </Text>
                    </View>
                    {item.season && (
                      <Text style={styles.seasonText}>
                        Best for: {item.season}
                      </Text>
                    )}
                  </View>
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

  const renderPestsTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="bug" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Pest & Disease Guide</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          Identify and manage common pests and diseases
        </Text>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pests/diseases..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.muted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.categorySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["all", "pest", "disease"].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category &&
                      styles.categoryChipTextSelected,
                  ]}
                >
                  {category === "all"
                    ? "All"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                  s
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredPests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.pestCard,
                item.severity === "high" && styles.highSeverityCard,
              ]}
            >
              <TouchableOpacity
                style={styles.pestHeader}
                onPress={() =>
                  setExpandedPest(expandedPest === item.id ? null : item.id)
                }
              >
                <View style={styles.pestTitleContainer}>
                  <Ionicons
                    name={item.type === "pest" ? "bug" : "medical"}
                    size={18}
                    color={getSeverityColor(item.severity)}
                  />
                  <Text style={styles.pestTitle}>{item.name}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(item.severity) },
                    ]}
                  >
                    <Text style={styles.severityBadgeText}>
                      {item.severity}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={
                    expandedPest === item.id ? "chevron-up" : "chevron-down"
                  }
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>

              {expandedPest === item.id && (
                <View style={styles.pestContent}>
                  <View style={styles.affectedCropsContainer}>
                    <Text style={styles.sectionTitle}>Affected Crops:</Text>
                    <View style={styles.cropsGrid}>
                      {item.crops.map((crop, index) => (
                        <View key={index} style={styles.cropTag}>
                          <Text style={styles.cropTagText}>{crop}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.symptomsContainer}>
                    <Text style={styles.sectionTitle}>Symptoms:</Text>
                    {item.symptoms.map((symptom, index) => (
                      <View key={index} style={styles.listItem}>
                        <Ionicons
                          name="ellipse"
                          size={6}
                          color={colors.primary}
                        />
                        <Text style={styles.listItemText}>{symptom}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.preventionContainer}>
                    <Text style={styles.sectionTitle}>Prevention:</Text>
                    {item.prevention.map((prevention, index) => (
                      <View key={index} style={styles.listItem}>
                        <Ionicons
                          name="shield-checkmark"
                          size={12}
                          color="#27AE60"
                        />
                        <Text style={styles.listItemText}>{prevention}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.treatmentContainer}>
                    <Text style={styles.sectionTitle}>Treatment:</Text>
                    {item.treatment.map((treatment, index) => (
                      <View key={index} style={styles.listItem}>
                        <Ionicons name="medical" size={12} color="#3498DB" />
                        <Text style={styles.listItemText}>{treatment}</Text>
                      </View>
                    ))}
                  </View>
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

  const getCategoryIcon = (category: string): IoniconsName => {
    const icons: Record<TipCategory, IoniconsName> = {
      watering: "water",
      fertilizer: "nutrition",
      planting: "leaf",
      harvesting: "cut",
      general: "information-circle",
    };
    return icons[category as TipCategory] || "information-circle";
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      watering: "#3498DB",
      fertilizer: "#8B4513",
      planting: "#27AE60",
      harvesting: "#F39C12",
      general: "#9B59B6",
    };
    return categoryColors[category] || "#95A5A6";
  };

  const getSeverityColor = (severity: string) => {
    const severityColors: { [key: string]: string } = {
      low: "#27AE60",
      medium: "#F39C12",
      high: "#E74C3C",
    };
    return severityColors[severity] || "#95A5A6";
  };

  const tabs: {
    key: TabType;
    label: string;
    icon: IoniconsName;
  }[] = [
    { key: "tips" as TabType, label: "Farming Tips", icon: "bulb" },
    { key: "pests" as TabType, label: "Pests & Diseases", icon: "bug" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="bulb" size={20} color="#fff" />
            <Text style={styles.headerTitle}>Tips & Guidance</Text>
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
                setSelectedCategory("all");
                setExpandedTip(null);
                setExpandedPest(null);
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
        {activeTab === "tips" && renderTipsTab()}
        {activeTab === "pests" && renderPestsTab()}
      </View>

      <BottomNav active="tips" />
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
      marginBottom: 80,
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
    categorySelector: {
      marginBottom: 14,
    },
    categoryChip: {
      backgroundColor: colors.cardMuted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
    },
    categoryChipTextSelected: {
      color: "#fff",
    },
    tipCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    importantTipCard: {
      borderLeftWidth: 3,
      borderLeftColor: "#E74C3C",
      backgroundColor: "#FEF5F5",
    },
    tipHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
    },
    tipTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    tipTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
      flex: 1,
    },
    importantTipTitle: {
      color: "#C0392B",
    },
    importantBadge: {
      backgroundColor: "#E74C3C",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 6,
    },
    importantBadgeText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#fff",
    },
    tipContent: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    tipDescription: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
      marginBottom: 10,
    },
    tipMetadata: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
    },
    categoryBadge: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 10,
      marginRight: 6,
      marginBottom: 3,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#fff",
    },
    seasonText: {
      fontSize: 11,
      color: colors.muted,
      fontStyle: "italic",
    },
    pestCard: {
      backgroundColor: colors.cardMuted,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    highSeverityCard: {
      borderLeftWidth: 3,
      borderLeftColor: "#E74C3C",
    },
    pestHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
    },
    pestTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    pestTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 6,
      flex: 1,
    },
    severityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 6,
    },
    severityBadgeText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#fff",
    },
    pestContent: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    affectedCropsContainer: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    cropsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    cropTag: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 10,
    },
    cropTagText: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.primary,
    },
    symptomsContainer: {
      marginBottom: 12,
    },
    preventionContainer: {
      marginBottom: 12,
    },
    treatmentContainer: {
      marginBottom: 6,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 6,
      paddingRight: 12,
    },
    listItemText: {
      fontSize: 12,
      color: colors.text,
      lineHeight: 16,
      marginLeft: 6,
      flex: 1,
    },
  });
