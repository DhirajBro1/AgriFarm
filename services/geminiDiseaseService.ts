import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DiseaseSolution {
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
      throw new Error(
        'Gemini API key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.',
      );
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(this.API_KEY);
    }

    return this.genAI;
  }

  /**
   * Gets solutions for a detected plant disease using Gemini AI
   * @param diseaseName - The name of the detected disease
   * @param confidence - The confidence level of the detection (0-1)
   * @param isHealthy - Whether PlantNet considers the plant healthy
   * @param plantName - The name of the plant identified
   * @param language - The target language for the response ('en' or 'ne')
   * @returns Promise<DiseaseSolution> - Solutions and prevention tips
   */
  static async getDiseaseSolutions(
    diseaseName: string,
    confidence: number,
    isHealthy: boolean = true,
    plantName: string = 'the plant',
    language: string = 'en',
  ): Promise<DiseaseSolution> {
    console.log('🔍 Gemini Service: Getting solutions for:', diseaseName, 'on', plantName, 'isHealthy:', isHealthy);

    try {
      const genAI = this.getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const healthStatus = isHealthy ? 'healthy' : 'potentially diseased';
      const outputLanguageInstructions = language.startsWith('ne')
        ? 'IMPORTANT: PROVIDE THE ENTIRE RESPONSE IN NEPALI LANGUAGE (Devanagari script).'
        : 'Provide the response in English.';

      let prompt;
      if (diseaseName === 'General Plant Health') {
        prompt = `
You are an expert agricultural specialist helping a farmer or gardener understand plant health results.

The AI analysis identifies the plant as "${plantName}". It found the plant to be ${healthStatus} with no specific diseases detected.

Please provide general care advice for maintaining healthy ${plantName} plants.
${outputLanguageInstructions}

Format your response as JSON with this exact structure:
{
  "summary": "explanation of the healthy result and general care for ${plantName}",
  "solutions": ["general care tip 1", "general care tip 2", "general care tip 3"],
  "preventionTips": ["prevention tip 1", "prevention tip 2", "prevention tip 3"]
}

Use simple, conversational language.
`;
      } else {
        prompt = `
You are an expert agricultural specialist helping a farmer or gardener understand plant health results.

The AI analysis suggests this is a "${plantName}" plant. It found: "${diseaseName}" with ${(confidence * 100).toFixed(0)}% confidence. The system classified the plant as ${healthStatus}.

Please provide:
1. A simple explanation of what "${diseaseName}" means for "${plantName}" in everyday language
2. What this result means for this specific plant's health
3. 3-5 practical treatment solutions for "${diseaseName}" on "${plantName}"
4. 3-5 prevention tips for this plant

${outputLanguageInstructions}

Format your response as JSON with this exact structure:
{
  "summary": "simple explanation of the ${diseaseName} on ${plantName}",
  "solutions": ["solution 1", "solution 2", "solution 3"],
  "preventionTips": ["tip 1", "tip 2", "tip 3"]
}

Use simple, conversational language. If the plant appears healthy, focus on general care tips for ${plantName}.
`;
      }

      console.log('🤖 Gemini Service: Sending prompt to Gemini API');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('✅ Gemini Service: Response received');

      return this.parseResponse(text, language, diseaseName);

    } catch (error) {
      console.warn('⚠️ Gemini Service Unavailable - Using Offline Fallback:', error);

      const fallback = this.getFallbackResponse(language);

      return {
        diseaseName,
        summary: fallback.summary,
        solutions: fallback.solutions,
        preventionTips: fallback.preventionTips,
      };
    }
  }

  private static parseResponse(text: string, language: string, diseaseName: string): DiseaseSolution {
    let jsonText = text.trim();

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      parsedResponse = this.getFallbackResponse(language);
    }

    return {
      diseaseName,
      summary: parsedResponse.summary || (language.startsWith('ne') ? 'कुनै सारांश उपलब्ध छैन' : 'No summary available'),
      solutions: Array.isArray(parsedResponse.solutions) ? parsedResponse.solutions : [],
      preventionTips: Array.isArray(parsedResponse.preventionTips) ? parsedResponse.preventionTips : [],
    };
  }

  private static getFallbackResponse(language: string) {
    if (language.startsWith('ne')) {
      return {
        summary: 'माफ गर्नुहोस्, हाल विस्तृत AI विश्लेषण उपलब्ध छैन। यहाँ बोटबिरुवा स्वस्थ राख्ने केही सामान्य सुझावहरू छन्:',
        solutions: ['बिरुवामा किरा वा रोगको लक्षण नियमित जाँच गर्नुहोस्।', 'सिँचाइ र मलखादको उचित व्यवस्थापन गर्नुहोस्।', 'रोगी पात वा हाँगाहरू हटाएर जलाउनुहोस्।'],
        preventionTips: ['असल र प्रमाणित बीउको प्रयोग गर्नुहोस्।', 'खेतबारी सधैं सफा राख्नुहोस्।', 'बाली चक्र अपनाउनुहोस्।']
      };
    }
    return {
      summary: 'Sorry, detailed AI analysis is currently unavailable. Here are some general tips to keep your plants healthy:',
      solutions: ['Regularly check plants for signs of pests or disease.', 'Ensure proper watering and fertilization.', 'Remove and destroy any infected plant parts.'],
      preventionTips: ['Use certified healthy seeds.', 'Keep the field clean and weed-free.', 'Practice crop rotation.']
    };
  }

  /**
   * Gets personalized farming recommendations for the home screen
   */
  static async getHomeRecommendations(
    region: string,
    currentMonth: string,
    language: 'en' | 'ne' = 'en'
  ): Promise<{
    title: string;
    recommendations: string[];
    tips: string[];
  }> {
    console.log('🏠 Gemini Home Recommendations: Getting recommendations for region:', region, 'month:', currentMonth, 'language:', language);

    try {
      const genAI = this.getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = language === 'ne'
        ? `तपाईं एक नेपाली कृषि विशेषज्ञ हुनुहुन्छ। ${region} क्षेत्रका लागि ${currentMonth} महिनामा लगाउन मिल्ने मुख्य बालीहरू र 2-3 वटा छोटा व्यावहारिक टिप्सहरू बताउनुहोस्। उत्तर यस ढाँचामा दिनुहोस्:

शीर्षक: [छोटो आकर्षक शीर्षक]
सिफारिसहरू:
- [बालीको नाम र छोटो कारण]
- [बालीको नाम र छोटो कारण]
- [बालीको नाम र छोटो कारण]
- [बालीको नाम र छोटो कारण]
- [बालीको नाम र छोटो कारण]
- [बालीको नाम र छोटो कारण]

टिप्सहरू:
- [छोटो व्यावहारिक टिप]
- [छोटो व्यावहारिक टिप]

क्षेत्र र मौसमलाई विचारमा राखेर छोटो र स्पष्ट उत्तर दिनुहोस्।`
        : `You are a farming expert for Nepal. Provide 5-6 main crops that can be planted in ${region} region during ${currentMonth} month, and 2-3 short practical tips. Format your response exactly like this:

Title: [Short Attractive Title]
Recommendations:
- [Crop name and brief reason]
- [Crop name and brief reason]
- [Crop name and brief reason]
- [Crop name and brief reason]
- [Crop name and brief reason]
- [Crop name and brief reason]

Tips:
- [Short practical tip]
- [Short practical tip]

Keep it very concise. Focus on actionable crop planting advice and simple tips.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);

      let title = '';
      let recommendations: string[] = [];
      let tips: string[] = [];

      let currentSection = '';

      for (const line of lines) {
        if (line.startsWith('शीर्षक:') || line.startsWith('Title:')) {
          title = line.replace(/^(शीर्षक:|Title:)\s*/, '');
        } else if (line === 'सिफारिसहरू:' || line === 'Recommendations:') {
          currentSection = 'recommendations';
        } else if (line === 'टिप्सहरू:' || line === 'Tips:') {
          currentSection = 'tips';
        } else if (line.startsWith('- ') && currentSection === 'recommendations') {
          recommendations.push(line.substring(2));
        } else if (line.startsWith('- ') && currentSection === 'tips') {
          tips.push(line.substring(2));
        }
      }

      // Fallback if parsing fails
      if (!title || recommendations.length === 0) {
        title = language === 'ne'
          ? `${currentMonth} मा ${region} को लागि कृषि सिफारिसहरू`
          : `Farming Recommendations for ${region} in ${currentMonth}`;
        recommendations = [
          language === 'ne' ? 'मौसम अनुसार बाली छनोट गर्नुहोस्' : 'Choose crops according to the season',
          language === 'ne' ? 'माटोको स्वास्थ्य जाँच गर्नुहोस्' : 'Check soil health regularly',
          language === 'ne' ? 'उचित सिंचाइ गर्नुहोस्' : 'Practice proper irrigation'
        ];
        tips = [
          language === 'ne' ? 'हावा र पानीको गुणस्तर हेर्नुहोस्' : 'Monitor weather conditions',
          language === 'ne' ? 'किटनाशकहरूको सुरक्षित प्रयोग गर्नुहोस्' : 'Use pesticides safely'
        ];
      }

      return { title, recommendations, tips };
    } catch (error) {
      console.error('❌ Gemini Home Recommendations Error:', error);

      // Return fallback recommendations
      return {
        title: language === 'ne' ? 'कृषि सिफारिसहरू' : 'Farming Recommendations',
        recommendations: [
          language === 'ne' ? 'मौसम अनुसार बाली लगाउनुहोस्' : 'Plant crops according to season',
          language === 'ne' ? 'माटो परीक्षण गर्नुहोस्' : 'Test your soil regularly',
          language === 'ne' ? 'सिंचाइ प्रणाली सुधार गर्नुहोस्' : 'Improve your irrigation system'
        ],
        tips: [
          language === 'ne' ? 'कृषि विशेषज्ञसँग सल्लाह लिनुहोस्' : 'Consult agricultural experts',
          language === 'ne' ? 'नयाँ कृषि प्रविधिहरू अपनाउनुहोस्' : 'Adopt new farming technologies'
        ]
      };
    }
  }
}

export default GeminiDiseaseService;