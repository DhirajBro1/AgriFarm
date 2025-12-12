import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomNav from '../components/BottomNav';
import type { ThemeColors } from '../theme/ThemeProvider';
import { useTheme } from '../theme/ThemeProvider';

export default function AccountScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [username, setUsername] = useState('');
  const [province, setProvince] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editProvince, setEditProvince] = useState('');
  
  const provinces = [
    'Koshi',
    'Madhesh',
    'Bagmati',
    'Gandaki',
    'Lumbini',
    'Karnali',
    'Sudurpashchim'
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedProvince = await AsyncStorage.getItem('province');
      
      if (storedUsername && storedProvince) {
        setUsername(storedUsername);
        setProvince(storedProvince);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const startEditing = () => {
    setEditUsername(username);
    setEditProvince(province);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editUsername.trim() && editProvince) {
      try {
        await AsyncStorage.setItem('username', editUsername);
        await AsyncStorage.setItem('province', editProvince);
        setUsername(editUsername);
        setProvince(editProvince);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (error) {
        console.error('Error saving data:', error);
        Alert.alert('Error', 'Failed to update profile');
      }
    }
  };

  const handleCancel = () => {
    setEditUsername(username);
    setEditProvince(province);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="leaf" size={32} color="#fff" />
          <Text style={styles.headerTitle}>AgriFarm</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={50} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Account Settings</Text>
          </View>

          {!isEditing ? (
            <View style={styles.infoContainer}>
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Username</Text>
                <View style={styles.infoValueContainer}>
                  <Ionicons name="person-circle" size={20} color={colors.primary} />
                  <Text style={styles.infoValue}>{username}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Province</Text>
                <View style={styles.infoValueContainer}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <Text style={styles.infoValue}>{province}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={startEditing}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="Enter your name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Province</Text>
                <View style={styles.provinceGrid}>
                  {provinces.map((prov) => (
                    <TouchableOpacity
                      key={prov}
                      style={[
                        styles.provinceButton,
                        editProvince === prov && styles.provinceButtonSelected
                      ]}
                      onPress={() => setEditProvince(prov)}
                    >
                      <Text style={[
                        styles.provinceButtonText,
                        editProvince === prov && styles.provinceButtonTextSelected
                      ]}>
                        {prov}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={20} color="#374151" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.appInfoHeader}>
            <Ionicons name="color-palette" size={24} color={colors.primary} />
            <Text style={styles.appInfoTitle}>Display</Text>
          </View>
          <View style={styles.themeRow}>
            <View style={styles.themeLabels}>
              <Text style={styles.infoLabel}>Dark mode</Text>
              <Text style={styles.mutedText}>Toggle between light and dark themes.</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={theme === 'dark' ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.appInfoHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.appInfoTitle}>About AgriFarm</Text>
          </View>
          <Text style={styles.appInfoText}>
            AgriFarm helps Nepali farmers plan their crops based on their province and the current Nepali month. Get personalized crop recommendations for optimal farming.
          </Text>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="account" />
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      backgroundColor: colors.primaryMuted,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    infoContainer: {
      gap: 24,
    },
    infoSection: {
      gap: 8,
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.muted,
    },
    infoValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoValue: {
      fontSize: 18,
      color: colors.text,
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    editButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
    },
    editButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    editContainer: {
      gap: 20,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    provinceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    provinceButton: {
      backgroundColor: colors.cardMuted,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: '30%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    provinceButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    provinceButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    provinceButtonTextSelected: {
      color: '#fff',
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      borderRadius: 8,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.cardMuted,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    appInfoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    appInfoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    appInfoText: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 22,
    },
    versionContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    versionText: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'center',
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeLabels: {
      flex: 1,
      marginRight: 12,
      gap: 4,
    },
    mutedText: {
      color: colors.muted,
      fontSize: 13,
    },
  });