/**
 * Home Screen - Modern Minimal with Integrated Onboarding
 * Focus: Access to Core Features + First-Time Setup
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { t, subscribe } from "../../utils/i18n";
import GeminiDiseaseService from "../../services/geminiDiseaseService";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors, useTheme } from "../../theme/ThemeProvider";
import CSVParser, { CropData } from "../../utils/csvParser";
import { getCurrentNepaliMonth, getGreeting, REGIONS, RegionType } from "../../utils/farmingData";
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";


export default function HomeScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  const [username, setUsername] = useState("Farmer");
  const [language, setLanguage] = useState('en');
  const [seasonalCrops, setSeasonalCrops] = useState<CropData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    title: string;
    recommendations: string[];
    tips: string[];
  } | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const currentMonth = useMemo(() => getCurrentNepaliMonth(), []);

  // Onboarding Modal State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingRegion, setOnboardingRegion] = useState<RegionType>("mid");

  useEffect(() => {
    checkFirstTime();
    loadData();
    loadRecommendations();
    const unsubscribe = subscribe((l) => setLanguage(l));
    return () => {
      unsubscribe();
    };
  }, []);

  const checkFirstTime = async () => {
    const isFirstTime = await AsyncStorage.getItem("onboardingComplete");
    if (!isFirstTime) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    if (!onboardingName.trim()) {
      Alert.alert("Name Required", "Please enter your name to continue.");
      return;
    }

    try {
      await AsyncStorage.setItem("username", onboardingName.trim());
      await AsyncStorage.setItem("region", onboardingRegion);
      await AsyncStorage.setItem("onboardingComplete", "true");

      setUsername(onboardingName.trim());
      setShowOnboarding(false);

      // Reload data with new region
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to save your information.");
    }
  };

  const loadData = async () => {
    const name = await AsyncStorage.getItem("username");
    if (name) setUsername(name);

    // Load Seasonal Crops
    const parser = CSVParser.getInstance();
    await parser.initialize();

    const region = (await AsyncStorage.getItem("region")) as 'high' | 'mid' | 'terai' || 'mid';
    const crops = parser.getCropsByMonth(currentMonth, region);

    const unique = Array.from(new Set(crops.map(c => c.crop)))
      .map(name => crops.find(c => c.crop === name))
      .filter((c): c is CropData => !!c)
      .slice(0, 3);

    setSeasonalCrops(unique);
  };

  const loadRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const region = (await AsyncStorage.getItem("region")) as 'high' | 'mid' | 'terai' || 'mid';
      const storedGeminiLang = await AsyncStorage.getItem('gemini_language');
      const lang = storedGeminiLang === 'ne' ? 'ne' : 'en';

      // Map region codes to readable names
      const regionNames = {
        high: 'High Hills',
        mid: 'Mid Hills',
        terai: 'Terai'
      };

      const regionName = regionNames[region] || 'Mid Hills';

      console.log('🏠 Loading recommendations for region:', regionName, 'month:', currentMonth, 'language:', lang);
      const recs = await GeminiDiseaseService.getHomeRecommendations(regionName, currentMonth, lang);
      setRecommendations(recs);
    } catch (error) {
      console.error('❌ Failed to load recommendations:', error);
      // Keep existing recommendations or set fallback
      if (!recommendations) {
        setRecommendations({
          title: language === 'ne' ? 'कृषि सिफारिसहरू' : 'Farming Recommendations',
          recommendations: [
            language === 'ne' ? 'मौसम अनुसार बाली लगाउनुहोस्' : 'Plant crops according to season',
            language === 'ne' ? 'माटो परीक्षण गर्नुहोस्' : 'Test your soil regularly'
          ],
          tips: [
            language === 'ne' ? 'कृषि विशेषज्ञसँग सल्लाह लिनुहोस्' : 'Consult agricultural experts'
          ]
        });
      }
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadData(), loadRecommendations()]);
    } catch (e) {
      // ignore - individual functions handle errors where appropriate
    } finally {
      setRefreshing(false);
    }
  };

  const openChat = () => {
    setChatMessages([]);
    setChatInput('');
    setChatVisible(true);
  };

  const sendChat = async () => {
    console.log('📤 AgriBot: Sending chat message:', chatInput);
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatInput('');

    // Add user message to chat
    const newUserMessage = {
      id: Date.now().toString(),
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    setChatLoading(true);
    try {
      const storedGeminiLang = await AsyncStorage.getItem('gemini_language');
      const lang = storedGeminiLang === 'ne' ? 'ne' : 'en';
      console.log('🌐 AgriBot: Using language:', lang);
      const resp = await GeminiDiseaseService.ask(userMessage, lang);
      console.log('✅ AgriBot: Got response:',);

      // Add bot response to chat
      const newBotMessage = {
        id: (Date.now() + 1).toString(),
        text: resp,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newBotMessage]);
    } catch (e) {
      console.error('❌ AgriBot error:', e);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, could not reach AgriBot.',
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const features = [
    { id: "crops", title: t('crops'), subtitle: t('library'), icon: "leaf", color: "#10B981", route: "/crops" },
    { id: "tools", title: t('tools'), subtitle: t('tools'), icon: "construct", color: "#3B82F6", route: "/tools" },
    { id: "tips", title: t('tips'), subtitle: t('tips'), icon: "bulb", color: "#F59E0B", route: "/tips" },
  ];

  // Function to get crop icon images (using local assets)
  const getCropIcon = (cropName: string) => {
    const name = cropName.toLowerCase();

    // Use local crop images
    if (name.includes('wheat')) return require('../../assets/images/crops/wheat.png');
    if (name.includes('rice')) return require('../../assets/images/crops/rice.png');
    if (name.includes('corn') || name.includes('maize')) return require('../../assets/images/crops/corn.png');
    if (name.includes('potato')) return require('../../assets/images/crops/potato.png');
    if (name.includes('tomato')) return require('../../assets/images/crops/tomato.png');
    if (name.includes('cabbage')) return require('../../assets/images/crops/cabbage.png');
    if (name.includes('cauliflower')) return require('../../assets/images/crops/cauliflower.jpeg');
    if (name.includes('onion')) return require('../../assets/images/crops/onion.png');
    if (name.includes('lentil') || name.includes('dal')) return require('../../assets/images/crops/lentil.png');
    if (name.includes('mustard')) return require('../../assets/images/crops/mustard.png');

    // Default fallback (use wheat as default crop icon)
    return require('../../assets/images/crops/wheat.png');
  };

  // Animated values for draggable FAB - track absolute position
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const fabSize = 64;

  // Initial position (bottom right)
  const initialX = screenWidth - fabSize - 20;
  const initialY = screenHeight - 160;

  const fabX = useSharedValue(initialX);
  const fabY = useSharedValue(initialY);
  const startX = useSharedValue(initialX);
  const startY = useSharedValue(initialY);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    'worklet';
    fabX.value = startX.value + event.nativeEvent.translationX;
    fabY.value = startY.value + event.nativeEvent.translationY;
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    'worklet';
    if (event.nativeEvent.state === State.BEGAN) {
      // Store the current position when gesture starts
      startX.value = fabX.value;
      startY.value = fabY.value;
    } else if (event.nativeEvent.state === State.END) {
      // Snap to edges
      if (fabX.value + fabSize / 2 < screenWidth / 2) {
        // Snap to left
        fabX.value = withSpring(20);
      } else {
        // Snap to right
        fabX.value = withSpring(screenWidth - fabSize - 20);
      }

      // Keep within vertical bounds
      const minY = insets.top + 100;
      const maxY = screenHeight - 160;

      if (fabY.value < minY) {
        fabY.value = withSpring(minY);
      } else if (fabY.value > maxY) {
        fabY.value = withSpring(maxY);
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    left: fabX.value,
    top: fabY.value,
  }));

  // Dynamic text card positioning based on FAB position
  const textCardStyle = useAnimatedStyle(() => {
    const isOnLeftSide = fabX.value < screenWidth / 2;
    return {
      left: isOnLeftSide ? 64 : undefined, // Right of icon when on left
      right: isOnLeftSide ? undefined : -80, // Left of icon when on right (negative to go beyond icon bounds)
      top: '50%',
      transform: [{ translateY: -12 }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.username}>{username}</Text>
        </View>
        <Link href="/account" asChild>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {/* Hero: AI Scanner */}
        <TouchableOpacity
          style={[styles.scanCard, { backgroundColor: isDark ? '#1F2937' : '#22C55E' }]}
          onPress={() => router.push("/disease-detection")}
          activeOpacity={0.9}
        >
          <View style={styles.scanContent}>
            <View style={styles.scanBadge}>
              <Ionicons name="sparkles" size={12} color="#FBBF24" />
              <Text style={styles.scanBadgeText}>{t('aiPowered')}</Text>
            </View>
            <Text style={[styles.scanTitle, { color: '#FFF' }]}>{t('scanPlant')}</Text>
            <Text style={[styles.scanSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>{t('scanSubtitle')}</Text>
          </View>
          <Ionicons name="scan-circle" size={64} color="#FFF" />
        </TouchableOpacity>

        {/* Feature Grid */}
        <Text style={styles.sectionTitle}>{t('essentials')}</Text>
        <View style={styles.grid}>
          {features.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.featureCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Seasonal Recommendations Widget */}
        <TouchableOpacity
          style={styles.widgetCard}
          onPress={() => router.push({ pathname: "/(tabs)/crops", params: { tab: 'calendar' } })}
        >
          <View style={styles.widgetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.widgetTitle}>{t('bestForMonth').replace('{month}', currentMonth)}</Text>
              <Text style={styles.widgetSub}>{t('recommendedPlanting')}</Text>
            </View>
            <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
          </View>

          {seasonalCrops.length > 0 ? (
            <View style={styles.cropList}>
              {seasonalCrops.map((crop, index) => (
                <View key={index} style={styles.cropTag}>
                  <Ionicons name="leaf" size={12} color={colors.primary} />
                      <Text style={styles.cropTagText}>{crop.crop}</Text>
                </View>
              ))}
                  <Text style={styles.moreText}>+ {t('getStarted')}</Text>
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
              Check the full calendar for details.
            </Text>
          )}
        </TouchableOpacity>

        {/* Recommended Crops Section */}
        {recommendations && (
          <View style={styles.cropsSection}>
            <View style={styles.cropsHeader}>
              <Ionicons name="leaf" size={24} color="#10B981" />
              <Text style={styles.cropsTitle}>Recommended Crops for {currentMonth}</Text>
            </View>

            <View style={styles.cropsGrid}>
              {recommendations.recommendations.map((rec, index) => {
                // Extract and clean crop name from the recommendation text
                let cropName = rec.split(' - ')[0] || rec.split(': ')[0] || rec;
                // Remove ** symbols and clean up the text
                cropName = cropName.replace(/\*\*/g, '').replace(/\*/g, '').trim();
                // Extract just the main crop name (remove parentheses content if present)
                const mainCropName = cropName.split('(')[0].trim();

                const reason = rec.split(' - ')[1] || rec.split(': ')[1] || 'Great choice for this season';

                return (
                  <View key={index} style={styles.cropCard}>
                    <View style={styles.cropIcon}>
                      <Image
                        source={getCropIcon(mainCropName)}
                        style={styles.cropIconImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.cropName}>{mainCropName}</Text>
                    <Text style={styles.cropReason}>{reason}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* AI Tips Section */}
        {recommendations && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsBadge}>
                <Ionicons name="bulb" size={16} color="#F59E0B" />
                <Text style={styles.tipsBadgeText}>Smart Tips</Text>
              </View>
            </View>

            <View style={styles.tipsContent}>
              {recommendations.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipBullet}>
                    <Text style={styles.tipBulletText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {recommendationsLoading && (
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationsHeader}>
              <View style={styles.recommendationsBadge}>
                <Ionicons name="sparkles" size={14} color="#F59E0B" />
                <Text style={styles.recommendationsBadgeText}>AI Insights</Text>
              </View>
              <Text style={styles.recommendationsTitle}>Loading AI Recommendations...</Text>
            </View>
            <View style={styles.loadingIndicator}>
              <View style={styles.loadingDot} />
              <View style={[styles.loadingDot, styles.loadingDotDelay]} />
              <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating AgriBot Button */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={[styles.fab, animatedStyle]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openChat}
            style={{ flex: 1 }}
          >
            <View style={styles.fabInner}>
              <Image source={require('../../assets/images/agribot.png')} style={styles.fabImage} />
            </View>
            <View style={styles.fabLabel}>
              <Text style={styles.fabLabelText}>AgriBot</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>

      {/* AgriBot Chat Modal */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.chatOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.chatPanel}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <Image source={require('../../assets/images/agribot.png')} style={styles.chatAvatar} />
                <View>
                  <Text style={styles.chatTitle}>AgriBot</Text>
                  <Text style={styles.chatSubtitle}>AI Farming Assistant</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Messages Area */}
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              ref={(ref) => {
                if (ref && chatMessages.length > 0) {
                  setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
                }
              }}
            >
              {chatMessages.length === 0 && (
                <View style={styles.welcomeMessage}>
                  <Image source={require('../../assets/images/agribot.png')} style={styles.welcomeAvatar} />
                  <View style={styles.welcomeBubble}>
                    <Text style={styles.welcomeText}>
                      👋 Hi! I'm AgriBot, your AI farming assistant!
                    </Text>
                    <Text style={styles.welcomeSubtext}>
                      Ask me about crops, pests, fertilizers, or any farming questions.
                    </Text>
                  </View>
                </View>
              )}

              {chatMessages.map((message) => (
                <View key={message.id} style={[
                  styles.messageRow,
                  message.isUser ? styles.userMessageRow : styles.botMessageRow
                ]}>
                  {!message.isUser && (
                    <Image source={require('../../assets/images/agribot.png')} style={styles.messageAvatar} />
                  )}
                  <View style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.botBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      message.isUser ? styles.userMessageText : styles.botMessageText
                    ]}>
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}

              {chatLoading && (
                <View style={styles.botMessageRow}>
                  <Image source={require('../../assets/images/agribot.png')} style={styles.messageAvatar} />
                  <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={[styles.typingDot, styles.typingDotDelay]} />
                      <View style={[styles.typingDot, styles.typingDotDelay2]} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Ask AgriBot about farming..."
                  placeholderTextColor={colors.textSecondary}
                  style={styles.chatInputField}
                  editable={!chatLoading}
                  onSubmitEditing={sendChat}
                  returnKeyType="send"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={sendChat}
                  style={[styles.sendButton, (!chatInput.trim() || chatLoading) && styles.sendButtonDisabled]}
                  disabled={!chatInput.trim() || chatLoading}
                >
                  <Ionicons
                    name={chatLoading ? 'hourglass' : 'send'}
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} animationType="slide" transparent={false}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.onboardingContent}>

            {/* Hero */}
            <View style={styles.onboardingHero}>
              <View style={styles.onboardingIconCircle}>
                <Ionicons name="leaf" size={48} color="#FFF" />
              </View>
              <Text style={styles.onboardingTitle}>Welcome to AgriFarm!</Text>
              <Text style={styles.onboardingSubtitle}>Your Smart Farming Companion</Text>
            </View>

            {/* Form */}
            <View style={styles.onboardingForm}>
              <Text style={styles.formLabel}>What's your name?</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Aman Sharma"
                placeholderTextColor={colors.textSecondary}
                value={onboardingName}
                onChangeText={setOnboardingName}
                autoFocus
              />

              <Text style={[styles.formLabel, { marginTop: spacing.l }]}>Select your region</Text>
              <Text style={styles.formHelper}>This helps us provide better recommendations</Text>

              <View style={styles.regionGrid}>
                {REGIONS.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.regionCard,
                      onboardingRegion === r.key && styles.regionCardActive
                    ]}
                    onPress={() => setOnboardingRegion(r.key)}
                  >
                    <Text style={[
                      styles.regionCardTitle,
                      onboardingRegion === r.key && styles.regionCardTitleActive
                    ]}>
                      {r.label}
                    </Text>
                    <Text style={[
                      styles.regionCardDesc,
                      onboardingRegion === r.key && styles.regionCardDescActive
                    ]}>
                      {r.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.onboardingButton} onPress={handleOnboardingComplete}>
                <Text style={styles.onboardingButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: any, spacing: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fab: {
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'center',
  },

  fabInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2ecc71',
    borderWidth: 2,
    borderColor: '#1f7a36',

    justifyContent: 'center',
    alignItems: 'center',

    // Android shadow
    elevation: 8,

    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },

  fabImage: {
    width: 86,
    height: 86,
    resizeMode: 'contain',
  },

  fabLabel: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,

    backgroundColor: '#ffffff',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#d0dcd2',
  },

  fabLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f7a36',
  },

  /* Modern Chat UI */

  chatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  chatPanel: {
    height: '75%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  chatSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  closeButton: {
    padding: 4,
  },

  messagesContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },

  welcomeMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  welcomeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },

  welcomeBubble: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    maxWidth: '75%',
    borderWidth: 1,
    borderColor: colors.border,
  },

  welcomeText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },

  welcomeSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },

  userMessageRow: {
    justifyContent: 'flex-end',
  },

  botMessageRow: {
    justifyContent: 'flex-start',
  },

  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },

  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  userBubble: {
    backgroundColor: colors.primary,
    marginLeft: 40,
  },

  botBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 40,
  },

  typingBubble: {
    paddingVertical: 8,
  },

  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },

  userMessageText: {
    color: '#fff',
  },

  botMessageText: {
    color: colors.text,
  },

  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
    marginHorizontal: 2,
    opacity: 0.6,
  },

  typingDotDelay: {
    animationDelay: '0.2s',
  },

  typingDotDelay2: {
    animationDelay: '0.4s',
  },

  inputContainer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  chatInputField: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    minHeight: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },

  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  sendButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingTop: insets.top + spacing.m,
    paddingBottom: spacing.l,
  },
  greeting: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
  username: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
  },
  scanCard: {
    borderRadius: 24,
    padding: spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  scanContent: {
    flex: 1,
    marginRight: spacing.m,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.m,
  },
  scanBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  scanTitle: {
    fontSize: typography.sizes.header,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  scanSubtitle: {
    fontSize: typography.sizes.base,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.m,
    marginLeft: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  featureCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  featureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  widgetCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  widgetSub: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  cropList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  cropTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropTagText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  moreText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Onboarding Modal Styles
  onboardingContent: {
    paddingTop: insets.top + spacing.xxl,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl,
  },
  onboardingHero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  onboardingIconCircle: {
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
  onboardingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  onboardingSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
  onboardingForm: {},
  formLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.s,
  },
  formHelper: {
    fontSize: typography.sizes.mobile,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  formInput: {
    backgroundColor: colors.card,
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
    marginBottom: spacing.l,
  },
  regionCard: {
    backgroundColor: colors.card,
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  regionCardActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  regionCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  regionCardTitleActive: {
    color: colors.primary,
  },
  regionCardDesc: {
    fontSize: typography.sizes.mobile,
    color: colors.textSecondary,
  },
  regionCardDescActive: {
    color: colors.primary,
    opacity: 0.8,
  },
  onboardingButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: spacing.s,
  },
  onboardingButtonText: {
    color: '#FFF',
    fontSize: typography.sizes.large,
    fontWeight: 'bold',
  },

  // AI Recommendations Styles
  recommendationsCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  recommendationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: spacing.m,
  },
  recommendationsBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  recommendationsContent: {},
  recommendationsSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.s,
    marginTop: spacing.s,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  recommendationBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
    marginTop: 2,
  },
  recommendationBulletText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipIcon: {
    marginRight: spacing.s,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  loadingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.l,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
    opacity: 0.6,
  },
  loadingDotDelay: {
    animationDelay: '0.2s',
  },
  loadingDotDelay2: {
    animationDelay: '0.4s',
  },

  // Recommended Crops Section Styles
  cropsSection: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  cropsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.m,
    flex: 1,
  },
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cropCard: {
    width: '48%',
    backgroundColor: colors.cardMuted,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  cropIconImage: {
    width: 32,
    height: 32,
  },
  cropName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cropReason: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Tips Section Styles
  tipsCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
  },
  tipsHeader: {
    marginBottom: spacing.m,
  },
  tipsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipsBadgeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tipsContent: {},
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
    marginTop: 2,
  },
  tipBulletText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
});
