/**
 * ToolsScreen - Complete Farming Tools Suite
 * Yield Calculator, Area Converter, Unit Converter
 */

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
  { id: 'yield', name: 'Yield Calculator', icon: 'calculator' },
  { id: 'area', name: 'Area Converter', icon: 'map' },
  { id: 'unit', name: 'Unit Converter', icon: 'scale' },
];

// Area conversion factors (all to square meters)
const AREA_UNITS = {
  ropani: { name: 'Ropani', toSqM: 508.72, symbol: 'ropani' },
  aana: { name: 'Aana', toSqM: 31.80, symbol: 'aana' },
  bigha: { name: 'Bigha', toSqM: 6772.63, symbol: 'bigha' },
  hectare: { name: 'Hectare', toSqM: 10000, symbol: 'ha' },
  acre: { name: 'Acre', toSqM: 4046.86, symbol: 'acre' },
};

// Weight conversion factors (all to kg)
const WEIGHT_UNITS = {
  kg: { name: 'Kilogram', toKg: 1, symbol: 'kg' },
  quintal: { name: 'Quintal', toKg: 100, symbol: 'q' },
  ton: { name: 'Ton (Metric)', toKg: 1000, symbol: 't' },
  muri: { name: 'Muri', toKg: 80, symbol: 'muri' },
  pathi: { name: 'Pathi', toKg: 4.5, symbol: 'pathi' },
};

export default function ToolsScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);

  const [activeTool, setActiveTool] = useState('yield');

  // Yield Calc State
  const [landArea, setLandArea] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [calculatedYield, setCalculatedYield] = useState<string | null>(null);

  // Area Converter State
  const [areaValue, setAreaValue] = useState("");
  const [areaFromUnit, setAreaFromUnit] = useState<keyof typeof AREA_UNITS>("ropani");
  const [areaToUnit, setAreaToUnit] = useState<keyof typeof AREA_UNITS>("hectare");
  const [areaResult, setAreaResult] = useState<string | null>(null);

  // Unit Converter State
  const [weightValue, setWeightValue] = useState("");
  const [weightFromUnit, setWeightFromUnit] = useState<keyof typeof WEIGHT_UNITS>("kg");
  const [weightToUnit, setWeightToUnit] = useState<keyof typeof WEIGHT_UNITS>("quintal");
  const [weightResult, setWeightResult] = useState<string | null>(null);

  // Picker Modals
  const [showAreaFromPicker, setShowAreaFromPicker] = useState(false);
  const [showAreaToPicker, setShowAreaToPicker] = useState(false);
  const [showWeightFromPicker, setShowWeightFromPicker] = useState(false);
  const [showWeightToPicker, setShowWeightToPicker] = useState(false);

  const csvParser = useMemo(() => CSVParser.getInstance(), []);

  const calculateYield = () => {
    if (!landArea || selectedCrop === "") return;

    const cropData = csvParser.getCropInfo(selectedCrop);
    let avgYield = 2000;

    
    if (cropData && cropData.yield) {
      const parts = cropData.yield.match(/(\d+)/g);
      if (parts && parts.length > 0) {
        const min = parseInt(parts[0]);
        const max = parts.length > 1 ? parseInt(parts[1]) : min;
        avgYield = (min + max) / 2;
      }
    }

    const areaVal = parseFloat(landArea);
    const total = (avgYield * (areaVal * 0.05)).toFixed(2);

    setCalculatedYield(`${total} Kg`);
    Keyboard.dismiss();
  };

  const convertArea = () => {
    if (!areaValue) return;

    const inputValue = parseFloat(areaValue);
    const sqMeters = inputValue * AREA_UNITS[areaFromUnit].toSqM;
    const result = sqMeters / AREA_UNITS[areaToUnit].toSqM;

    setAreaResult(`${result.toFixed(4)} ${AREA_UNITS[areaToUnit].symbol}`);
    Keyboard.dismiss();
  };

  const convertWeight = () => {
    if (!weightValue) return;

    const inputValue = parseFloat(weightValue);
    const kg = inputValue * WEIGHT_UNITS[weightFromUnit].toKg;
    const result = kg / WEIGHT_UNITS[weightToUnit].toKg;

    setWeightResult(`${result.toFixed(4)} ${WEIGHT_UNITS[weightToUnit].symbol}`);
    Keyboard.dismiss();
  };

  const renderToolContent = () => {
    if (activeTool === 'yield') {
      return (
        <View style={styles.toolContainer}>
          <Text style={styles.toolTitle}>{t('tools.yieldCalculator.title')}</Text>
          <Text style={styles.toolDesc}>{t('tools.yieldCalculator.subtitle')}</Text>

          <Text style={styles.inputLabel}>{t('common.selectCrop')}</Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setModalVisible(true)}>
            <Text style={[styles.selectorText, selectedCrop === "" && styles.placeholderText]}>
              {selectedCrop || t('common.selectCrop')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>{t('tools.yieldCalculator.area')}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={landArea}
              onChangeText={setLandArea}
            />
            <Text style={styles.unitText}>{t('tools.areaConverter.units.ropani')}</Text>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={calculateYield}>
            <Text style={styles.actionBtnText}>{t('tools.yieldCalculator.calculate')}</Text>
          </TouchableOpacity>

          {calculatedYield && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>{t('tools.yieldCalculator.result')}</Text>
              <Text style={styles.resultValue}>{calculatedYield}</Text>
            </View>
          )}
        </View>
      );
    }

    if (activeTool === 'area') {
      return (
        <View style={styles.toolContainer}>
          <Text style={styles.toolTitle}>{t('tools.areaConverter.title')}</Text>
          <Text style={styles.toolDesc}>{t('tools.areaConverter.subtitle')}</Text>

          <Text style={styles.inputLabel}>{t('tools.areaConverter.from')}</Text>
          <View style={styles.converterRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('tools.areaConverter.enterValue')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={areaValue}
              onChangeText={setAreaValue}
            />
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={styles.unitBtn}
                onPress={() => setShowAreaFromPicker(true)}
              >
                <Text style={styles.unitBtnText}>{t(`tools.areaConverter.units.${areaFromUnit}`)}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.swapContainer}>
            <TouchableOpacity
              style={styles.swapBtn}
              onPress={() => {
                const temp = areaFromUnit;
                setAreaFromUnit(areaToUnit);
                setAreaToUnit(temp);
              }}
            >
              <Ionicons name="swap-vertical" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>{t('tools.areaConverter.to')}</Text>
          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={styles.unitBtn}
              onPress={() => setShowAreaToPicker(true)}
            >
              <Text style={styles.unitBtnText}>{t(`tools.areaConverter.units.${areaToUnit}`)}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={convertArea}>
            <Text style={styles.actionBtnText}>{t('tools.areaConverter.convert')}</Text>
          </TouchableOpacity>

          {areaResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>{t('tools.areaConverter.result')}</Text>
              <Text style={styles.resultValue}>{areaResult}</Text>
            </View>
          )}
        </View>
      );
    }

    if (activeTool === 'unit') {
      return (
        <View style={styles.toolContainer}>
          <Text style={styles.toolTitle}>{t('tools.weightConverter.title')}</Text>
          <Text style={styles.toolDesc}>{t('tools.weightConverter.subtitle')}</Text>

          <Text style={styles.inputLabel}>{t('tools.weightConverter.from')}</Text>
          <View style={styles.converterRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('tools.weightConverter.enterWeight')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={weightValue}
              onChangeText={setWeightValue}
            />
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={styles.unitBtn}
                onPress={() => setShowWeightFromPicker(true)}
              >
                <Text style={styles.unitBtnText}>{t(`tools.weightConverter.units.${weightFromUnit}`)}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.swapContainer}>
            <TouchableOpacity
              style={styles.swapBtn}
              onPress={() => {
                const temp = weightFromUnit;
                setWeightFromUnit(weightToUnit);
                setWeightToUnit(temp);
              }}
            >
              <Ionicons name="swap-vertical" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>{t('tools.weightConverter.to')}</Text>
          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={styles.unitBtn}
              onPress={() => setShowWeightToPicker(true)}
            >
              <Text style={styles.unitBtnText}>{t(`tools.weightConverter.units.${weightToUnit}`)}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={convertWeight}>
            <Text style={styles.actionBtnText}>{t('tools.weightConverter.convert')}</Text>
          </TouchableOpacity>

          {weightResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>{t('tools.weightConverter.result')}</Text>
              <Text style={styles.resultValue}>{weightResult}</Text>
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('tools.title')}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ paddingHorizontal: spacing.l }}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.tab, activeTool === tool.id && { backgroundColor: colors.primary }]}
              onPress={() => {
                setActiveTool(tool.id);
                setCalculatedYield(null);
                setAreaResult(null);
                setWeightResult(null);
              }}
            >
              <Ionicons name={tool.icon as any} size={16} color={activeTool === tool.id ? '#FFF' : colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTool === tool.id && styles.tabTextActive]}>
                {t(`tools.toolNames.${tool.id}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderToolContent()}
        </ScrollView>

        {/* CROP SELECTION MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('common.selectCrop')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                {csvParser.getAllCrops().map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.cropOption}
                    onPress={() => { setSelectedCrop(c); setModalVisible(false); }}
                  >
                    <Text style={styles.cropOptionText}>{c}</Text>
                    {selectedCrop === c && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* AREA FROM UNIT PICKER */}
        <Modal visible={showAreaFromPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('common.select')} Unit ({t('common.from')})</Text>
                <TouchableOpacity onPress={() => setShowAreaFromPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {(Object.keys(AREA_UNITS) as (keyof typeof AREA_UNITS)[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.cropOption}
                    onPress={() => { setAreaFromUnit(key); setShowAreaFromPicker(false); }}
                  >
                    <Text style={styles.cropOptionText}>{t(`tools.areaConverter.units.${key}`)}</Text>
                    {areaFromUnit === key && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* AREA TO UNIT PICKER */}
        <Modal visible={showAreaToPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('common.select')} Unit ({t('common.to')})</Text>
                <TouchableOpacity onPress={() => setShowAreaToPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {(Object.keys(AREA_UNITS) as (keyof typeof AREA_UNITS)[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.cropOption}
                    onPress={() => { setAreaToUnit(key); setShowAreaToPicker(false); }}
                  >
                    <Text style={styles.cropOptionText}>{t(`tools.areaConverter.units.${key}`)}</Text>
                    {areaToUnit === key && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* WEIGHT FROM UNIT PICKER */}
        <Modal visible={showWeightFromPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('common.select')} Unit ({t('common.from')})</Text>
                <TouchableOpacity onPress={() => setShowWeightFromPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {(Object.keys(WEIGHT_UNITS) as (keyof typeof WEIGHT_UNITS)[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.cropOption}
                    onPress={() => { setWeightFromUnit(key); setShowWeightFromPicker(false); }}
                  >
                    <Text style={styles.cropOptionText}>{t(`tools.weightConverter.units.${key}`)}</Text>
                    {weightFromUnit === key && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* WEIGHT TO UNIT PICKER */}
        <Modal visible={showWeightToPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('common.select')} Unit ({t('common.to')})</Text>
                <TouchableOpacity onPress={() => setShowWeightToPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {(Object.keys(WEIGHT_UNITS) as (keyof typeof WEIGHT_UNITS)[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.cropOption}
                    onPress={() => { setWeightToUnit(key); setShowWeightToPicker(false); }}
                  >
                    <Text style={styles.cropOptionText}>{t(`tools.weightConverter.units.${key}`)}</Text>
                    {weightToUnit === key && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}

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
    maxHeight: 50,
    marginBottom: spacing.l,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.s,
  },
  tabText: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 13,
  },
  tabTextActive: {
    color: '#FFF',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  toolContainer: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolTitle: {
    fontSize: typography.sizes.header,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  toolDesc: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.l,
  },
  inputLabel: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.s,
    marginTop: spacing.s,
  },
  selectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.l,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.m,
    fontSize: 16,
    color: colors.text,
  },
  unitText: {
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.s,
  },
  converterRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  unitSelector: {
    minWidth: 140,
  },
  unitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.m,
  },
  unitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: spacing.s,
  },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: spacing.m,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultBox: {
    marginTop: spacing.xl,
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: spacing.l,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  resultLabel: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultValue: {
    color: '#065F46',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.l,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  cropOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cropOptionText: {
    fontSize: 16,
    color: colors.text,
  }
});
