import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'en' | 'ne';
const STORAGE_KEY = 'language';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    account: 'Account',
    editProfile: 'Edit Profile',
    displayName: 'Display Name',
    selectRegion: 'Select Region',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    preferences: 'Preferences',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    language: 'Language',
    geminiLanguageShort: 'Gemini Language',
    geminiLanguageNote: 'This controls the language of AI guidance from Gemini only — the app UI and PlantNet labels stay in English.',
    advanced: 'Advanced',
    advancedDescription: 'Advanced AI settings',
    about: 'About',
    aboutText: 'AgriFarm is developed by 3 students (Chirayu, Dhiraj, Yogesh) which helps Nepali farmers plan their crops based on their province and the current Nepali month. Get personalized recomendations.',
    version: 'Version',

    scanPlant: 'Scan Plant',
    tapToScan: 'Tap to Scan Leaf',
    howItWorks: 'How it works',
    howItWorksText: '• Take a clear photo of the affected plant part\n• PlantNet AI analyzes the image for diseases\n• Get detailed results with similar cases',
    uploadFromGallery: 'or upload from gallery',
    checkHealth: 'Check Health',
    analyzing: 'Analyzing leaf patterns...',
    matches: 'Matches',
    actionRequired: 'Action Required',
    treatmentPrevention: 'Analysis & Care Guide',
    recommendedSolutions: 'Care Recommendations:',
    generalTips: 'General Tips:',
    essentials: 'Essentials',
    aiPowered: 'AI POWERED',
    scanSubtitle: 'Take a photo to detect diseases instantly.',
    bestForMonth: 'Best for {month}',
    recommendedPlanting: 'Recommended planting now',
    welcomeTitle: 'Welcome to AgriFarm!',
    welcomeSubtitle: 'Your Smart Farming Companion',
    onboardingNameQuestion: "What's your name?",
    selectRegionOnboarding: 'Select your region',
    nameRequired: 'Name Required',
    getStarted: 'Get Started',
    crops: 'Crops',
    tools: 'Tools',
    tips: 'Tips',
    cropsDatabase: 'Crops Database',
    noCropsFound: 'No crops found for this selection.',
    calendar: 'Calendar',
    library: 'Library',
    fertilizer: 'Fertilizer',
    seeds: 'Seeds',
    searchPlaceholder: 'Search...',
    sowing: 'Sowing',
    calculateOutput: 'Calculate Output',
    convert: 'Convert',
    result: 'Result',
    estimatedHarvest: 'Estimated Harvest',
    cropYieldEstimator: 'Crop Yield Estimator',
    estimateYourHarvest: 'Estimate your harvest based on land size and crop type.',
    cropType: 'Crop Type',
    landArea: 'Land Area (Ropani)',
    farmingTips: 'Farming Tips',
    all: 'All',
    watering: 'Watering',
    planting: 'Planting',
    harvesting: 'Harvesting',
    home: 'Home',
  },
  ne: {
    account: 'अकाउन्ट',
    editProfile: 'प्रोफाइल सम्पादन',
    displayName: 'नाम',
    selectRegion: 'क्षेत्र छान्नुहोस्',
    saveChanges: 'परिवर्तन सुरक्षित गर्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    preferences: 'रुचिहरु',
    darkMode: 'डार्क मोड',
    notifications: 'सूचनाहरू',
    language: 'भाषा',
    geminiLanguageShort: 'Gemini भाषा',
    geminiLanguageNote: 'यो केवल Gemini बाट आउने AI सल्लाहको भाषा परिवर्तन गर्छ — एप UI र PlantNet लेबलहरू अंग्रेजीमै रहनेछन्।',
    advanced: 'उन्नत',
    advancedDescription: 'उन्नत AI सेटिङ्स',
    about: 'बारेमा',
    aboutText: 'AgriFarm लाई ३ वटा विद्यार्थीहरुले (चिरयु , धिरज , योगेश ) विकास गरेको हो जसले नेपाली किसानहरुलाई उनीहरुको प्रदेश र हालको नेपाली महिनाको आधारमा बाली योजना बनाउन मद्दत गर्छ।',
    version: 'संस्करण',

    scanPlant: 'बिरुवा जाँच गर्नुहोस्',
    tapToScan: 'पात जाँच गर्न थिच्नुहोस्',
    howItWorks: 'यो कसरी काम गर्छ',
    howItWorksText: '• प्रभावित बिरुवाको भागको स्पष्ट फोटो लिनुहोस्\n• PlantNet AI ले रोगको विश्लेषण गर्छ\n• मिल्दोजुल्दो केसहरूका विस्तृत नतिजाहरू प्राप्त गर्नुहोस्',
    uploadFromGallery: 'वा ग्यालरीबाट अपलोड गर्नुहोस्',
    checkHealth: 'स्वास्थ्य जाँच',
    analyzing: 'पातको नमूनाहरू विश्लेषण हुँदै...',
    matches: 'म्याचहरू',
    actionRequired: 'कार्य आवश्यक',
    treatmentPrevention: 'विश्लेषण र हेरचाह गाइड',
    recommendedSolutions: 'सुझाव गरिएको हेरचाह:',
    generalTips: 'सामान्य सुझाव:',
      essentials: 'महत्वपूर्ण',
      aiPowered: 'एआई संचालित',
      scanSubtitle: 'रोग पत्ता लगाउन फोटो लिनुहोस्।',
      bestForMonth: '{month} को लागि उपयुक्त',
      recommendedPlanting: 'अहिले रोप्न सिफारिस',
      welcomeTitle: 'AgriFarm मा स्वागत छ!',
      welcomeSubtitle: 'तपाईंको स्मार्ट कृषी सहायक',
      onboardingNameQuestion: 'तपाईंको नाम के हो?',
      selectRegionOnboarding: 'आफ्नो क्षेत्र छान्नुहोस्',
      nameRequired: 'नाम आवश्यक छ',
      getStarted: 'सुरु गर्नुहोस्',
      crops: 'बालीहरू',
      tools: 'उपकरणहरू',
      tips: 'सुझावहरू',
      cropsDatabase: 'बाली डाटाबेस',
      noCropsFound: 'यो चयनको लागि कुनै बाली फेला परेन।',
      calendar: 'क्यालेन्डर',
      library: 'पुस्तकालय',
      fertilizer: 'फलाम/मल',
      seeds: 'बिउहरू',
      searchPlaceholder: 'खोज...',
      sowing: 'बिउ रोप्ने',
      calculateOutput: 'उत्पादन गणना',
      convert: 'रूपान्तरण',
      result: 'परिणाम',
      estimatedHarvest: 'अनुमानित उत्पादन',
      cropYieldEstimator: 'बाली उत्पादन अनुमानकर्ता',
      estimateYourHarvest: 'भूमिको आकार र बालीको प्रकार अनुसार आफ्नो उत्पादन अनुमान लगाउनुहोस्।',
      cropType: 'बाली प्रकार',
      landArea: 'भूमिको आकार (रोपनी)',
      farmingTips: 'कृषि सुझावहरू',
      all: 'सबै',
      watering: 'सिचाइ',
      planting: 'रोपाइँ',
      harvesting: 'पुन: फलक्षेप',
      home: 'गृह',
  }
};

let current: Lang = 'en';
const listeners = new Set<(lang: Lang) => void>();

export function t(key: string) {
  return translations[current][key] ?? key;
}

/**
 * Return translated value for `key` if present, otherwise return `fallback`.
 */
export function tOr(key: string, fallback: string) {
  return translations[current][key] ?? fallback;
}

export function getLanguage() {
  return current;
}

export async function setLanguage(lang: Lang) {
  current = lang;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    console.warn('Failed to persist language', e);
  }
  listeners.forEach((cb) => cb(current));
}

export async function initLanguage() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'ne') {
      // Use setLanguage so listeners are notified
      await setLanguage(stored);
    }
  } catch (e) {
    // ignore
  }
}

export function subscribe(cb: (lang: Lang) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export default { t, setLanguage, getLanguage, initLanguage, subscribe };
