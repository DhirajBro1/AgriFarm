/**
 * AccountScreen - Modern Minimal + Legacy Power
 * Focus: Inline Editing & Rich Region Selection
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import { REGIONS, RegionType } from "../../utils/farmingData";

export default function AccountScreen() {
  const { colors, theme, toggleTheme, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);

  const [username, setUsername] = useState("Farmer");
  const [region, setRegion] = useState<RegionType>("mid");

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState<RegionType>("mid");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const storedUsername = await AsyncStorage.getItem("username");
    const storedRegion = await AsyncStorage.getItem("region");
    if (storedUsername) {
      setUsername(storedUsername);
      setEditName(storedUsername);
    }
    if (storedRegion) {
      setRegion(storedRegion as RegionType);
      setEditRegion(storedRegion as RegionType);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert(t('common.error'), t('account.profile.nameEmpty'));
      return;
    }

    try {
      console.log('Saving account changes:', { name: editName, region: editRegion });

      await AsyncStorage.setItem("username", editName);
      await AsyncStorage.setItem("region", editRegion);
// commit test
      // Verify the save
      const savedName = await AsyncStorage.getItem("username");
      const savedRegion = await AsyncStorage.getItem("region");
      console.log('Saved values:', { savedName, savedRegion });

      setUsername(editName);
      setRegion(editRegion);
      setIsEditing(false);

      Alert.alert(t('common.success'), t('account.profile.updateSuccess'));
    } catch (error) {
      console.error('Error saving account data:', error);
      Alert.alert(t('common.error'), t('account.profile.updateError'));
    }
  };

  const handleCancel = () => {
    setEditName(username);
    setEditRegion(region);
    setIsEditing(false);
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'ne' : 'en';
    await i18n.changeLanguage(newLang);
  };

  const MenuItem = ({ icon, label, onPress, value, description }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: colors.cardMuted }]}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {description && <Text style={styles.menuDesc}>{description}</Text>}
      </View>
      {value ? (
        <View>{value}</View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('account.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Dynamic Profile Section */}
        <View style={styles.profileCard}>
          {!isEditing ? (
            // VIEW MODE
            <>
              <View style={styles.viewModeHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{username.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{username}</Text>
                  <Text style={styles.profileRole}>
                    {region ? t(`regions.${region}.label`) : t('account.profile.regionNotSet')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={20} color={colors.text} />
                <Text style={styles.editBtnText}>{t('account.profile.editProfile')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            // EDIT MODE
            <View style={styles.editContainer}>
              <Text style={styles.sectionTitle}>{t('account.profile.editProfile')}</Text>

              <Text style={styles.inputLabel}>{t('account.profile.displayName')}</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder={t('account.profile.namePlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.inputLabel}>{t('account.profile.selectRegion')}</Text>
              <View style={styles.regionGrid}>
                {REGIONS.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.regionBtn,
                      editRegion === r.key && styles.regionBtnActive
                    ]}
                    onPress={() => setEditRegion(r.key)}
                  >
                    <Text style={[styles.regionTitle, editRegion === r.key && styles.regionTitleActive]}>
                      {t(`regions.${r.key}.label`)}
                    </Text>
                    <Text style={[styles.regionDesc, editRegion === r.key && styles.regionDescActive]}>
                      {t(`regions.${r.key}.description`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity style={styles.saveAction} onPress={handleSave}>
                  <Text style={styles.saveText}>{t('account.profile.saveChanges')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelAction} onPress={handleCancel}>
                  <Text style={styles.cancelText}>{t('account.profile.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Display Settings */}
        <View style={styles.settingsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('account.preferences.title')}</Text>
          </View>

          <MenuItem
            icon="moon"
            label={t('account.preferences.darkMode')}
            description={t('account.preferences.darkModeDesc')}
            value={
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
          <MenuItem
            icon="notifications"
            label={t('account.preferences.notifications')}
            description={t('account.preferences.notificationsDesc')}
          />
          <MenuItem
            icon="language"
            label={t('account.preferences.language')}
            description={t('account.preferences.languageDesc')}
            onPress={toggleLanguage}
            value={
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                {t(`common.languages.${i18n.language}`)}
              </Text>
            }
          />
        </View>

        {/* About App */}
        <View style={styles.settingsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('account.about.title')}</Text>
          </View>
          <Text style={styles.aboutText}>
            {t('account.about.description')}
          </Text>
          <View style={styles.versionBox}>
            <Text style={styles.versionText}>{t('account.about.version')}</Text>
          </View>
        </View>

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
    paddingBottom: spacing.m,
  },
  headerTitle: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.l,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  viewModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  profileRole: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardMuted,
    padding: spacing.m,
    borderRadius: 16,
    gap: 8,
  },
  editBtnText: {
    fontWeight: '600',
    color: colors.text,
  },
  // Edit Mode Styles
  editContainer: {
    gap: spacing.m,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.s,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: typography.sizes.base,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.m,
    color: colors.text,
    fontSize: typography.sizes.base,
  },
  regionGrid: {
    gap: spacing.s,
  },
  regionBtn: {
    padding: spacing.m,
    borderRadius: 12,
    backgroundColor: colors.cardMuted,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  regionBtnActive: {
    backgroundColor: colors.primary + '15', // 15% opacity
    borderColor: colors.primary,
  },
  regionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  regionTitleActive: {
    color: colors.primary,
  },
  regionDesc: {
    fontSize: typography.sizes.mobile,
    color: colors.textSecondary,
  },
  regionDescActive: {
    color: colors.primary,
    opacity: 0.8,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.s,
  },
  saveAction: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  cancelAction: {
    flex: 1,
    backgroundColor: colors.cardMuted,
    padding: spacing.m,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    paddingHorizontal: spacing.s,
    gap: 8,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.cardMuted,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  menuLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text,
  },
  menuDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    paddingHorizontal: spacing.s,
  },
  versionBox: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  versionText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
});


