import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

export default function TabLayout() {
    const { colors, typography, spacing } = useTheme();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <React.Fragment>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: colors.navBackground,
                        borderTopColor: colors.border,
                        height: Platform.OS === 'ios' ? 88 : 60 + insets.bottom,
                        paddingBottom: Platform.OS === 'ios' ? 28 : insets.bottom + 4,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: colors.navActive,
                    tabBarInactiveTintColor: colors.navInactive,
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
                        fontWeight: '600',
                        marginBottom: 4,
                    },
                }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: t('navigation.home'),
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="crops"
                    options={{
                        title: t('navigation.crops'),
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={24} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="tools"
                    options={{
                        title: t('navigation.tools'),
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'construct' : 'construct-outline'} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="tips"
                    options={{
                        title: t('navigation.tips'),
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'bulb' : 'bulb-outline'} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="account"
                    options={{
                        title: t('navigation.account'),
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                        ),
                    }}
                />
            </Tabs>
        </React.Fragment>
    );
}
