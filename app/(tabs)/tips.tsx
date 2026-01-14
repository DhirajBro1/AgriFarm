/**
 * TipsScreen - Modern Minimal
 * Focus: Categorized Tips with Filter Pill Navigation
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import { FARMING_TIPS } from "../../utils/farmingData";

export default function TipsScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);

  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", "watering", "fertilizer", "planting", "harvesting"];

  const filteredTips = selectedCategory === 'all'
    ? FARMING_TIPS
    : FARMING_TIPS.filter(t => t.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tips.title')}</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.l }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, selectedCategory === cat && styles.pillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.pillText, selectedCategory === cat && styles.pillTextActive]}>
                {t(`tips.categories.${cat}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredTips.map((tip, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="bulb" size={24} color="#F59E0B" /> 
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.tipTitle}>{t(`tips.items.${tip.id}.title`)}</Text>
                <Text style={styles.tipCategory}>{t(`tips.categories.${tip.category}`)}</Text>
              </View>
              <View style={[
                styles.arrowBox,
                expandedTip === tip.id && { backgroundColor: colors.text, transform: [{ rotate: '180deg' }] }
              ]}>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={expandedTip === tip.id ? colors.background : colors.text}
                />
              </View>
            </View>

            {expandedTip === tip.id && (
              <View style={styles.cardBody}>
                <Text style={styles.description}>{t(`tips.items.${tip.id}.description`)}</Text>
                {tip.season && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{t('tips.bestFor')} {tip.season}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  },
  headerTitle: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  filterContainer: {
    marginBottom: spacing.m,
  },
  pill: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.s,
  },
  pillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  pillText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  pillTextActive: {
    color: colors.background, // Inverted
  },
  content: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: spacing.m,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  headerContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  tipCategory: {
    fontSize: typography.sizes.mobile,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.cardMuted,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.text,
    lineHeight: 24,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: spacing.m,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  }
});
