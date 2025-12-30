import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import GeminiChatService, { ChatMessage } from '../services/geminiChatService';
import { useTheme } from '../theme/ThemeProvider';

interface AgriBotModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function AgriBotModal({ visible, onClose }: AgriBotModalProps) {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible && messages.length === 0) {
            // Initialize chat only when opened and empty
            const initChat = async () => {
                try {
                    await GeminiChatService.startChat(i18n.language);
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
    }, [visible, i18n.language]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: inputText.trim(),
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
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
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        return (
            <View
                style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.botBubble,
                    {
                        backgroundColor: isUser ? colors.primary : colors.card,
                        borderColor: isUser ? colors.primary : colors.border,
                        alignSelf: isUser ? 'flex-end' : 'flex-start'
                    }
                ]}
            >
                <Text style={[
                    styles.messageText,
                    { color: isUser ? '#FFFFFF' : colors.text }
                ]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('agribot.title')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.chatContainer, { paddingBottom: 20 }]}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('agribot.typing')}</Text>
                        </View>
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                        style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}
                    >
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            placeholder={t('agribot.inputPlaceholder')}
                            placeholderTextColor={colors.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: colors.primary }]}
                            onPress={handleSend}
                            disabled={isLoading}
                        >
                            <Ionicons name="send" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        flex: 1,
        marginTop: 50, // Leave some space at top
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    chatContainer: {
        padding: 16,
        flexGrow: 1,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    userBubble: {
        borderBottomRightRadius: 4,
    },
    botBubble: {
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    loadingContainer: {
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        marginRight: 10,
        borderWidth: 1,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
