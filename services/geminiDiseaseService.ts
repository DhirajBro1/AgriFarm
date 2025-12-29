import { GoogleGenerativeAI } from '@google/generative-ai';

interface DiseaseSolution {
  diseaseName: string;
  solutions: string[];
  preventionTips: string[];
  summary: string;
}

class GeminiDiseaseService {
  private static readonly API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  private static genAI: GoogleGenerativeAI | null = null;

  private static getGenAI(): GoogleGenerativeAI {
    if (!this.API_KEY) {
      console.error('❌ Gemini API key not found. Current env:', process.env);
      throw new Error(
        'Gemini API key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.',
      );
    }

    if (!this.genAI) {
      console.log('🔑 Initializing Gemini with API key:', this.API_KEY.substring(0, 10) + '...');
      this.genAI = new GoogleGenerativeAI(this.API_KEY);
    }

    return this.genAI;
  }

  /**
   * Gets solutions for a detected plant disease using Gemini AI
   * @param diseaseName - The name of the detected disease
   * @param confidence - The confidence level of the detection (0-1)
   * @param isHealthy - Whether PlantNet considers the plant healthy
   * @returns Promise<DiseaseSolution> - Solutions and prevention tips
   */
  static async getDiseaseSolutions(
    diseaseName: string,
    confidence: number,
    isHealthy: boolean = true,
    language: 'en' | 'ne' = 'en',
  ): Promise<DiseaseSolution> {
    console.log('🔍 Gemini Service: Getting solutions for disease:', diseaseName, 'with confidence:', confidence, 'isHealthy:', isHealthy, 'language:', language);
    
    try {
      const genAI = this.getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const healthStatus = isHealthy ? 'healthy' : 'potentially diseased';
      
      let prompt;
      const langInstruction = language === 'ne' ? 'Respond in Nepali (नेपाली) in clear, simple language.' : 'Respond in English in clear, simple language.';

      if (diseaseName === 'General Plant Health') {
        prompt = `
You are an expert agricultural specialist helping a farmer or gardener understand plant health results.

The AI analysis found the plant to be ${healthStatus} with no specific diseases detected.

Please provide general care advice for maintaining healthy plants:

1. A summary of what this healthy result means
2. General care recommendations for keeping plants healthy
3. Preventive measures to avoid common plant problems

Format your response as JSON with this exact structure:
{
  "summary": "explanation of the healthy result and general plant care",
  "solutions": ["general care tip 1", "general care tip 2", "general care tip 3"],
  "preventionTips": ["prevention tip 1", "prevention tip 2", "prevention tip 3"]
}

Use simple, conversational language that anyone can understand.
`;
      } else {
        prompt = `
You are an expert agricultural specialist helping a farmer or gardener understand plant health results.

The AI analysis found: "${diseaseName}" with ${(confidence * 100).toFixed(0)}% confidence. The system classified the plant as ${healthStatus}.

Please provide:

1. A simple explanation of what "${diseaseName}" means in everyday language (avoid scientific jargon, explain any technical terms)

2. What this result means for the plant's health

3. 3-5 practical treatment solutions (if applicable)

4. 3-5 prevention tips

Format your response as JSON with this exact structure:
{
  "summary": "simple explanation of the disease/result and what it means",
  "solutions": ["solution 1", "solution 2", "solution 3"] (or empty array if not applicable),
  "preventionTips": ["tip 1", "tip 2", "tip 3"]
}

Use simple, conversational language that anyone can understand. If the plant appears healthy, focus on general care tips rather than treatments.
`;
      }

  // Append language instruction so Gemini responds in selected language
  prompt = `${prompt}\n\n${langInstruction}`;

      console.log('🤖 Gemini Service: Sending prompt to Gemini API');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('✅ Gemini Service: Raw response:');

      // Clean the response to extract JSON
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the response
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('🔧 Gemini Service: Cleaned JSON text:');

      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.log('📄 Failed to parse text:', jsonText);
        
        // Fallback: try to extract information manually
        const fallbackResponse = {
          summary: 'Unable to parse AI response. The plant analysis suggests monitoring for common issues.',
          solutions: ['Monitor the plant closely for any changes', 'Ensure proper watering and sunlight', 'Consider consulting a local plant expert'],
          preventionTips: ['Maintain consistent care routine', 'Check for pests regularly', 'Keep plants in appropriate conditions']
        };
        
        console.log('🔄 Using fallback response:', fallbackResponse);
        parsedResponse = fallbackResponse;
      }

      const solution = {
        diseaseName,
        summary: parsedResponse.summary || 'No summary available',
        solutions: Array.isArray(parsedResponse.solutions) ? parsedResponse.solutions : [],
        preventionTips: Array.isArray(parsedResponse.preventionTips) ? parsedResponse.preventionTips : [],
      };

      console.log('🎯 Gemini Service: Parsed solution:' );
      return solution;
    } catch (error) {
      console.error('❌ Gemini Service Error:', error);
      
      // If model not found, try to list available models
    //   if (error.message && error.message.includes('not found')) {
    //     console.log('🔍 Trying to list available Gemini models...');
    //     try {
    //       const genAI = this.getGenAI();
    //       const models = await genAI.listModels();
    //       console.log('📋 Available models:', models);
    //     } catch (listError) {
    //       console.error('❌ Could not list models:', listError);
    //     }
    //   }
      
           throw new Error('Failed to get disease solutions. Please try again.');
    }
  }

  /**
   * Sends a general prompt to Gemini and returns the raw text response.
   * Useful for short chatbot-style queries from the UI (e.g., AgriBot).
   */
  static async ask(prompt: string, language: 'en' | 'ne' = 'en'): Promise<string> {
    console.log('🤖 AgriBot: Asking Gemini with prompt:', prompt, 'language:', language);
    try {
      const genAI = this.getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const langInstruction =
        language === 'ne'
          ? 'Respond in Nepali (नेपाली) in clear, simple language.'
          : 'Respond in English in clear, simple language.';

      const fullPrompt = `${prompt}\n\n${langInstruction}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      let text = response.text();

      if (text.startsWith('```')) {
        text = text.replace(/^```[a-zA-Z\n]*\n?/, '').replace(/\n?```$/, '');
      }

      return text.trim();
    } catch (error) {
      console.error('❌ Gemini ask Error:', error);
      throw new Error('Failed to get response from Gemini.');
    }
  }
}

export default GeminiDiseaseService;
