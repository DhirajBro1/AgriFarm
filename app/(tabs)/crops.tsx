/**
 * CropsScreen - Modern Minimal + Legacy Richness
 * Focus: Grid Layouts, Badge Styles, Granular Details
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import CSVParser, { CropData } from "../../utils/csvParser";
import { getCurrentNepaliMonth, NEPALI_MONTHS } from "../../utils/farmingData";

const { width } = Dimensions.get('window');

type TabType = 'calendar' | 'library' | 'fertilizer' | 'seeds';
type RegionType = 'high' | 'mid' | 'terai';

export default function CropsScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);

  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentNepaliMonth());
  const [region, setRegion] = useState<RegionType>('mid');

  const [searchQuery, setSearchQuery] = useState("");
  const [csvParser] = useState(() => CSVParser.getInstance());

  const [filteredCrops, setFilteredCrops] = useState<CropData[]>([]);
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserRegion();
    loadData();
  }, [activeTab, selectedMonth, region]);

  const loadUserRegion = async () => {
    const r = await AsyncStorage.getItem("region");
    if (r === 'high' || r === 'mid' || r === 'terai') setRegion(r);
  };

  const loadData = async () => {
    await csvParser.initialize();

    if (activeTab === 'calendar') {
      setFilteredCrops(csvParser.getCropsByMonth(selectedMonth, region));
    } else {
      setFilteredCrops(csvParser.getCropsData());
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [activeTab, selectedMonth, region]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      if (activeTab === 'calendar') setFilteredCrops(csvParser.getCropsByMonth(selectedMonth, region));
      else setFilteredCrops(csvParser.getCropsData());
    } else {
      setFilteredCrops(csvParser.searchCrops(text));
    }
  };

  const getSowingPeriod = (crop: CropData) => {
    if (region === 'high') return crop.highHillSowing;
    if (region === 'terai') return crop.teraiSowing;
    return crop.midHillSowing;
  };

  const renderTabContent = () => {
    if (filteredCrops.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>{t('crops.empty')}</Text>
        </View>
      );
    }

    return filteredCrops.map((crop, i) => {
      const isExpanded = expandedCrop === (crop.crop + i); // Unique ID based on index

      return (
        <TouchableOpacity
          key={i}
          style={styles.card}
          onPress={() => setExpandedCrop(isExpanded ? null : (crop.crop + i))}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: getTabColor(activeTab) + '20' }]}>
              <Ionicons name={getTabIcon(activeTab)} size={24} color={getTabColor(activeTab)} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.cropName}>{crop.crop}</Text>
              <Text style={styles.cropVariety}>{crop.variety}</Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </View>

          {isExpanded && (
            <View style={styles.cardExpanded}>

              {/* Calendar / General: Grid Specs */}
              {activeTab === 'calendar' && (
                <View>
                  <View style={styles.detailGrid}>
                    <DetailItem label={t('crops.details.maturity')} value={`${crop.maturityDays} ${t('crops.details.days')}`} />
                    <DetailItem label={t('crops.details.yield')} value={`${crop.yield} ${t('crops.details.kgPerRopani')}`} />
                  </View>
                  <View style={styles.sowingBadgeContainer}>
                    <Text style={styles.sowingLabel}>{t('crops.sowing.label', { region: t(`regions.${region}.label`) })}</Text>
                    <Text style={styles.sowingValue}>{getSowingPeriod(crop)}</Text>
                  </View>
                </View>
              )}

              {/* Fertilizer: Dense NPK Grid */}
              {activeTab === 'fertilizer' && (
                <View>
                  <Text style={styles.sectionTitle}>{t('crops.fertilizer.title')}</Text>
                  <View style={styles.fertilizerList}>
                    <NutrientRow label={t('crops.fertilizer.nitrogen')} value={crop.nitrogen} color="#EF4444" symbol="N" unit="kg" />
                    <NutrientRow label={t('crops.fertilizer.phosphorus')} value={crop.phosphorus} color="#F59E0B" symbol="P" unit="kg" />
                    <NutrientRow label={t('crops.fertilizer.potassium')} value={crop.potassium} color="#3B82F6" symbol="K" unit="kg" />
                    <NutrientRow label={t('crops.fertilizer.compost')} value={crop.compost} color="#10B981" symbol="Org" unit="ton" />
                  </View>
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksText}>{t('crops.fertilizer.note')} {crop.remarks}</Text>
                  </View>
                </View>
              )}

              {/* Seeds: Rates & Spacing */}
              {activeTab === 'seeds' && (
                <View>
                  <View style={styles.seedRecBox}>
                    <Ionicons name="leaf-outline" size={16} color="#166534" />
                    <Text style={styles.seedRecText}>{t('crops.seeds.recommended')} {crop.seedRate}</Text>
                  </View>
                  <View style={styles.detailGrid}>
                    <DetailItem label={t('crops.details.plantSpacing')} value={`${crop.plantSpacing} ${t('crops.details.cm')}`} />
                    <DetailItem label={t('crops.details.rowSpacing')} value={`${crop.rowSpacing} ${t('crops.details.cm')}`} />
                  </View>
                </View>
              )}

              {/* Library: All Stats */}
              {activeTab === 'library' && (
                <View>
                  <View style={styles.detailGrid}>
                    <DetailItem label={t('crops.details.maturity')} value={`${crop.maturityDays} ${t('crops.details.days')}`} />
                    <DetailItem label={t('crops.details.yield')} value={`${crop.yield} ${t('crops.details.kgPerRopani')}`} />
                    <DetailItem label={t('crops.details.seedRate')} value={crop.seedRate} />
                    {/* pH Display */}
                    {(() => {
                      const phInfo = csvParser.getPHInfo(crop.crop);
                      if (phInfo?.optimalPHRange) {
                        return <DetailItem label={t('crops.details.soilPH')} value={phInfo.optimalPHRange} />;
                      }
                      return null;
                    })()}
                  </View>

                  <Text style={styles.sectionTitleSmall}>{t('crops.sowing.periods')}</Text>
                  <View style={styles.sowingList}>
                    {crop.highHillSowing && <SowingRow region={t('crops.sowing.highHills')} months={crop.highHillSowing} />}
                    {crop.midHillSowing && <SowingRow region={t('crops.sowing.midHills')} months={crop.midHillSowing} />}
                    {crop.teraiSowing && <SowingRow region={t('crops.sowing.terai')} months={crop.teraiSowing} />}
                  </View>

                  <Text style={styles.remarks}>"{crop.remarks}"</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  // Reusable Components matching Legacy style (Grids, Badges)
  const DetailItem = ({ label, value }: { label: string, value: string | number }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  const NutrientRow = ({ label, value, symbol, unit }: any) => (
    <View style={styles.nutrientRow}>
      <Text style={styles.nutrientLabel}>{label} ({symbol})</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={styles.nutrientValue}>{value}</Text>
        <Text style={styles.nutrientUnit}>{unit}</Text>
      </View>
    </View>
  );

  const SowingRow = ({ region, months }: { region: string, months: string }) => (
    <View style={styles.sowingRow}>
      <View style={styles.regionBadge}>
        <Text style={styles.regionBadgeText}>{region}</Text>
      </View>
      <Text style={styles.sowingMonths}>{months}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('crops.title')}</Text>
      </View>

      {/* Fixed Tab Navigation Area - Won't scroll */}
      <View style={styles.navigationContainer}>
        {/* Tab Switcher - Top Priority */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ paddingHorizontal: spacing.l }}>
          {['calendar', 'library', 'fertilizer', 'seeds'].map((t_tab) => (
            <TouchableOpacity
              key={t_tab}
              style={[styles.tab, activeTab === t_tab && { backgroundColor: colors.text }]}
              onPress={() => { setActiveTab(t_tab as TabType); setSearchQuery(""); }}
            >
              <Text style={[styles.tabText, activeTab === t_tab && styles.tabTextActive]}>
                {t(`crops.tabs.${t_tab}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar - Below Tabs */}
        {(activeTab === 'library' || activeTab === 'fertilizer' || activeTab === 'seeds') && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('crops.search.placeholder', { tab: t(`crops.tabs.${activeTab}`) })}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        )}
      </View>

      {/* Scrollable Content Area */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

        {/* Month Selector for Calendar Mode */}
        {activeTab === 'calendar' && (
          <View style={styles.monthScrollContainer}>
            <Text style={styles.helperText}>{t('crops.calendar.helper')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.s }}>
              {NEPALI_MONTHS.map(month => (
                <TouchableOpacity
                  key={month}
                  style={[styles.monthPill, selectedMonth === month && styles.monthPillActive]}
                  onPress={() => setSelectedMonth(month)}
                >
                  <Text style={[styles.monthText, selectedMonth === month && styles.monthTextActive]}>
                    {t(`months.${month.toLowerCase()}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.listContainer}>
          {renderTabContent()}
        </View>

      </ScrollView>
    </View>
  );
}

const getTabColor = (tab: TabType) => {
  switch (tab) {
    case 'calendar': return '#10B981';
    case 'fertilizer': return '#F59E0B';
    case 'seeds': return '#8B5CF6';
    case 'library': return '#3B82F6';
    default: return '#10B981';
  }
};

const getTabIcon = (tab: TabType) => {
  switch (tab) {
    case 'calendar': return 'calendar';
    case 'fertilizer': return 'flask';
    case 'seeds': return 'flower';
    default: return 'leaf';
  }
};


const createStyles = (colors: ThemeColors, typography: any, spacing: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: insets.top + spacing.m,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.s,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tabScroll: {
    maxHeight: 70, // Increased to prevent clipping
    marginBottom: spacing.s,
  },
  tab: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.s,
    height: 40,
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  tabTextActive: {
    color: colors.background,
    fontWeight: 'bold',
  },
  navigationContainer: {
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  monthScrollContainer: {
    marginBottom: spacing.l,
    paddingHorizontal: spacing.l,

  },
  helperText: {
    fontSize: typography.sizes.mobile,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  monthPill: {
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.s,
  },
  monthPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  monthText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.medium,
  },
  monthTextActive: {
    color: colors.background,
  },
  searchContainer: {
    marginHorizontal: spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.s,
    fontSize: typography.sizes.base,
    color: colors.text,
    paddingVertical: spacing.s,
  },
  listContainer: {
    paddingHorizontal: spacing.l,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: spacing.m,
    padding: spacing.m,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  headerText: {
    flex: 1,
  },
  cropName: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cropVariety: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardExpanded: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.cardMuted,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
  },

  // Detail Grid Styles
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  detailItem: {
    backgroundColor: colors.cardMuted,
    padding: spacing.s,
    borderRadius: 12,
    minWidth: '45%',
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },

  // Sowing Styles
  sowingBadgeContainer: {
    backgroundColor: colors.primary + '10', // Light green
    padding: spacing.m,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  sowingLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sowingValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  sowingList: {
    gap: spacing.s,
    marginBottom: spacing.m
  },
  sowingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardMuted,
    padding: 8,
    borderRadius: 8,
  },
  regionBadge: {
    backgroundColor: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: spacing.m,
    minWidth: 80,
    alignItems: 'center',
  },
  regionBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  sowingMonths: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1
  },

  // Fertilizer Grid
  // Fertilizer List Styles
  fertilizerList: {
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardMuted,
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nutrientLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  nutrientUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  // Remarks / Seed Box
  remarksBox: {
    backgroundColor: colors.cardMuted,
    padding: spacing.m,
    borderRadius: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.textSecondary,
  },
  remarksText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.m,
  },
  sectionTitleSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: spacing.s,
    marginTop: spacing.s,
  },
  remarks: {
    marginTop: spacing.m,
    fontStyle: 'italic',
    color: colors.textSecondary,
    fontSize: 13,
  },
  seedRecBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7', // Green-100
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: '#166534', // Green-700
  },
  seedRecText: {
    marginLeft: spacing.s,
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 13,
  }
});
