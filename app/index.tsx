import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomNav from '../components/BottomNav';
import cropData from '../data/crops.json';
import type { ThemeColors } from '../theme/ThemeProvider';
import { useTheme } from '../theme/ThemeProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [province, setProvince] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  
  const provinces = [
    'Koshi',
    'Madhesh',
    'Bagmati',
    'Gandaki',
    'Lumbini',
    'Karnali',
    'Sudurpashchim'
  ];

  const nepaliMonths = [
    'Baisakh', 'Jestha', 'Ashar', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
  ];

  const getCurrentNepaliMonth = () => {
    const today = new Date();
    const checkpoints = [
      { month: 0, day: 14, nepali: 'Magh' },      // Jan 14
      { month: 1, day: 13, nepali: 'Falgun' },    // Feb 13
      { month: 2, day: 14, nepali: 'Chaitra' },   // Mar 14
      { month: 3, day: 14, nepali: 'Baisakh' },   // Apr 14
      { month: 4, day: 15, nepali: 'Jestha' },    // May 15
      { month: 5, day: 15, nepali: 'Ashar' },     // Jun 15
      { month: 6, day: 17, nepali: 'Shrawan' },   // Jul 17
      { month: 7, day: 17, nepali: 'Bhadra' },    // Aug 17
      { month: 8, day: 17, nepali: 'Ashwin' },    // Sep 17
      { month: 9, day: 18, nepali: 'Kartik' },    // Oct 18
      { month: 10, day: 17, nepali: 'Mangsir' },  // Nov 17
      { month: 11, day: 16, nepali: 'Poush' },    // Dec 16
    ];

    const { month, day } = { month: today.getMonth(), day: today.getDate() };
    let current = checkpoints[checkpoints.length - 1].nepali;

    checkpoints.forEach((point) => {
      if (month > point.month || (month === point.month && day >= point.day)) {
        current = point.nepali;
      }
    });

    return current;
  };

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedProvince = await AsyncStorage.getItem('province');
      
      if (storedUsername && storedProvince) {
        setUsername(storedUsername);
        setProvince(storedProvince);
        setCurrentMonth(getCurrentNepaliMonth());
        setIsFirstTime(false);
      } else {
        setIsFirstTime(true);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async () => {
    if (username.trim() && province) {
      try {
        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('province', province);
        setCurrentMonth(getCurrentNepaliMonth());
        setIsFirstTime(false);
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="leaf" size={60} color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isFirstTime) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.setupContainer}>
          <View style={styles.setupCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="leaf" size={50} color={colors.primary} />
            </View>
            
            <Text style={styles.title}>Welcome to AgriFarm</Text>
            <Text style={styles.subtitle}>Let's set up your profile</Text>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person" size={18} color="#374151" />
                <Text style={styles.label}>Username</Text>
              </View>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location" size={18} color="#374151" />
                <Text style={styles.label}>Province</Text>
              </View>
              
              <View style={styles.provinceGrid}>
                {provinces.map((prov) => (
                  <TouchableOpacity
                    key={prov}
                    style={[
                      styles.provinceButton,
                      province === prov && styles.provinceButtonSelected
                    ]}
                    onPress={() => setProvince(prov)}
                  >
                    <Text style={[
                      styles.provinceButtonText,
                      province === prov && styles.provinceButtonTextSelected
                    ]}>
                      {prov}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.setupButton,
                (!username.trim() || !province) && styles.setupButtonDisabled
              ]}
              onPress={handleSetup}
              disabled={!username.trim() || !province}
            >
              <Text style={styles.setupButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }


  const crops = cropData[province]?.[currentMonth] || [];

  return (
    <View style={styles.container}>
    
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="leaf" size={32} color="#fff" />
          <Text style={styles.headerTitle}>AgriFarm</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={styles.headerLocation}>{province}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Current Month: {currentMonth}</Text>
          </View>
          
          <Text style={styles.cardSubtitle}>
            Select a month to view recommended crops for {province} province:
          </Text>

          <View style={styles.monthGrid}>
            {nepaliMonths.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  currentMonth === month && styles.monthButtonSelected
                ]}
                onPress={() => setCurrentMonth(month)}
              >
                <Text style={[
                  styles.monthButtonText,
                  currentMonth === month && styles.monthButtonTextSelected
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.cropsContainer}>
            <View style={styles.cropsHeader}>
              <Ionicons name="leaf" size={20} color={colors.primary} />
              <Text style={styles.cropsTitle}>Crops to Plant in {currentMonth}</Text>
            </View>
            
            <View style={styles.cropsGrid}>
              {crops.map((crop, index) => (
                <View key={index} style={styles.cropCard}>
                  <Ionicons name="flower" size={20} color={colors.primary} />
                  <Text style={styles.cropText}>{crop}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 18,
      color: colors.muted,
    },
    setupContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    setupCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 32,
      shadowColor: '#000',
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
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 32,
    },
    inputGroup: {
      marginBottom: 24,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
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
    setupButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    setupButtonDisabled: {
      backgroundColor: colors.cardMuted,
    },
    setupButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
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
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerLocation: {
      fontSize: 14,
      color: '#fff',
      marginLeft: 4,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 80,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: 16,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    monthButton: {
      backgroundColor: colors.cardMuted,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      minWidth: '30%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    monthButtonText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    monthButtonTextSelected: {
      color: '#fff',
    },
    cropsContainer: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cropsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cropsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    cropsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    cropCard: {
      backgroundColor: colors.card,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      minWidth: '45%',
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cropText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginLeft: 8,
    },
  });