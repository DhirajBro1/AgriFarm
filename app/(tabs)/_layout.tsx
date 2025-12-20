import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

export default function TabLayout() {
    const { colors, typography, spacing } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tabs
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
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="crops"
                options={{
                    title: 'Crops',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tools"
                options={{
                    title: 'Tools',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'construct' : 'construct-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tips"
                options={{
                    title: 'Tips',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'bulb' : 'bulb-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
