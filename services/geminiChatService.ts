import { ChatSession, GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

class GeminiChatService {
    private static readonly API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    private static genAI: GoogleGenerativeAI | null = null;
    private static chatSession: ChatSession | null = null;

    private static getGenAI(): GoogleGenerativeAI {
        if (!this.API_KEY) {
            throw new Error(
                'Gemini API key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.',
            );
        }

        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(this.API_KEY);
        }

        return this.genAI;
    }

    private static getSystemPrompt(language: string): string {
        const isNepali = language.startsWith('ne');

        if (isNepali) {
            return `
तपाईं "AgriBot" हुनुहुन्छ, एक विशेषज्ञ कृषि सल्लाहकार।
तपाईंको उद्देश्य कृषकहरूलाई बालीनाली, रोग नियन्त्रण, मौसम, र खेती प्रविधिहरूको बारेमा मद्दत गर्नु हो।

निर्देशनहरू:
१. सधैं नेपाली भाषामा जवाफ दिनुहोस् (देवनागरी लिपि)।
२. जवाफ छोटो, सरल र बुझ्न सजिलो हुनुपर्छ।
३. कृषि बाहेकका विषयमा सोधिएमा, विनम्रतापूर्वक जानकारी दिनुहोस् कि तपाईं केवल कृषिमा मद्दत गर्न सक्नुहुन्छ।
४. सकेसम्म बुँदागत रूपमा (bullet points) जानकारी दिनुहोस्।
`;
        }

        return `
You are "AgriBot", an expert agricultural advisor.
Your goal is to help farmers with crops, disease control, weather, and farming techniques.

Instructions:
1. Always answer in English (unless specifically asked otherwise).
2. Keep answers concise, simple, and easy to understand for farmers.
3. If asked about non-agricultural topics, politely decline and steer back to farming.
4. Use bullet points for lists to improve readability.
`;
    }

    static async startChat(language: string = 'en'): Promise<void> {
        try {
            const genAI = this.getGenAI();
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction: this.getSystemPrompt(language),
            });

            this.chatSession = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 1000,
                },
            });

            console.log('🌱 AgriBot: Chat session started');
        } catch (error) {
            console.error('❌ AgriBot: Failed to start chat session', error);
            throw error;
        }
    }

    static async sendMessage(message: string): Promise<string> {
        if (!this.chatSession) {
            await this.startChat();
        }

        try {
            if (!this.chatSession) throw new Error("Chat session not initialized");

            const result = await this.chatSession.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('❌ AgriBot: Error sending message', error);
            return "Sorry, I'm having trouble connecting to the farm network right now. Please try again later.";
        }
    }
}

export default GeminiChatService;
