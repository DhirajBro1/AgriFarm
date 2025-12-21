/**
 * CSVParser - Utility class for parsing and managing crop data from CSV files
 *
 * This singleton class handles loading, parsing, and querying crop data from multiple CSV files:
 * - clean.csv: Main crop database with growing information
 * - requirements_for_crops.csv: Fertilizer and spacing requirements
 * - grown.csv: Regional growing seasons and sowing times
 * - ph.csv: Soil pH requirements for different crops
 */

/**
 * Interface representing complete crop information
 * Combines data from multiple CSV sources
 */
export interface CropData {
  crop: string; // Crop name (e.g., "Tomato", "Rice")
  variety: string; // Variety name (e.g., "Hybrid", "Local")
  sn?: number; // Serial number from dataset
  highHillSowing?: string; // Best sowing months for high hills (above 2000m)
  midHillSowing?: string; // Best sowing months for mid hills (600-2000m)
  teraiSowing?: string; // Best sowing months for terai plains (below 600m)
  compost: number; // Compost requirement (tons per hectare)
  nitrogen: number; // Nitrogen requirement (kg per hectare)
  phosphorus: number; // Phosphorus requirement (kg per hectare)
  potassium: number; // Potassium requirement (kg per hectare)
  plantSpacing: number; // Spacing between plants (cm)
  rowSpacing: number; // Spacing between rows (cm)
  seedRate: string; // Seed requirement (kg per hectare or plants per hectare)
  maturityDays: string; // Days from planting to harvest
  yield: string; // Expected yield (tons per hectare)
  remarks: string; // Additional notes and recommendations
}

/**
 * Interface for soil pH data
 * Contains optimal pH ranges for different crops
 */
export interface PHData {
  vegetable: string; // Vegetable/crop name
  optimalPHRange: string; // Optimal pH range (e.g., "6.0-7.0")
  categoryPreference: string; // pH category preference (acidic, neutral, alkaline)
}

/**
 * Interface for crop fertilizer and spacing requirements
 * Data from requirements_for_crops.csv
 */
export interface CropRequirement {
  crop: string; // Crop name
  variety: string; // Variety name
  compost: number; // Organic compost requirement
  nitrogen: number; // Nitrogen fertilizer requirement
  phosphorus: number; // Phosphorus fertilizer requirement
  potassium: number; // Potassium fertilizer requirement
  plantSpacing: number; // Plant-to-plant spacing
  rowSpacing: number; // Row-to-row spacing
  seedRate: string; // Seed rate requirement
  maturityDays: string; // Time to maturity
  yield: string; // Expected yield
  remarks: string; // Additional notes
}

/**
 * Interface for crop growing seasons by region
 * Data from grown.csv with regional sowing information
 */
export interface CropGrowingInfo {
  crop: string; // Crop name
  variety: string; // Variety name
  highHillSowing?: string; // Sowing months for high altitude regions
  midHillSowing?: string; // Sowing months for mid-altitude regions
  teraiSowing?: string; // Sowing months for low altitude regions
  remarks: string; // Growing tips and notes
}

/**
 * Mock/fallback crop data used when CSV files cannot be loaded
 * Provides essential crop information for development and testing
 */
const MOCK_CROPS_DATA: CropData[] = [
  {
    crop: "Potato",
    variety: "Kufri Jyoti",
    sn: 1,
    highHillSowing: "Falgun–Chaitra",
    midHillSowing: "Asoj–Kartik",
    teraiSowing: "Kartik–Mangsir",
    compost: 1000,
    nitrogen: 10.0,
    phosphorus: 12.0,
    potassium: 8.0,
    plantSpacing: 20,
    rowSpacing: 60,
    seedRate: "100 kg",
    maturityDays: "100–110",
    yield: "2000–2500",
    remarks: "Mid-hill high production",
  },
  {
    crop: "Potato",
    variety: "Janak Dev",
    sn: 2,
    highHillSowing: "Baisakh–Jestha",
    midHillSowing: "Falgun–Chaitra",
    teraiSowing: "Asoj–Kartik",
    compost: 1000,
    nitrogen: 10.0,
    phosphorus: 12.0,
    potassium: 8.0,
    plantSpacing: 20,
    rowSpacing: 60,
    seedRate: "100 kg",
    maturityDays: "100–110",
    yield: "2000–2500",
    remarks: "High altitude variety",
  },
  {
    crop: "Sweet Potato",
    variety: "Local",
    sn: 6,
    highHillSowing: "Baisakh–Jestha",
    midHillSowing: "Falgun–Chaitra",
    teraiSowing: "Bhadra–Asoj",
    compost: 2000,
    nitrogen: 4.0,
    phosphorus: 3.0,
    potassium: 3.0,
    plantSpacing: 30,
    rowSpacing: 60,
    seedRate: "1500 cuttings",
    maturityDays: "Not Specified",
    yield: "1500–2000",
    remarks: "",
  },
  {
    crop: "Cabbage",
    variety: "Green Coronet",
    sn: 20,
    highHillSowing: "Baisakh–Jestha",
    midHillSowing: "Bhadra–Poush",
    teraiSowing: "Kartik–Magh",
    compost: 1500,
    nitrogen: 8.0,
    phosphorus: 6.0,
    potassium: 4.0,
    plantSpacing: 45,
    rowSpacing: 45,
    seedRate: "20 g (700 seedlings)",
    maturityDays: "70–80",
    yield: "Not Specified",
    remarks: "",
  },
  {
    crop: "Cauliflower",
    variety: "Snow King",
    sn: 23,
    highHillSowing: "Baisakh–Jestha",
    midHillSowing: "Bhadra–Kartik",
    teraiSowing: "Asoj–Mangsir",
    compost: 1500,
    nitrogen: 8.0,
    phosphorus: 6.0,
    potassium: 4.0,
    plantSpacing: 45,
    rowSpacing: 45,
    seedRate: "20 g (700 seedlings)",
    maturityDays: "Not Specified",
    yield: "Not Specified",
    remarks: "",
  },
  {
    crop: "Carrot",
    variety: "Pusa Kesar",
    sn: 15,
    midHillSowing: "Jestha–Bhadra",
    teraiSowing: "Asoj–Mangsir",
    compost: 1000,
    nitrogen: 3.0,
    phosphorus: 4.0,
    potassium: 3.0,
    plantSpacing: 10,
    rowSpacing: 30,
    seedRate: "40 g",
    maturityDays: "Not Specified",
    yield: "Not Specified",
    remarks: "",
  },
  {
    crop: "Radish",
    variety: "Kathmandu Local",
    sn: 17,
    highHillSowing: "Baisakh–Bhadra",
    midHillSowing: "Shrawan–Chaitra",
    teraiSowing: "Asoj–Mangsir",
    compost: 1000,
    nitrogen: 4.0,
    phosphorus: 6.0,
    potassium: 3.0,
    plantSpacing: 15,
    rowSpacing: 30,
    seedRate: "100 g",
    maturityDays: "Not Specified",
    yield: "Not Specified",
    remarks: "",
  },
  {
    crop: "Broccoli",
    variety: "Green Sprouting",
    sn: 25,
    highHillSowing: "Baisakh–Jestha",
    midHillSowing: "Bhadra–Kartik",
    teraiSowing: "Asoj–Mangsir",
    compost: 1500,
    nitrogen: 8.0,
    phosphorus: 6.0,
    potassium: 4.0,
    plantSpacing: 45,
    rowSpacing: 45,
    seedRate: "20 g (700 seedlings)",
    maturityDays: "Not Specified",
    yield: "Not Specified",
    remarks: "",
  },
  {
    crop: "Garlic",
    variety: "Local",
    sn: 27,
    highHillSowing: "Baisakh–Jestha",
    midHillSowing: "Shrawan–Magh",
    teraiSowing: "Asoj–Kartik",
    compost: 1500,
    nitrogen: 12.0,
    phosphorus: 12.0,
    potassium: 4.0,
    plantSpacing: 15,
    rowSpacing: 15,
    seedRate: "2500 g",
    maturityDays: "Not Specified",
    yield: "Not Specified",
    remarks: "",
  },
  {
    crop: "Turnip",
    variety: "Purple Top",
    sn: 29,
    highHillSowing: "Jestha–Shrawan",
    midHillSowing: "Shrawan–Falgun",
    teraiSowing: "Asoj–Mangsir",
    compost: 1000,
    nitrogen: 4.0,
    phosphorus: 6.0,
    potassium: 3.0,
    plantSpacing: 10,
    rowSpacing: 30,
    seedRate: "100 g",
    maturityDays: "Not Specified",
    yield: "Not Specified",
    remarks: "",
  },
];

const MOCK_PH_DATA: PHData[] = [
  {
    vegetable: "Potato",
    optimalPHRange: "5.0-6.0",
    categoryPreference:
      "Acidic (Generally grown in acidic soil to manage potato scab)",
  },
  {
    vegetable: "Sweet Potato",
    optimalPHRange: "5.5-6.8",
    categoryPreference: "Acidic to Mildly Acidic",
  },
  {
    vegetable: "Cabbage",
    optimalPHRange: "6.0-6.8",
    categoryPreference: "Slightly Acidic to Neutral",
  },
  {
    vegetable: "Cauliflower",
    optimalPHRange: "5.5-7.5",
    categoryPreference: "Mildly Acidic to Neutral",
  },
  {
    vegetable: "Carrot",
    optimalPHRange: "5.8-6.8",
    categoryPreference: "Mildly Acidic to Neutral",
  },
  {
    vegetable: "Radish",
    optimalPHRange: "5.8-6.8",
    categoryPreference: "Mildly Acidic to Neutral",
  },
  {
    vegetable: "Garlic",
    optimalPHRange: "5.5-8.0",
    categoryPreference: "Acidic to Alkaline",
  },
  {
    vegetable: "Turnip",
    optimalPHRange: "5.5-6.8",
    categoryPreference: "Mildly Acidic to Neutral",
  },
];

class CSVParser {
  private static instance: CSVParser;
  private cropsData: CropData[] = MOCK_CROPS_DATA;
  private phData: PHData[] = MOCK_PH_DATA;
  private requirementsData: CropRequirement[] = [];
  private growingData: CropGrowingInfo[] = [];
  private initialized = false;

  public static getInstance(): CSVParser {
    if (!CSVParser.instance) {
      CSVParser.instance = new CSVParser();
    }
    return CSVParser.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.requirementsData = this.cropsData.map((crop) => ({
        crop: crop.crop,
        variety: crop.variety,
        compost: crop.compost,
        nitrogen: crop.nitrogen,
        phosphorus: crop.phosphorus,
        potassium: crop.potassium,
        plantSpacing: crop.plantSpacing,
        rowSpacing: crop.rowSpacing,
        seedRate: crop.seedRate,
        maturityDays: crop.maturityDays,
        yield: crop.yield,
        remarks: crop.remarks,
      }));

      this.growingData = this.cropsData.map((crop) => ({
        crop: crop.crop,
        variety: crop.variety,
        highHillSowing: crop.highHillSowing,
        midHillSowing: crop.midHillSowing,
        teraiSowing: crop.teraiSowing,
        remarks: crop.remarks,
      }));

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing CSV parser:", error);
      this.initialized = false;
    }
  }

  public getCropsData(): CropData[] {
    return this.cropsData;
  }

  public getPHData(): PHData[] {
    return this.phData;
  }

  public getRequirementsData(): CropRequirement[] {
    return this.requirementsData;
  }

  public getGrowingData(): CropGrowingInfo[] {
    return this.growingData;
  }

  public getCropsByMonth(
    month: string,
    region: "high" | "mid" | "terai" = "mid",
  ): CropData[] {
    const regionField =
      region === "high"
        ? "highHillSowing"
        : region === "terai"
          ? "teraiSowing"
          : "midHillSowing";

    return this.cropsData.filter((crop) => {
      const sowingPeriod = crop[regionField];
      if (!sowingPeriod) return false;

      return sowingPeriod.includes(month);
    });
  }

  public getCropInfo(cropName: string, variety?: string): CropData | undefined {
    return this.cropsData.find(
      (crop) =>
        crop.crop.toLowerCase() === cropName.toLowerCase() &&
        (!variety || crop.variety.toLowerCase() === variety.toLowerCase()),
    );
  }

  public getCropRequirements(
    cropName: string,
    variety?: string,
  ): CropRequirement | undefined {
    return this.requirementsData.find(
      (crop) =>
        crop.crop.toLowerCase() === cropName.toLowerCase() &&
        (!variety || crop.variety.toLowerCase() === variety.toLowerCase()),
    );
  }

  public getPHInfo(vegetable: string): PHData | undefined {
    return this.phData.find(
      (ph) => ph.vegetable.toLowerCase() === vegetable.toLowerCase(),
    );
  }

  public getAllCrops(): string[] {
    return [...new Set(this.cropsData.map((crop) => crop.crop))].sort();
  }

  public getCropVarieties(cropName: string): string[] {
    return this.cropsData
      .filter((crop) => crop.crop.toLowerCase() === cropName.toLowerCase())
      .map((crop) => crop.variety)
      .filter((variety) => variety !== "Local" && variety !== "")
      .sort();
  }

  public searchCrops(query: string): CropData[] {
    const lowerQuery = query.toLowerCase();
    return this.cropsData.filter(
      (crop) =>
        crop.crop.toLowerCase().includes(lowerQuery) ||
        crop.variety.toLowerCase().includes(lowerQuery) ||
        crop.remarks.toLowerCase().includes(lowerQuery),
    );
  }

  public getFertilizerGuide(cropName: string): {
    compost: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  } | null {
    const cropData = this.getCropInfo(cropName);
    if (!cropData) return null;

    return {
      compost: cropData.compost,
      nitrogen: cropData.nitrogen,
      phosphorus: cropData.phosphorus,
      potassium: cropData.potassium,
    };
  }
}

export default CSVParser;
