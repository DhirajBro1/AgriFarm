/**
 * Home Screen - Modern Minimal with Integrated Onboarding
 * Focus: Access to Core Features + First-Time Setup
 */


import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import CSVParser, { CropData } from "../../utils/csvParser";
import { getCurrentNepaliMonth, REGIONS, RegionType } from "../../utils/farmingData";
import AgriBot from "../../components/AgriBot";
import GeminiDiseaseService from "../../services/geminiDiseaseService";
import { Image } from "react-native";


export default function HomeScreen() {
  const { colors, typography, spacing, theme, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  const [username, setUsername] = useState("Farmer");
  const [seasonalCrops, setSeasonalCrops] = useState<CropData[]>([]);
  const currentMonth = useMemo(() => getCurrentNepaliMonth(), []);

  // Onboarding Modal State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingRegion, setOnboardingRegion] = useState<RegionType>("mid");
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    title: string;
    recommendations: string[];
    tips: string[];
  } | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    checkFirstTime();
    loadData();
    loadRecommendations();
  }, [i18n.language]);

  const checkFirstTime = async () => {
    const isFirstTime = await AsyncStorage.getItem("onboardingComplete");
    if (!isFirstTime) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    if (!onboardingName.trim()) {
      Alert.alert(t('home.onboarding.nameRequired'), t('home.onboarding.nameRequiredMessage'));
      return;
    }

    try {
      await AsyncStorage.setItem("username", onboardingName.trim());
      await AsyncStorage.setItem("region", onboardingRegion);
      await AsyncStorage.setItem("onboardingComplete", "true");

      setUsername(onboardingName.trim());
      setShowOnboarding(false);

      // Reload data with new region
      loadData();
    } catch (error) {
      Alert.alert(t('home.onboarding.error'), t('home.onboarding.errorMessage'));
    }
  };

  const loadData = async () => {
    const name = await AsyncStorage.getItem("username");
    if (name) setUsername(name);

    // Load Seasonal Crops from local CSV
    try {
      const parser = CSVParser.getInstance();
      await parser.initialize();

      const region = (await AsyncStorage.getItem("region")) as 'high' | 'mid' | 'terai' || 'mid';
      const crops = parser.getCropsByMonth(currentMonth, region);

      const unique = Array.from(new Set(crops.map(c => c.crop)))
        .map(name => crops.find(c => c.crop === name))
        .filter((c): c is CropData => !!c)
        .slice(0, 3);

      setSeasonalCrops(unique);
    } catch (error) {
      console.error('❌ Failed to load seasonal crops from CSV:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const loadRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const region = (await AsyncStorage.getItem("region")) as 'high' | 'mid' | 'terai' || 'mid';
      const lang = i18n.language.startsWith('ne') ? 'ne' : 'en';

      const regionNames = {
        high: 'High Hills',
        mid: 'Mid Hills',
        terai: 'Terai'
      };

      const regionName = regionNames[region] || 'Mid Hills';
      const recs = await GeminiDiseaseService.getHomeRecommendations(regionName, currentMonth, lang as 'en' | 'ne');
      setRecommendations(recs);
    } catch (error) {
      console.error('❌ Failed to load recommendations:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const getCropIcon = (cropName: string) => {
    const name = cropName.toLowerCase();
    if (name.includes('wheat')) return require('../../assets/images/crops/wheat.png');
    if (name.includes('rice')) return require('../../assets/images/crops/rice.png');
    if (name.includes('corn') || name.includes('maize')) return require('../../assets/images/crops/corn.png');
    if (name.includes('potato')) return require('../../assets/images/crops/potato.png');
    if (name.includes('tomato')) return require('../../assets/images/crops/tomato.png');
    if (name.includes('cabbage')) return require('../../assets/images/crops/cabbage.png');
    if (name.includes('cauliflower')) return require('../../assets/images/crops/cauliflower.jpeg');
    if (name.includes('onion')) return require('../../assets/images/crops/onion.png');
    if (name.includes('lentil') || name.includes('dal')) return require('../../assets/images/crops/lentil.png');
    if (name.includes('mustard')) return require('../../assets/images/crops/mustard.png');
    if (name.includes('sunflower')) return require('../../assets/images/crops/sunflower.png');
    if (name.includes('brinjal')) return require('../../assets/images/crops/brinjal.png');
    if (name.includes('chilli')) return require('../../assets/images/crops/chilli.png');
    if (name.includes('cucurbits')) return require('../../assets/images/crops/cucurbits.png');
    if (name.includes('garlic')) return require('../../assets/images/crops/garlic.png');
    if (name.includes('lady')) return require('../../assets/images/crops/lady.png');
    if (name.includes('okra')) return require('../../assets/images/crops/okra.png');
    if (name.includes('bottle')) return require('../../assets/images/crops/bottle_gourd.png');
    if (name.includes('chickpea')) return require('../../assets/images/crops/chickpeas.png');
   
    return require('../../assets/images/icon.png');
  };

  const features = [
    {
      id: "crops",
      title: t('home.features.crops.title'),
      subtitle: t('home.features.crops.subtitle'),
      icon: "leaf",
      color: "#10B981",
      route: "/crops",
    },
    {
      id: "tools",
      title: t('home.features.tools.title'),
      subtitle: t('home.features.tools.subtitle'),
      icon: "construct",
      color: "#3B82F6",
      route: "/tools",
    },
    {
      id: "tips",
      title: t('home.features.tips.title'),
      subtitle: t('home.features.tips.subtitle'),
      icon: "bulb",
      color: "#F59E0B",
      route: "/tips",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t(`home.greeting.${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}`)},</Text>
          <Text style={styles.username}>{username}</Text>
        </View>
        <Link href="/account" asChild>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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

        {/* Hero: AI Scanner */}
        <TouchableOpacity
          style={[styles.scanCard, { backgroundColor: isDark ? '#1F2937' : '#22C55E' }]}
          onPress={() => router.push("/disease-detection")}
          activeOpacity={0.9}
        >
          <View style={styles.scanContent}>
            <View style={styles.scanBadge}>
              <Ionicons name="sparkles" size={12} color="#FBBF24" />
              <Text style={styles.scanBadgeText}>{t('home.hero.badge')}</Text>
            </View>
            <Text style={[styles.scanTitle, { color: '#FFF' }]}>{t('home.hero.title')}</Text>
            <Text style={[styles.scanSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>
              {t('home.hero.subtitle')}
            </Text>
          </View>
          <Ionicons name="scan-circle" size={64} color="#FFF" />
        </TouchableOpacity>

        {/* Feature Grid */}
        <Text style={styles.sectionTitle}>{t('home.sections.essentials')}</Text>
        <View style={styles.grid}>
          {features.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.featureCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Seasonal Recommendations Widget (Local CSV) */}
        <TouchableOpacity
          style={styles.widgetCard}
          onPress={() => router.push({ pathname: "/(tabs)/crops", params: { tab: 'calendar' } })}
        >
          <View style={styles.widgetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.widgetTitle}>{t('home.seasonal.title', { month: t(`months.${currentMonth.toLowerCase()}`) })}</Text>
              <Text style={styles.widgetSub}>{t('home.seasonal.subtitle')}</Text>
            </View>
            <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
          </View>

          {seasonalCrops.length > 0 ? (
            <View style={styles.cropList}>
              {seasonalCrops.map((crop, index) => (
                <View key={index} style={styles.cropTag}>
                  <Ionicons name="leaf" size={12} color={colors.primary} />
                  <Text style={styles.cropTagText}>{crop.crop}</Text>
                </View>
              ))}
              <Text style={styles.moreText}>{t('home.seasonal.more')}</Text>
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
              {t('home.seasonal.checkCalendar')}
            </Text>
          )}
        </TouchableOpacity>


        {/* Recommended Crops Section */}
        {recommendations && (
          <View style={styles.cropsSection}>
            <View style={styles.cropsHeader}>
              <Ionicons name="leaf" size={24} color="#10B981" />
              <Text style={styles.cropsTitle}>{recommendations.title}</Text>
            </View>

            <View style={styles.cropsGrid}>
              {recommendations.recommendations.map((rec, index) => {
                let cropName = rec.split(' - ')[0] || rec.split(': ')[0] || rec;
                cropName = cropName.replace(/\*\*/g, '').replace(/\*/g, '').trim();
                const mainCropName = cropName.split('(')[0].trim();
                const reason = rec.split(' - ')[1] || rec.split(': ')[1] || t('home.seasonal.more');

                return (
                  <View key={index} style={styles.cropCard}>
                    <View style={styles.cropIcon}>
                      <Image source={getCropIcon(mainCropName)} style={styles.cropIconImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.cropName}>{mainCropName}</Text>
                    <Text style={styles.cropReason}>{reason}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* AI Tips Section */}
        {recommendations && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsBadge}>
                <Ionicons name="bulb" size={16} color="#F59E0B" />
                <Text style={styles.tipsBadgeText}>{t('home.features.tips.title')}</Text>
              </View>
            </View>

            <View style={styles.tipsContent}>
              {recommendations.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipBullet}>
                    <Text style={styles.tipBulletText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {recommendationsLoading && (
          <View style={styles.recommendationsCard}>
            <View style={styles.loadingIndicator}>
              <View style={styles.loadingDot} />
              <View style={[styles.loadingDot, { opacity: 0.4 }]} />
              <View style={[styles.loadingDot, { opacity: 0.2 }]} />
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AgriBot />

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} animationType="slide" transparent={false}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.onboardingContent}>

            {/* Hero */}
            <View style={styles.onboardingHero}>
              <View style={styles.onboardingIconCircle}>
                <Ionicons name="leaf" size={48} color="#FFF" />
              </View>
              <Text style={styles.onboardingTitle}>{t('home.onboarding.title')}</Text>
              <Text style={styles.onboardingSubtitle}>{t('home.onboarding.subtitle')}</Text>
            </View>

            {/* Form */}
            <View style={styles.onboardingForm}>
              <Text style={styles.formLabel}>{t('home.onboarding.nameLabel')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('home.onboarding.namePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={onboardingName}
                onChangeText={setOnboardingName}
                autoFocus
              />

              {/* Language Selection */}
              <Text style={[styles.formLabel, { marginTop: spacing.l }]}>{t('home.onboarding.selectLanguage')}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.m }}>
                {['en', 'ne'].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.regionCard,
                      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.m },
                      i18n.language === lang && styles.regionCardActive
                    ]}
                    onPress={() => i18n.changeLanguage(lang)}
                  >
                    <Text style={[
                      styles.regionCardTitle,
                      i18n.language === lang && styles.regionCardTitleActive
                    ]}>
                      {t(`common.languages.${lang}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Theme Selection */}
              <Text style={[styles.formLabel, { marginTop: spacing.l }]}>{t('home.onboarding.selectTheme')}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.m }}>
                {(['light', 'dark'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.regionCard,
                      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.m },
                      theme === mode && styles.regionCardActive
                    ]}
                    onPress={() => setTheme(mode)}
                  >
                    <Ionicons
                      name={mode === 'light' ? 'sunny' : 'moon'}
                      size={24}
                      color={theme === mode ? colors.primary : colors.textSecondary}
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={[
                      styles.regionCardTitle,
                      theme === mode && styles.regionCardTitleActive
                    ]}>
                      {t(`common.themes.${mode}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.formLabel, { marginTop: spacing.l }]}>{t('home.onboarding.regionLabel')}</Text>
              <Text style={styles.formHelper}>{t('home.onboarding.regionHelper')}</Text>

              <View style={styles.regionGrid}>
                {REGIONS.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.regionCard,
                      onboardingRegion === r.key && styles.regionCardActive
                    ]}
                    onPress={() => setOnboardingRegion(r.key)}
                  >
                    <Text style={[
                      styles.regionCardTitle,
                      onboardingRegion === r.key && styles.regionCardTitleActive
                    ]}>
                      {t(`regions.${r.key}.label`)}
                    </Text>
                    <Text style={[
                      styles.regionCardDesc,
                      onboardingRegion === r.key && styles.regionCardDescActive
                    ]}>
                      {t(`regions.${r.key}.description`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.onboardingButton} onPress={handleOnboardingComplete}>
                <Text style={styles.onboardingButtonText}>{t('home.onboarding.getStarted')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: any, spacing: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingTop: insets.top + spacing.m,
    paddingBottom: spacing.l,
  },
  greeting: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
  username: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
  },
  scanCard: {
    borderRadius: 24,
    padding: spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  scanContent: {
    flex: 1,
    marginRight: spacing.m,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.m,
  },
  scanBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  scanTitle: {
    fontSize: typography.sizes.header,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  scanSubtitle: {
    fontSize: typography.sizes.base,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.m,
    marginLeft: spacing.xs,
  },
  grid: {
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  featureCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  featureSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  widgetCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  widgetSub: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  cropList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  cropTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropTagText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  moreText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Onboarding Modal Styles
  onboardingContent: {
    paddingTop: insets.top + spacing.xxl,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl + insets.bottom,
  },
  onboardingHero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  onboardingIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  onboardingSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
  onboardingForm: {},
  formLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.s,
  },
  formHelper: {
    fontSize: typography.sizes.mobile,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  formInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  regionGrid: {
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  regionCard: {
    backgroundColor: colors.card,
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  regionCardActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  regionCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  regionCardTitleActive: {
    color: colors.primary,
  },
  regionCardDesc: {
    fontSize: typography.sizes.mobile,
    color: colors.textSecondary,
  },
  regionCardDescActive: {
    color: colors.primary,
    opacity: 0.8,
  },
  onboardingButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: spacing.s,
  },
  onboardingButtonText: {
    color: '#FFF',
    fontSize: typography.sizes.large,
    fontWeight: 'bold',
  },
  // AI Recommendations Styles
  recommendationsCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
  },
  loadingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.l,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
  // Recommended Crops Section Styles
  cropsSection: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  cropsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.m,
    flex: 1,
  },
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cropCard: {
    width: '48%',
    backgroundColor: colors.cardMuted || colors.background,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  cropIconImage: {
    width: 32,
    height: 32,
  },
  cropName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cropReason: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Tips Section Styles
  tipsCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
  },
  tipsHeader: {
    marginBottom: spacing.m,
  },
  tipsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipsBadgeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tipsContent: {},
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
    marginTop: 2,
  },
  tipBulletText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
});
