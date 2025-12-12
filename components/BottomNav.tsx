import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme/ThemeProvider';

type NavKey = 'home' | 'account';

type Props = {
  active: NavKey;
};

export default function BottomNav({ active }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handleNavigate = (target: NavKey) => {
    if (target === 'home') {
      router.replace('/');
    } else {
      router.replace('/account');
    }
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navButton, active === 'home' && styles.navButtonActive]}
        onPress={() => handleNavigate('home')}
      >
        <Ionicons
          name="home"
          size={24}
          color={active === 'home' ? colors.navActive : colors.muted}
        />
        <Text style={[styles.navText, active === 'home' && styles.navTextActive]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, active === 'account' && styles.navButtonActive]}
        onPress={() => handleNavigate('account')}
      >
        <Ionicons
          name="person"
          size={24}
          color={active === 'account' ? colors.navActive : colors.muted}
        />
        <Text style={[styles.navText, active === 'account' && styles.navTextActive]}>
          Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bottomNav: {
      flexDirection: 'row',
      backgroundColor: colors.navBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    navButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    },
    navButtonActive: {
      borderTopWidth: 2,
      borderTopColor: colors.navActive,
    },
    navText: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },
    navTextActive: {
      color: colors.navActive,
      fontWeight: '600',
    },
  });

