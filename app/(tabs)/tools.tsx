
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import CSVParser from "../../utils/csvParser";

const TOOLS = [
  { id: 'yield', nameKey: 'tools.toolNames.yield', icon: 'calculator' },
  { id: 'fertilizer', nameKey: 'tools.toolNames.fertilizer', icon: 'leaf' },
  { id: 'area', nameKey: 'tools.toolNames.area', icon: 'map' },
  { id: 'unit', nameKey: 'tools.toolNames.unit', icon: 'scale' },
] as const;

type ToolId = typeof TOOLS[number]['id'];

interface FertilizerResult {
  urea: string;
  dap: string;
  mop: string;
  compost: string;
}

// UnitsHelper
const getAreaUnits = (t: any) => ({
  ropani: { name: t('tools.areaConverter.units.ropani'), toSqM: 508.72, symbol: t('tools.areaConverter.units.ropani') },
  aana: { name: t('tools.areaConverter.units.aana'), toSqM: 31.80, symbol: t('tools.areaConverter.units.aana') },
  bigha: { name: t('tools.areaConverter.units.bigha'), toSqM: 6772.63, symbol: t('tools.areaConverter.units.bigha') },
  hectare: { name: t('tools.areaConverter.units.hectare'), toSqM: 10000, symbol: 'Ha' },
  acre: { name: 'Acre', toSqM: 4046.86, symbol: 'Ac' },
  sqm: { name: t('tools.areaConverter.units.sqMeter'), toSqM: 1, symbol: 'm²' },
});

const getWeightUnits = (t: any) => ({
  kg: { name: t('tools.weightConverter.units.kg'), toKg: 1, symbol: 'Kg' },
  quintal: { name: t('tools.weightConverter.units.quintal'), toKg: 100, symbol: 'Q' },
  ton: { name: t('tools.weightConverter.units.ton'), toKg: 1000, symbol: 'MT' },
  muri: { name: t('tools.weightConverter.units.muri'), toKg: 80, symbol: t('tools.weightConverter.units.muri') },
  pathi: { name: t('tools.weightConverter.units.pathi'), toKg: 4.5, symbol: t('tools.weightConverter.units.pathi') },
  lb: { name: 'Pound', toKg: 0.453592, symbol: 'Lb' },
});


// --- Main Component ---

export default function ToolsScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);

  const [activeTool, setActiveTool] = useState<ToolId>('yield');
  const csvParser = useMemo(() => CSVParser.getInstance(), []);

  // Sync language with CSVParser
  React.useEffect(() => {
    const lang = i18n.language.startsWith('ne') ? 'ne' : 'en';
    csvParser.setLanguage(lang);
  }, [i18n.language, csvParser]);

  // --- Tool Specific State ---
  // Yield
  const [landArea, setLandArea] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [calculatedYield, setCalculatedYield] = useState<string | null>(null);

  // Fertilizer
  const [fertArea, setFertArea] = useState("");
  const [fertCrop, setFertCrop] = useState<string>("");
  const [fertilizerResult, setFertilizerResult] = useState<FertilizerResult | null>(null);

  // Area
  const [areaValue, setAreaValue] = useState("");
  const [areaFrom, setAreaFrom] = useState<string>("ropani");
  const [areaTo, setAreaTo] = useState<string>("hectare");

  // Unit
  const [weightValue, setWeightValue] = useState("");
  const [weightFrom, setWeightFrom] = useState<string>("kg");
  const [weightTo, setWeightTo] = useState<string>("quintal");

  // Modals
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerContext, setPickerContext] = useState<'yield' | 'fert' | 'areaFrom' | 'areaTo' | 'weightFrom' | 'weightTo' | null>(null);

  const AREA_UNITS = useMemo(() => getAreaUnits(t), [t]);
  const WEIGHT_UNITS = useMemo(() => getWeightUnits(t), [t]);

  // --- Logic ---

  const calculateYield = () => {
    if (!landArea || !selectedCrop) return;
    const cropData = csvParser.getCropsData().find(c => c.crop === selectedCrop);
    if (!cropData) return;

    let avgYield = 2000;
    if (cropData.yield) {
      const nums = cropData.yield.match(/(\d+(\.\d+)?)/g);
      if (nums && nums.length > 0) {
        const min = parseFloat(nums[0]);
        const max = nums.length > 1 ? parseFloat(nums[1]) : min;
        avgYield = (min + max) / 2;
      }
    }

    const areaVal = parseFloat(landArea);
    const total = avgYield * areaVal;

    setCalculatedYield(`${total.toLocaleString('en-US', { maximumFractionDigits: 0 })} Kg`);
    Keyboard.dismiss();
  };

  const calculateFertilizer = () => {
    if (!fertArea || !fertCrop) return;
    const cropData = csvParser.getCropsData().find(c => c.crop === fertCrop);
    if (!cropData) return;

    const areaVal = parseFloat(fertArea); // Ropani
    const haArea = areaVal * 0.050872;   // Ha

    let urea = 0, dap = 0, mop = 0, compost = 0;

    const reqN = cropData.nitrogen || 0;
    const reqP = cropData.phosphorus || 0;
    const reqK = cropData.potassium || 0;

    const dapNeededPerHa = reqP / 0.46;
    const nFromDap = dapNeededPerHa * 0.18;
    const remainingN = Math.max(0, reqN - nFromDap);
    const ureaNeededPerHa = remainingN / 0.46;
    const mopNeededPerHa = reqK / 0.60;

    urea = ureaNeededPerHa * haArea;
    dap = dapNeededPerHa * haArea;
    mop = mopNeededPerHa * haArea;

    const compostRaw = cropData.compost || 0;
    const compostPerHa = compostRaw;
    compost = compostPerHa * haArea;

    setFertilizerResult({
      urea: urea < 0.1 ? '0' : urea.toFixed(1),
      dap: dap < 0.1 ? '0' : dap.toFixed(1),
      mop: mop < 0.1 ? '0' : mop.toFixed(1),
      compost: compost.toFixed(0)
    });
    Keyboard.dismiss();
  };

  // --- Handlers ---
  const handlePickerSelect = (val: string) => {
    if (pickerContext === 'yield') setSelectedCrop(val);
    else if (pickerContext === 'fert') setFertCrop(val);
    else if (pickerContext === 'areaFrom') setAreaFrom(val);
    else if (pickerContext === 'areaTo') setAreaTo(val);
    else if (pickerContext === 'weightFrom') setWeightFrom(val);
    else if (pickerContext === 'weightTo') setWeightTo(val);

    setPickerVisible(false);
    setPickerContext(null);
  };

  const getPickerItems = () => {
    if (pickerContext === 'yield' || pickerContext === 'fert') return csvParser.getAllCrops().map(c => ({ label: c, value: c }));
    if (pickerContext?.startsWith('area')) return Object.keys(AREA_UNITS).map(k => ({ label: AREA_UNITS[k as keyof typeof AREA_UNITS].name, value: k }));
    if (pickerContext?.startsWith('weight')) return Object.keys(WEIGHT_UNITS).map(k => ({ label: WEIGHT_UNITS[k as keyof typeof WEIGHT_UNITS].name, value: k }));
    return [];
  };

  const getAreaResult = () => {
    if (!areaValue) return null;
    const val = parseFloat(areaValue);
    if (isNaN(val)) return null;
    const fromUnit = AREA_UNITS[areaFrom as keyof typeof AREA_UNITS];
    const toUnit = AREA_UNITS[areaTo as keyof typeof AREA_UNITS];

    if (!fromUnit || !toUnit) return "-";

    const sqm = val * fromUnit.toSqM;
    const res = sqm / toUnit.toSqM;
    return `${res.toFixed(4)} ${toUnit.symbol}`;
  };

  const getWeightResult = () => {
    if (!weightValue) return null;
    const val = parseFloat(weightValue);
    if (isNaN(val)) return null;
    const fromUnit = WEIGHT_UNITS[weightFrom as keyof typeof WEIGHT_UNITS];
    const toUnit = WEIGHT_UNITS[weightTo as keyof typeof WEIGHT_UNITS];

    if (!fromUnit || !toUnit) return "-";

    const kg = val * fromUnit.toKg;
    const res = kg / toUnit.toKg;
    return `${res.toFixed(3)} ${toUnit.symbol}`;
  };


  // --- Render Functions ---

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('tools.title')}</Text>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <TouchableOpacity
              key={tool.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTool(tool.id)}
            >
              <Ionicons
                name={isActive ? tool.icon as any : `${tool.icon}-outline` as any}
                size={18}
                color={isActive ? colors.background : colors.textSecondary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t(tool.nameKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderYieldCalc = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('tools.yieldCalculator.title')}</Text>
      <Text style={styles.cardSubtitle}>{t('tools.yieldCalculator.subtitle')}</Text>

      {/* Crop Selector */}
      <Text style={styles.label}>{t('common.selectCrop')}</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => { setPickerContext('yield'); setPickerVisible(true); }}
      >
        <Text style={[styles.pickerText, !selectedCrop && styles.placeholder]}>
          {selectedCrop || t('common.selectCrop')}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Area Input */}
      <Text style={styles.label}>{t('tools.yieldCalculator.area')}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="0"
          keyboardType="numeric"
          value={landArea}
          onChangeText={setLandArea}
          placeholderTextColor={colors.textSecondary + '80'}
        />
        <View style={styles.suffixBox}>
          <Text style={styles.suffixText}>{t('tools.areaConverter.units.ropani')}</Text>
        </View>
      </View>

      {/* Calculate Button */}
      <TouchableOpacity style={styles.primaryBtn} onPress={calculateYield}>
        <Text style={styles.primaryBtnText}>{t('tools.yieldCalculator.calculate')}</Text>
      </TouchableOpacity>

      {/* Result */}
      {calculatedYield && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultLabel}>{t('tools.yieldCalculator.result')}</Text>
            <Ionicons name="leaf" size={20} color={colors.primary} />
          </View>
          <Text style={styles.resultValueLarge}>{calculatedYield}</Text>
        </View>
      )}
    </View>
  );

  const renderFertCalc = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('tools.fertilizerCalculator.title')}</Text>
      <Text style={styles.cardSubtitle}>{t('tools.fertilizerCalculator.subtitle')}</Text>

      <Text style={styles.label}>{t('common.selectCrop')}</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => { setPickerContext('fert'); setPickerVisible(true); }}
      >
        <Text style={[styles.pickerText, !fertCrop && styles.placeholder]}>
          {fertCrop || t('common.selectCrop')}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.label}>{t('tools.yieldCalculator.area')}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="0"
          keyboardType="numeric"
          value={fertArea}
          onChangeText={setFertArea}
          placeholderTextColor={colors.textSecondary + '80'}
        />
        <View style={styles.suffixBox}>
          <Text style={styles.suffixText}>{t('tools.areaConverter.units.ropani')}</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#D97706' }]} onPress={calculateFertilizer}>
        <Text style={styles.primaryBtnText}>{t('tools.fertilizerCalculator.calculate')}</Text>
      </TouchableOpacity>

      {fertilizerResult && (
        <View style={styles.fertResults}>
          <View style={styles.fertRow}>
            <FertCard label={t('tools.fertilizerCalculator.urea')} value={fertilizerResult.urea} unit={t('crops.fertilizer.title').includes('kg') ? 'Kg' : 'Kg'} color="#3B82F6" />
            <FertCard label={t('tools.fertilizerCalculator.dap')} value={fertilizerResult.dap} unit="Kg" color="#F59E0B" />
          </View>
          <View style={styles.fertRow}>
            <FertCard label={t('tools.fertilizerCalculator.mop')} value={fertilizerResult.mop} unit="Kg" color="#EF4444" />
            <FertCard label={t('crops.fertilizer.compost')} value={fertilizerResult.compost} unit="Kg" color="#10B981" />
          </View>
        </View>
      )}
    </View>
  );

  const FertCard = ({ label, value, unit, color }: any) => (
    <View style={styles.fertCard}>
      <View style={[styles.fertIcon, { backgroundColor: color + '20' }]}>
        <Text style={[styles.fertSymbol, { color }]}>{label.charAt(0)}</Text>
      </View>
      <View>
        <Text style={styles.fertValue}>{value} <Text style={styles.fertUnit}>{unit}</Text></Text>
        <Text style={styles.fertLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderConverter = (type: 'area' | 'weight') => {
    const isArea = type === 'area';
    const val = isArea ? areaValue : weightValue;
    const setVal = isArea ? setAreaValue : setWeightValue;
    const from = isArea ? areaFrom : weightFrom;
    const to = isArea ? areaTo : weightTo;
    const result = isArea ? getAreaResult() : getWeightResult();
    const title = isArea ? t('tools.areaConverter.title') : t('tools.weightConverter.title');
    const subtitle = isArea ? t('tools.areaConverter.subtitle') : t('tools.weightConverter.subtitle');
    const units = isArea ? AREA_UNITS : WEIGHT_UNITS;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>

        <View style={styles.converterGrid}>
          {/* From Section */}
          <View style={styles.convSection}>
            <Text style={styles.labelSm}>{t('common.from')}</Text>
            <TouchableOpacity
              style={styles.unitPill}
              onPress={() => { setPickerContext(isArea ? 'areaFrom' : 'weightFrom'); setPickerVisible(true); }}
            >
              <Text style={styles.unitPillText}>{(units as any)[from].name}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.text} />
            </TouchableOpacity>
            <TextInput
              style={styles.convInput}
              placeholder="1"
              value={val}
              onChangeText={setVal}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary + '80'}
            />
          </View>

          {/* Swap Icon */}
          <TouchableOpacity style={styles.swapIcon} onPress={() => {
            if (isArea) { setAreaFrom(areaTo as any); setAreaTo(areaFrom as any); }
            else { setWeightFrom(weightTo as any); setWeightTo(weightFrom as any); }
          }}>
            <Ionicons name="swap-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* To Section */}
          <View style={styles.convSection}>
            <Text style={styles.labelSm}>{t('common.to')}</Text>
            <TouchableOpacity
              style={styles.unitPill}
              onPress={() => { setPickerContext(isArea ? 'areaTo' : 'weightTo'); setPickerVisible(true); }}
            >
              <Text style={styles.unitPillText}>{(units as any)[to].name}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.convOutput}>
              <Text style={styles.convOutputText} numberOfLines={1} adjustsFontSizeToFit>
                {result ? result.split(' ')[0] : '-'}
              </Text>
            </View>
          </View>
        </View>

        {result && (
          <View style={styles.resultBanner}>
            <Text style={styles.resultBannerText}>{result}</Text>
          </View>
        )}
      </View>
    );
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {renderHeader()}
        {renderTabs()}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTool === 'yield' && renderYieldCalc()}
          {activeTool === 'fertilizer' && renderFertCalc()}
          {activeTool === 'area' && renderConverter('area')}
          {activeTool === 'unit' && renderConverter('weight')}
        </ScrollView>

        <Modal visible={pickerVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalBody}>
                <Text style={styles.modalHeader}>{t('common.select')}</Text>
                <ScrollView style={styles.modalScroll}>
                  {getPickerItems().map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.modalItem}
                      onPress={() => handlePickerSelect(item.value)}
                    >
                      <Text style={styles.modalItemText}>{item.label}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.border} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}


// --- Styles ---

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
  // Tabs
  tabContainer: {
    paddingHorizontal: spacing.l,
    marginBottom: spacing.m,
  },
  tabContent: {
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4
  },
  tabActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.background,
  },
  // Main Content
  scrollContent: {
    padding: spacing.l,
    paddingBottom: 100,
  },

  // Cards
  card: {
    borderRadius: 24,
    backgroundColor: colors.card,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.l,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: typography.sizes.mobile,
    color: colors.textSecondary,
    marginBottom: spacing.l,
  },

  // Inputs
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardMuted || colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: spacing.l,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardMuted || colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  suffixBox: {
    backgroundColor: colors.border,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suffixText: {
    fontWeight: '600',
    color: colors.text,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },

  // Results
  resultContainer: {
    marginTop: spacing.xl,
    backgroundColor: colors.cardMuted,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  resultValueLarge: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },

  // Fertilizer Grid
  fertResults: {
    marginTop: spacing.l,
    gap: spacing.m,
  },
  fertRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  fertCard: {
    flex: 1,
    backgroundColor: colors.cardMuted,
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fertIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fertSymbol: {
    fontWeight: '800',
    fontSize: 14,
  },
  fertValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  fertUnit: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  fertLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Converter
  converterGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  convSection: {
    flex: 1,
    gap: 8,
  },
  convInput: {
    backgroundColor: colors.cardMuted,
    borderRadius: 16,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text
  },
  convOutput: {
    backgroundColor: colors.cardMuted,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50
  },
  convOutputText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  swapIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  resultBanner: {
    marginTop: spacing.l,
    backgroundColor: colors.text,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  resultBannerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBody: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.l,
    maxHeight: '60%',
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.l,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
});
