/**
 * WelcomeScreen - First-time Onboarding
 * Collects user name and region before entering the app
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors, useTheme } from "../theme/ThemeProvider";
import { REGIONS, RegionType } from "../utils/farmingData";

export default function WelcomeScreen() {
    const { colors, typography, spacing } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);
    const router = useRouter();

    const [name, setName] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<RegionType>("mid");

    const handleContinue = async () => {
        if (!name.trim()) {
            Alert.alert("Name Required", "Please enter your name to continue.");
            return;
        }

        // Save to AsyncStorage
        try {
            console.log('Saving to AsyncStorage:', { name: name.trim(), region: selectedRegion });

            await AsyncStorage.setItem("username", name.trim());
            await AsyncStorage.setItem("region", selectedRegion);
            await AsyncStorage.setItem("onboardingComplete", "true");

            // Verify the save
            const saved = await AsyncStorage.getItem("onboardingComplete");
            console.log('Onboarding complete saved as:', saved);

            // Small delay to ensure storage write completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate to home
            router.replace("/(tabs)");
        } catch (error) {
            console.error('Error saving onboarding data:', error);
            Alert.alert("Error", "Failed to save your information. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Hero Section */}
                <View style={styles.hero}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="leaf" size={48} color="#FFF" />
                    </View>
                    <Text style={styles.appName}>AgriFarm</Text>
                    <Text style={styles.tagline}>Your Smart Farming Companion</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Let's get started!</Text>
                    <Text style={styles.formSubtitle}>Tell us a bit about yourself</Text>

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Your Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Aman"
                            placeholderTextColor={colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                    </View>

                    {/* Region Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Your Region</Text>
                        <Text style={styles.helperText}>
                            This helps us provide better crop recommendations
                        </Text>
                        <View style={styles.regionGrid}>
                            {REGIONS.map((r) => (
                                <TouchableOpacity
                                    key={r.key}
                                    style={[
                                        styles.regionButton,
                                        selectedRegion === r.key && styles.regionButtonActive
                                    ]}
                                    onPress={() => setSelectedRegion(r.key)}
                                >
                                    <Text style={[
                                        styles.regionTitle,
                                        selectedRegion === r.key && styles.regionTitleActive
                                    ]}>
                                        {r.label}
                                    </Text>
                                    <Text style={[
                                        styles.regionDesc,
                                        selectedRegion === r.key && styles.regionDescActive
                                    ]}>
                                        {r.description}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: ThemeColors, typography: any, spacing: any, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingTop: insets.top + spacing.xl,
        paddingHorizontal: spacing.l,
    },
    hero: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    tagline: {
        fontSize: typography.sizes.base,
        color: colors.textSecondary,
    },
    formCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    formTitle: {
        fontSize: typography.sizes.header,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    formSubtitle: {
        fontSize: typography.sizes.base,
        color: colors.textSecondary,
        marginBottom: spacing.l,
    },
    inputGroup: {
        marginBottom: spacing.l,
    },
    label: {
        fontSize: typography.sizes.base,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.s,
    },
    helperText: {
        fontSize: typography.sizes.mobile,
        color: colors.textSecondary,
        marginBottom: spacing.m,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        fontSize: typography.sizes.base,
        color: colors.text,
    },
    regionGrid: {
        gap: spacing.s,
    },
    regionButton: {
        backgroundColor: colors.cardMuted,
        padding: spacing.m,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    regionButtonActive: {
        backgroundColor: colors.primary + '15',
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
    continueButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.m,
        borderRadius: 16,
        marginTop: spacing.m,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        gap: spacing.s,
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: typography.sizes.large,
        fontWeight: 'bold',
    },
});
