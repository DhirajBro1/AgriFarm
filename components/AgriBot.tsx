import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GeminiChatService, { ChatMessage } from '../services/geminiChatService';
import { ThemeColors, useTheme } from '../theme/ThemeProvider';
import { getCurrentNepaliMonth } from '../utils/farmingData';

const SUGGESTIONS = [
    { key: 'pests', icon: 'bug-outline' },
    { key: 'fertilizer', icon: 'water-outline' },
    { key: 'weather', icon: 'cloud-sunny-outline' },
    { key: 'soil', icon: 'earth-outline' },
];

export default function AgriBot() {
    const { colors, typography, spacing, theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(colors, typography, spacing, insets, isDark), [colors, typography, spacing, insets, isDark]);

    const [chatVisible, setChatVisible] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Individual dot animations for typing indicator
    const dot1 = useSharedValue(0);
    const dot2 = useSharedValue(0);
    const dot3 = useSharedValue(0);

    useEffect(() => {
        if (isLoading) {
            const jump = (sv: any, delay: number) => {
                sv.value = withRepeat(
                    withDelay(
                        delay,
                        withSequence(
                            withTiming(-6, { duration: 300 }),
                            withTiming(0, { duration: 300 }),
                            withTiming(0, { duration: 400 })
                        )
                    ),
                    -1
                );
            };
            jump(dot1, 0);
            jump(dot2, 150);
            jump(dot3, 300);
        } else {
            dot1.value = 0;
            dot2.value = 0;
            dot3.value = 0;
        }
    }, [isLoading]);

    const dot1Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
    const dot2Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
    const dot3Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

    useEffect(() => {
        // Re-initialize chat when language changes to update system prompt
        if (messages.length > 0) {
            GeminiChatService.startChat(i18n.language);

            // Optionally update the first welcome message if it's the only one
            if (messages.length === 1 && messages[0].id === 'init') {
                setMessages([{
                    id: 'init',
                    role: 'model',
                    text: t('agribot.welcome'),
                    timestamp: Date.now()
                }]);
            }
        }
    }, [i18n.language]);

    useEffect(() => {
        if (chatVisible && messages.length === 0) {
            const initChat = async () => {
                try {
                    await GeminiChatService.startChat(i18n.language);

                    // Fetch AI suggestions based on context
                    const region = await AsyncStorage.getItem('region') || 'mid';
                    const month = getCurrentNepaliMonth();
                    const aiSuggestions = await GeminiChatService.getSuggestions(i18n.language, region, month);
                    setSuggestions(aiSuggestions);

                    setMessages([{
                        id: 'init',
                        role: 'model',
                        text: t('agribot.welcome'),
                        timestamp: Date.now()
                    }]);
                } catch (e) {
                    console.error("Failed to init chat", e);
                }
            };
            initChat();
        }
    }, [chatVisible]);

    const handleSend = async (customMessage?: string) => {
        const textToSend = customMessage || chatInput.trim();
        if (!textToSend || isLoading) return;

        setChatInput('');
        setSuggestions([]); // Hide suggestions once a message is sent

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: textToSend,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const responseText = await GeminiChatService.sendMessage(userMessage.text);

            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "Sorry, I'm having trouble connecting to the farm network.",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Animated values for draggable FAB
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const fabSize = 80;

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
            startX.value = fabX.value;
            startY.value = fabY.value;
        } else if (event.nativeEvent.state === State.END) {
            if (fabX.value + fabSize / 2 < screenWidth / 2) {
                fabX.value = withSpring(20);
            } else {
                fabX.value = withSpring(screenWidth - fabSize - 20);
            }

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

    return (
        <>
            <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
            >
                <Animated.View style={[styles.fab, animatedStyle]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            setChatVisible(true);
                        }}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.fabInner}>
                            <Image source={require('../assets/images/agribot.png')} style={styles.fabImage} />
                        </View>
                        <View style={styles.fabLabel}>
                            <Text style={styles.fabLabelText}>AgriBot</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </PanGestureHandler>

            <Modal
                visible={chatVisible}
                animationType="slide"
                transparent
                statusBarTranslucent
                onRequestClose={() => setChatVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.chatOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setChatVisible(false)}
                    />
                    <View style={styles.chatPanel}>
                        <View style={styles.chatHeader}>
                            <View style={styles.chatHeaderLeft}>
                                <View style={styles.avatarContainer}>
                                    <Image source={require('../assets/images/agribot.png')} style={styles.chatAvatar} />
                                    <View style={styles.statusIndicator} />
                                </View>
                                <View>
                                    <Text style={styles.chatTitle}>{t('agribot.title')}</Text>
                                    <View style={styles.onlineContainer}>
                                        <Text style={styles.chatSubtitle}>Online Assistant</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setChatVisible(false);
                                }}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.messagesContainer}
                            contentContainerStyle={styles.messagesContent}
                            ref={(ref) => {
                                if (ref && messages.length > 0) {
                                    setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
                                }
                            }}
                        >
                            {messages.length === 0 && (
                                <Animated.View
                                    entering={FadeInDown.duration(600)}
                                    style={styles.welcomeMessage}
                                >
                                    <Image source={require('../assets/images/agribot.png')} style={styles.welcomeAvatar} />
                                    <View style={styles.welcomeBubble}>
                                        <Text style={styles.welcomeText}>
                                            👋 {t('agribot.welcome')}
                                        </Text>
                                        <Text style={styles.welcomeSubtext}>
                                            {t('agribot.welcomeSubtext')}
                                        </Text>
                                    </View>
                                </Animated.View>
                            )}

                            {messages.map((message) => {
                                const isUser = message.role === 'user';
                                return (
                                    <Animated.View
                                        key={message.id}
                                        entering={FadeInDown.springify()}
                                        style={[
                                            styles.messageRow,
                                            isUser ? styles.userMessageRow : styles.botMessageRow
                                        ]}
                                    >
                                        {!isUser && (
                                            <Image source={require('../assets/images/agribot.png')} style={styles.messageAvatar} />
                                        )}
                                        <View style={[
                                            styles.messageBubble,
                                            isUser ? styles.userBubble : styles.botBubble,
                                            {
                                                backgroundColor: isUser ? colors.primary : colors.card,
                                                borderColor: isUser ? colors.primary : colors.border,
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.messageText,
                                                { color: isUser ? '#FFFFFF' : colors.text }
                                            ]}>
                                                {message.text}
                                            </Text>
                                        </View>
                                    </Animated.View>
                                );
                            })}

                            {isLoading && (
                                <Animated.View
                                    entering={FadeInDown}
                                    style={styles.botMessageRow}
                                >
                                    <Image source={require('../assets/images/agribot.png')} style={styles.messageAvatar} />
                                    <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <View style={styles.typingIndicator}>
                                            <Animated.View style={[styles.typingDot, dot1Style, { backgroundColor: colors.primary }]} />
                                            <Animated.View style={[styles.typingDot, dot2Style, { backgroundColor: colors.primary }]} />
                                            <Animated.View style={[styles.typingDot, dot3Style, { backgroundColor: colors.primary }]} />
                                        </View>
                                    </View>
                                </Animated.View>
                            )}
                        </ScrollView>

                        {/* Contextual Suggestion Chips - Only for 1st chat */}
                        {suggestions.length > 0 && messages.filter(m => m.role === 'user').length === 0 && (
                            <View style={styles.suggestionsWrapper}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.suggestionsContainer}
                                >
                                    {suggestions.map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionChip}
                                            onPress={() => handleSend(suggestion)}
                                        >
                                            <View style={styles.suggestionIcon}>
                                                <Ionicons name="sparkles" size={12} color={colors.primary} />
                                            </View>
                                            <Text style={styles.suggestionText}>{suggestion}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                        <View style={styles.inputArea}>
                            <View style={styles.inputContainer}>
                                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <TextInput
                                        value={chatInput}
                                        onChangeText={setChatInput}
                                        placeholder={t('agribot.inputPlaceholder')}
                                        placeholderTextColor={colors.textSecondary}
                                        style={[styles.chatInputField, { color: colors.text }]}
                                        editable={!isLoading}
                                        onSubmitEditing={() => handleSend()}
                                        returnKeyType="send"
                                        multiline
                                        maxLength={500}
                                    />
                                    <TouchableOpacity
                                        onPress={() => handleSend()}
                                        style={[styles.sendButton, { backgroundColor: colors.primary }, (!chatInput.trim() || isLoading) && styles.sendButtonDisabled]}
                                        disabled={!chatInput.trim() || isLoading}
                                    >
                                        <Ionicons
                                            name={isLoading ? 'hourglass' : 'arrow-up'}
                                            size={20}
                                            color="#fff"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const createStyles = (colors: ThemeColors, typography: any, spacing: any, insets: any, isDark: boolean) => StyleSheet.create({
    fab: {
        position: 'absolute',
        zIndex: 9999,
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
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
    },
    fabImage: {
        width: 86,
        height: 86,
        resizeMode: 'contain',
    },
    fabLabel: {
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 5,
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        backdropFilter: 'blur(10px)', // For platforms that support it
    },
    fabLabelText: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    chatOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    chatPanel: {
        height: '80%',
        backgroundColor: colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
        overflow: 'hidden',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
    },
    chatHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 14,
    },
    chatAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary + '20',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2ecc71',
        borderWidth: 2,
        borderColor: colors.card,
    },
    chatTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
    },
    onlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatSubtitle: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.cardMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 20,
        paddingBottom: 40,
    },
    welcomeMessage: {
        alignItems: 'center',
        marginVertical: 40,
    },
    welcomeAvatar: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    welcomeBubble: {
        backgroundColor: colors.card,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    welcomeText: {
        fontSize: 18,
        textAlign: 'center',
        color: colors.text,
        lineHeight: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    welcomeSubtext: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-end',
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
        backgroundColor: colors.primary + '10',
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    userBubble: {
        borderBottomRightRadius: 4,
        backgroundColor: colors.primary,
        marginLeft: 40,
    },
    botBubble: {
        borderBottomLeftRadius: 4,
        backgroundColor: colors.card,
        marginRight: 40,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    typingBubble: {
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 10,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    inputArea: {
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16),
    },
    suggestionsWrapper: {
        marginBottom: 8,
    },
    suggestionsContainer: {
        paddingVertical: 12,
    },
    suggestionsContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardMuted,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
    },
    suggestionIcon: {
        marginRight: 4,
    },
    suggestionText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    inputContainer: {
        paddingHorizontal: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 28,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chatInputField: {
        flex: 1,
        maxHeight: 120,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 16,
        textAlignVertical: 'center',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.4,
        backgroundColor: colors.textSecondary,
    },
});
