import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { t, subscribe } from '../../utils/i18n';
import { Platform } from 'react-native';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

export default function TabLayout() {
    const { colors, typography, spacing } = useTheme();
    const insets = useSafeAreaInsets();
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const unsub = subscribe((l) => setLanguage(l));
        return unsub;
    }, []);

    return (
        <Tabs
            key={language}
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.navBackground,
                    borderTopColor: colors.border,
                    // Dynamic height based on safe area
                    height: Platform.OS === 'ios' ? 88 : 60 + insets.bottom,
                    paddingBottom: Platform.OS === 'ios' ? 28 : insets.bottom + 4,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.navActive,
                tabBarInactiveTintColor: colors.navInactive,
                tabBarLabelStyle: {
                    fontSize: 12,
                    // Use system font or a nice sans-serif
                    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
                    fontWeight: '600',
                    marginBottom: 4,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    tabBarLabel: ({ color, focused }) => (
                        <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{t('home')}</Text>
                    ),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="crops"
                options={{
                    tabBarLabel: ({ color, focused }) => (
                        <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{t('crops')}</Text>
                    ),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tools"
                options={{
                    tabBarLabel: ({ color, focused }) => (
                        <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{t('tools')}</Text>
                    ),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'construct' : 'construct-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tips"
                options={{
                    tabBarLabel: ({ color, focused }) => (
                        <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{t('tips')}</Text>
                    ),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'bulb' : 'bulb-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    tabBarLabel: ({ color, focused }) => (
                        <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{t('account')}</Text>
                    ),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
