/**
 * Farming Data Utility - Contains farming tips, pest information, and unit conversions
 *
 * This module provides:
 * - Farming tips categorized by activity type
 * - Pest and disease information with prevention/treatment
 * - Local Nepali unit conversions to metric system
 * - Nepali calendar month utilities
 * - Helper functions for farming calculations
 */


/**
 * Interface for farming tips and advice
 * Contains practical farming guidance for Nepali farmers
 */
export interface FarmingTip {
  id: string; // Unique identifier for the tip
  title: string; // Short, descriptive title
  description: string; // Detailed explanation of the tip
  category: "watering" | "fertilizer" | "planting" | "harvesting" | "general"; // Tip category
  season?: string; // Optional season when tip is most relevant
  important: boolean; // Whether this is a critical/high-priority tip
}

/**
 * Interface for pest and disease information
 * Provides comprehensive data about crop pests and diseases common in Nepal
 */
export interface PestDiseaseInfo {
  id: string; // Unique identifier
  name: string; // Common name of pest/disease
  type: "pest" | "disease"; // Classification type
  crops: string[]; // List of crops commonly affected
  symptoms: string[]; // Observable symptoms and signs
  prevention: string[]; // Preventive measures
  treatment: string[]; // Treatment options and solutions
  severity: "low" | "medium" | "high"; // Impact severity level
}

/**
 * Interface for local Nepali units and their metric conversions
 * Supports traditional farming units commonly used in Nepal
 */
export interface LocalUnit {
  name: string; // Local unit name (e.g., "Ropani", "Mana", "Pathi")
  category: "area" | "weight" | "volume"; // Unit category
  toMetric: number; // Conversion factor to metric unit
  metricUnit: string; // Equivalent metric unit name
}

/**
 * Collection of practical farming tips for Nepali agriculture
 * Tips are categorized by farming activity and marked by importance
 */
export const FARMING_TIPS: FarmingTip[] = [
  {
    id: "tip_001",
    title: "Avoid Fertilizer Before Rain",
    description:
      "Never apply fertilizer just before heavy rain as it will wash away nutrients and waste money.",
    category: "fertilizer",
    important: true,
  },
  {
    id: "tip_002",
    title: "Best Irrigation Time",
    description:
      "Water plants early morning (6-8 AM) or evening (5-7 PM) to reduce water loss through evaporation.",
    category: "watering",
    important: true,
  },
  {
    id: "tip_003",
    title: "Seed Storage",
    description:
      "Store seeds in dry, cool place in airtight containers to maintain viability for next season.",
    category: "general",
    important: false,
  },
  {
    id: "tip_004",
    title: "Companion Planting",
    description:
      "Plant marigolds with tomatoes and peppers to naturally repel harmful insects.",
    category: "planting",
    important: false,
  },
  {
    id: "tip_005",
    title: "Soil Testing",
    description:
      "Test soil pH every season. Most vegetables prefer slightly acidic to neutral soil (pH 6.0-7.0).",
    category: "general",
    important: true,
  },
  {
    id: "tip_006",
    title: "Harvest Morning",
    description:
      "Harvest vegetables early morning when they are crisp and full of moisture.",
    category: "harvesting",
    important: false,
  },
  {
    id: "tip_007",
    title: "Organic Compost",
    description:
      "Use kitchen scraps and farm waste to make organic compost. It improves soil structure and fertility.",
    category: "fertilizer",
    important: true,
  },
  {
    id: "tip_008",
    title: "Crop Rotation",
    description:
      "Rotate crops each season to prevent soil depletion and reduce pest and disease buildup.",
    category: "planting",
    important: true,
  },
  {
    id: "tip_009",
    title: "Mulching Benefits",
    description:
      "Use organic mulch around plants to retain moisture, suppress weeds, and improve soil.",
    category: "general",
    important: false,
  },
  {
    id: "tip_010",
    title: "Weather Awareness",
    description:
      "Check weather forecast before planting or applying treatments. Timing is crucial for success.",
    category: "general",
    important: true,
  },
];

export const PEST_DISEASE_DATA: PestDiseaseInfo[] = [
  {
    id: "pest_001",
    name: "Aphids",
    type: "pest",
    crops: ["Cabbage", "Cauliflower", "Broccoli", "Potato", "Tomato"],
    symptoms: [
      "Small green or black insects on leaves",
      "Yellowing and curling of leaves",
      "Sticky honeydew on plants",
      "Stunted growth",
    ],
    prevention: [
      "Encourage beneficial insects like ladybugs",
      "Use reflective mulch",
      "Avoid over-fertilizing with nitrogen",
      "Regular inspection of plants",
    ],
    treatment: [
      "Spray with neem oil solution",
      "Use insecticidal soap",
      "Introduce ladybugs or lacewings",
      "Wash off with strong water spray",
    ],
    severity: "medium",
  },
  {
    id: "disease_001",
    name: "Late Blight",
    type: "disease",
    crops: ["Potato", "Tomato"],
    symptoms: [
      "Dark brown spots on leaves",
      "White fuzzy growth under leaves",
      "Black stems and tubers",
      "Rapid plant death in wet conditions",
    ],
    prevention: [
      "Choose resistant varieties",
      "Ensure good air circulation",
      "Avoid overhead watering",
      "Remove infected plant debris",
    ],
    treatment: [
      "Apply copper-based fungicide",
      "Remove and destroy infected plants",
      "Improve drainage",
      "Use certified disease-free seeds",
    ],
    severity: "high",
  },
  {
    id: "pest_002",
    name: "Cutworm",
    type: "pest",
    crops: ["Cabbage", "Cauliflower", "Carrot", "Radish"],
    symptoms: [
      "Seedlings cut at soil level",
      "Young plants toppling over",
      "Holes in leaves near ground",
      "Plants missing in patches",
    ],
    prevention: [
      "Use collar barriers around seedlings",
      "Till soil before planting to expose larvae",
      "Remove weeds and debris",
      "Use companion planting with marigolds",
    ],
    treatment: [
      "Hand-pick caterpillars at night",
      "Apply beneficial nematodes to soil",
      "Use cardboard collars around plants",
      "Apply organic pesticides in evening",
    ],
    severity: "medium",
  },
  {
    id: "disease_002",
    name: "Powdery Mildew",
    type: "disease",
    crops: ["Cucumber", "Pumpkin", "Bottle Gourd"],
    symptoms: [
      "White powdery coating on leaves",
      "Yellowing of infected leaves",
      "Stunted growth",
      "Reduced fruit production",
    ],
    prevention: [
      "Ensure good air circulation",
      "Avoid overhead watering",
      "Choose resistant varieties",
      "Space plants properly",
    ],
    treatment: [
      "Spray with baking soda solution (1 tsp per liter)",
      "Apply neem oil",
      "Remove infected leaves",
      "Use sulfur-based fungicide",
    ],
    severity: "medium",
  },
  {
    id: "pest_003",
    name: "Whitefly",
    type: "pest",
    crops: ["Tomato", "Cucumber", "Cabbage"],
    symptoms: [
      "Small white flying insects",
      "Yellowing leaves",
      "Sticky honeydew",
      "Sooty mold on leaves",
    ],
    prevention: [
      "Use yellow sticky traps",
      "Encourage beneficial insects",
      "Remove weeds around crops",
      "Use reflective mulch",
    ],
    treatment: [
      "Spray with insecticidal soap",
      "Use neem oil",
      "Introduce parasitic wasps",
      "Vacuum adults in morning",
    ],
    severity: "medium",
  },
  {
    id: "disease_003",
    name: "Root Rot",
    type: "disease",
    crops: ["Carrot", "Radish", "Turnip"],
    symptoms: [
      "Brown or black roots",
      "Wilting despite moist soil",
      "Stunted growth",
      "Foul smell from roots",
    ],
    prevention: [
      "Ensure proper drainage",
      "Avoid overwatering",
      "Use raised beds in heavy soil",
      "Rotate crops annually",
    ],
    treatment: [
      "Improve soil drainage",
      "Remove infected plants",
      "Apply beneficial microorganisms",
      "Reduce watering frequency",
    ],
    severity: "high",
  },
];

export const LOCAL_UNITS: LocalUnit[] = [
  {
    name: "Ropani",
    category: "area",
    toMetric: 508.72,
    metricUnit: "m²",
  },
  {
    name: "Aana",
    category: "area",
    toMetric: 31.8,
    metricUnit: "m²",
  },
  {
    name: "Paisa",
    category: "area",
    toMetric: 7.95,
    metricUnit: "m²",
  },
  {
    name: "Dam",
    category: "area",
    toMetric: 1.99,
    metricUnit: "m²",
  },
  {
    name: "Bigha",
    category: "area",
    toMetric: 6772.63,
    metricUnit: "m²",
  },
  {
    name: "Kattha",
    category: "area",
    toMetric: 338.63,
    metricUnit: "m²",
  },
  {
    name: "Dhur",
    category: "area",
    toMetric: 16.93,
    metricUnit: "m²",
  },
  {
    name: "Mana",
    category: "weight",
    toMetric: 0.5,
    metricUnit: "kg",
  },
  {
    name: "Pathi",
    category: "weight",
    toMetric: 2.0,
    metricUnit: "kg",
  },
  {
    name: "Dharni",
    category: "weight",
    toMetric: 2.5,
    metricUnit: "kg",
  },
  {
    name: "Ser",
    category: "weight",
    toMetric: 0.93,
    metricUnit: "kg",
  },
];

export const NEPALI_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashar",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

export const NEPALI_MONTH_MAPPING: { [key: string]: number } = {
  Baisakh: 1,
  Jestha: 2,
  Ashar: 3,
  Shrawan: 4,
  Bhadra: 5,
  Ashwin: 6,
  Kartik: 7,
  Mangsir: 8,
  Poush: 9,
  Magh: 10,
  Falgun: 11,
  Chaitra: 12,
};

export const REGIONS = [
  {
    key: "high" as const,
    label: "High Hills (Above 2000m)",
    description: "Cool climate, high altitude crops",
  },
  {
    key: "mid" as const,
    label: "Mid Hills (600-2000m)",
    description: "Moderate climate, diverse crops",
  },
  {
    key: "terai" as const,
    label: "Terai Plains (Below 600m)",
    description: "Warm climate, rice, wheat crops",
  },
];

export type RegionType = "high" | "mid" | "terai";

export const convertUnit = (
  value: number,
  fromUnit: string,
  toUnit: string,
): number => {
  const from = LOCAL_UNITS.find((u) => u.name === fromUnit);
  const to = LOCAL_UNITS.find((u) => u.name === toUnit);

  if (!from || !to || from.category !== to.category) {
    return value;
  }

  const metricValue = value * from.toMetric;
  return metricValue / to.toMetric;
};

export const formatUnit = (value: number, unit: string): string => {
  return `${value.toFixed(2)} ${unit}`;
};

export const getCurrentNepaliMonth = (): string => {
  const today = new Date();
  const checkpoints = [
    { month: 0, day: 14, nepali: "Magh" }, // Jan 14
    { month: 1, day: 13, nepali: "Falgun" }, // Feb 13
    { month: 2, day: 14, nepali: "Chaitra" }, // Mar 14
    { month: 3, day: 14, nepali: "Baisakh" }, // Apr 14
    { month: 4, day: 15, nepali: "Jestha" }, // May 15
    { month: 5, day: 15, nepali: "Ashar" }, // Jun 15
    { month: 6, day: 17, nepali: "Shrawan" }, // Jul 17
    { month: 7, day: 17, nepali: "Bhadra" }, // Aug 17
    { month: 8, day: 17, nepali: "Ashwin" }, // Sep 17
    { month: 9, day: 18, nepali: "Kartik" }, // Oct 18
    { month: 10, day: 17, nepali: "Mangsir" }, // Nov 17
    { month: 11, day: 16, nepali: "Poush" }, // Dec 16
  ];

  const { month, day } = { month: today.getMonth(), day: today.getDate() };
  let current = checkpoints[checkpoints.length - 1].nepali;

  checkpoints.forEach((point) => {
    if (month > point.month || (month === point.month && day >= point.day)) {
      current = point.nepali;
    }
  });

  return current;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};
