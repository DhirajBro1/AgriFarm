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
        const langName = isNepali ? 'Nepali' : 'English';

        return `
You are "AgriBot", an expert agricultural advisor for farmers.
Your goal is to provide helpful, concise, and accurate advice on crops, disease control, weather, and farming techniques.

Instructions:
1. Primary Language: Respond primarily in ${langName}. 
2. Flexibility: If the user asks a question in another language (like English while in Nepali mode, or vice versa), respond in the user's chosen language. Do NOT claim you cannot speak a certain language.
3. Tone: Keep answers simple and easy to understand for farmers.
4. Scope: If asked about non-agricultural topics, politely decline and steer back to farming.
5. Format: Use bullet points for lists to improve readability.
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

            console.log(`🌱 AgriBot: Chat session started (${language})`);
        } catch (error) {
            console.error('❌ AgriBot: Failed to start chat session', error);
            throw error;
        }
    }

    static resetChat(): void {
        this.chatSession = null;
    }

    static async sendMessage(message: string): Promise<string> {
        if (!this.chatSession) {
            await this.startChat();
        }

        try {
            if (!this.chatSession) throw new Error("ChatSession not initialized");

            const result = await this.chatSession.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('❌ AgriBot: Error sending message', error);
            return "Sorry, I'm having trouble connecting to the farm network right now. Please try again later.";
        }
    }

    /**
     * Generates 4 AI-driven suggestion chips for the chat interface.
     */
    static async getSuggestions(language: string, region: string, month: string): Promise<string[]> {
        try {
            const genAI = this.getGenAI();
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const isNepali = language.startsWith('ne');
            const prompt = isNepali
                ? `तपाईं एक कृषि विशेषज्ञ हुनुहुन्छ। ${region} क्षेत्रमा ${month} महिनामा कृषकहरूलाई चाहिने ४ वटा साना र व्यावहारिक प्रश्नहरू (suggestions) सुझाव दिनुहोस्। प्रश्नहरू छोटा र स्पष्ट हुनुपर्छ। उत्तर केवल ४ वटा प्रश्नहरूको सूचीको रूपमा दिनुहोस्, कुनै थप विवरण बिना।`
                : `You are an agricultural expert. Suggest 4 short, practical questions (chips) a farmer in the ${region} region during the month of ${month} might want to ask AgriBot. Keep them very concise. Return ONLY a list of 4 questions, one per line.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            return text.split('\n')
                .map(s => s.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
                .filter(s => s.length > 0)
                .slice(0, 4);
        } catch (error) {
            console.error('❌ AgriBot: Failed to get suggestions', error);
            const isNepali = language.startsWith('ne');
            return isNepali
                ? ["बाली रोगहरू", "मल प्रयोग", "सिंचाइ प्रविधि", "बजार मूल्य"]
                : ["Crop diseases", "Fertilizer use", "Irrigation tips", "Market prices"];
        }
    }
}

export default GeminiChatService;
