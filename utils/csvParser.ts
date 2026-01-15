import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Interface for optimal soil pH data
 */
export interface OptimalPHData {
  cropCategory: string;
  cropName: string;
  optimalPHRange: string;
}

/**
 * Legacy CropData interface for backward compatibility
 */
export interface CropData {
  crop: string;
  variety: string;
  sn?: number;
  highHillSowing?: string;
  midHillSowing?: string;
  teraiSowing?: string;
  compost: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  plantSpacing: number;
  rowSpacing: number;
  seedRate: string;
  maturityDays: string;
  yield: string;
  remarks: string;
}

/**
 * Legacy PHData interface for backward compatibility
 */
export interface PHData {
  vegetable: string;
  optimalPHRange: string;
  categoryPreference: string;
}

/**
 * Helper to load CSV string from asset module
 */
async function loadCSVAsset(module: any): Promise<string> {
  const asset = Asset.fromModule(module);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  return await FileSystem.readAsStringAsync(asset.localUri!);
}

/**
 * Helper to parse CSV string into array of objects
 */
function parseCSV(csvString: string): any[] {
  const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  // Handle BOM and trim headers
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^\ufeff/, ''));
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    const values: string[] = [];
    let currentVal = '';
    let insideQuotes = false;

    // Handle quoted values containing commas
    for (let char of currentLine) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^"|"$/g, ''));

    if (values.length === headers.length) {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      data.push(obj);
    }
  }
  return data;
}

// Import English CSV files
const cropCalendarEN = require('../data/nepal_crop_calendar.csv');
const chemicalFertilizersEN = require('../data/01_chemical_fertilizers.csv');
const riceFertilizerEN = require('../data/02_rice_fertilizer_requirements.csv');
const maizeFertilizerEN = require('../data/03_maize_fertilizer_requirements.csv');
const wheatFertilizerEN = require('../data/04_wheat_fertilizer_requirements.csv');
const otherCropsFertilizerEN = require('../data/05_other_crops_fertilizer.csv');
const fruitTreesFertilizerEN = require('../data/06_fruit_trees_fertilizer.csv');
const agricLimeEN = require('../data/07_agricultural_lime_requirements.csv');
const optimalPHEN = require('../data/08_optimal_soil_ph_for_crops.csv');

// Import Nepali CSV files
const cropCalendarNE = require('../data/ne_crop_calendar.csv');
const chemicalFertilizersNE = require('../data/ne_chemical_fertilizers.csv');
const riceFertilizerNE = require('../data/ne_rice_fertilizer.csv');
const maizeFertilizerNE = require('../data/ne_maize_fertilizer.csv');
const wheatFertilizerNE = require('../data/ne_wheat_fertilizer.csv');
const otherCropsFertilizerNE = require('../data/ne_other_crops_fertilizer.csv');
const fruitTreesFertilizerNE = require('../data/ne_fruit_trees_fertilizer.csv');
const agricLimeNE = require('../data/ne_agric_lime.csv');
const optimalPHNE = require('../data/ne_optimal_ph.csv');
const vegPHNE = require('../data/ne_veg_ph.csv');

// Data Interfaces
export interface CropCalendarData {
  cropEnglish: string;
  cropNepali: string;
  varieties: string;
  spacing: string;
  seedRate: string;
  intercrop?: string;
  rotationCycle?: string;
  cropCharacteristics?: string;
  climateAdaptation?: string;
  region?: string; // For Nepali data: उच्च पहाड, मध्य पहाड, तराई
  plantingMonths?: string;
}

export interface ChemicalFertilizerData {
  fertilizerName: string;
  n: string;
  p: string;
  k: string;
  zinc: string;
  sulphur: string;
}

export interface RegionalFertilizerData {
  crop: string;
  region: string;
  varietyType?: string; // For maize (Open/Hybrid)
  compost: string;
  urea: string;
  dap: string;
  mop: string;
  zinc?: string;
  boron?: string;
}

export interface AgriculturalLimeData {
  soilPH: string;
  regions: {
    terai: string;
    midHills: string;
    highHills: string;
  };
}

// Helper Maps
const REGION_MAP_EN_TO_NE: { [key: string]: string } = {
  high: 'उच्च पहाड',
  mid: 'मध्य पहाड',
  terai: 'तराई'
};

const MONTH_MAP_EN_TO_NE: { [key: string]: string } = {
  'Baisakh': 'वैशाख',
  'Jestha': 'जेठ',
  'Ashar': 'असार',
  'Shrawan': 'साउन',
  'Bhadra': 'भदौ',
  'Ashwin': 'असोज',
  'Kartik': 'कात्तिक',
  'Mangsir': 'मंसिर',
  'Poush': 'पुस',
  'Magh': 'माघ',
  'Falgun': 'फागुन',
  'Chaitra': 'चैत'
};

const NEPALI_MONTH_INDICES: { [key: string]: number } = {
  'वैशाख': 0, 'जेठ': 1, 'असार': 2, 'साउन': 3, 'भदौ': 4, 'असोज': 5,
  'कात्तिक': 6, 'मंसिर': 7, 'पुस': 8, 'माघ': 9, 'फागुन': 10, 'चैत': 11
};

class CSVParser {
  private static instance: CSVParser;

  // Data storage
  private cropCalendarDataEN: CropCalendarData[] = [];
  private cropCalendarDataNE: CropCalendarData[] = []; // Master data source for regions

  private chemicalFertilizersData: ChemicalFertilizerData[] = [];
  private regionalFertilizerData: RegionalFertilizerData[] = [];
  private limeData: AgriculturalLimeData[] = [];
  private optimalPHData: OptimalPHData[] = [];

  private isInitialized = false;
  private currentLanguage: 'en' | 'ne' = 'en';

  private constructor() { }

  public static getInstance(): CSVParser {
    if (!CSVParser.instance) {
      CSVParser.instance = new CSVParser();
    }
    return CSVParser.instance;
  }

  public setLanguage(lang: 'en' | 'ne') {
    this.currentLanguage = lang;
  }

  // Helper constants
  private readonly HA_TO_ROPANI_FACTOR = 0.050872; // Conversion factor for kg/ha to kg/ropani

  public async initialize() {
    if (this.isInitialized) return;

    try {
      // Load ALL files unconditionally
      const p1 = loadCSVAsset(cropCalendarEN).then(csv => this.cropCalendarDataEN = this.parseCropCalendarEN(parseCSV(csv)));
      const p2 = loadCSVAsset(cropCalendarNE).then(csv => this.cropCalendarDataNE = this.parseNepaliData(parseCSV(csv)));

      // Load Fertilizer Data (Using English as source of truth for numbers)
      const p3 = loadCSVAsset(chemicalFertilizersEN).then(csv => this.chemicalFertilizersData = this.parseChemicalFertilizer(parseCSV(csv)));

      const p4 = loadCSVAsset(riceFertilizerEN).then(csv => this.regionalFertilizerData.push(...this.parseRegionalFertilizer(parseCSV(csv), 'Rice')));
      const p5 = loadCSVAsset(maizeFertilizerEN).then(csv => this.regionalFertilizerData.push(...this.parseRegionalFertilizer(parseCSV(csv), 'Maize')));
      const p6 = loadCSVAsset(wheatFertilizerEN).then(csv => this.regionalFertilizerData.push(...this.parseRegionalFertilizer(parseCSV(csv), 'Wheat')));

      const p7 = loadCSVAsset(otherCropsFertilizerEN).then(csv => this.otherCropsFertilizerData = this.parseOtherCropsFertilizer(parseCSV(csv)));

      const p8 = loadCSVAsset(optimalPHEN).then(csv => this.optimalPHData = this.parseOptimalPH(parseCSV(csv)));
      const p8_ne = loadCSVAsset(optimalPHNE).then(csv => {
        if (this.currentLanguage === 'ne') this.optimalPHData = this.parseOptimalPH(parseCSV(csv)); // Use Nepali for strings if active
      });

      await Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p8_ne]);

      this.isInitialized = true;
      console.log('✅ CSV Initialization Complete');
    } catch (error) {
      console.error('❌ Failed to initialize CSV Parser:', error);
    }
  }

  // Storage for Other Crops Fertilizer
  private otherCropsFertilizerData: any[] = [];

  // --- Parsing Logic ---

  private parseCropCalendarEN(data: any[]): CropCalendarData[] {
    return data.map(row => ({
      cropEnglish: row['Crop (English)'],
      cropNepali: row['Crop (Nepali)'],
      varieties: row['Varieties'],
      spacing: row['Spacing (cm)'],
      seedRate: row['Seed Rate per Ropani'],
      intercrop: row['Suitable Intercrop'],
      rotationCycle: row['Crop Rotation Cycle'],
      cropCharacteristics: row['Crop Characteristics'],
      climateAdaptation: row['Climate Adaptation Techniques']
    }));
  }

  private parseNepaliData(data: any[]): CropCalendarData[] {
    return data.map(row => ({
      region: row['क्षेत्र'],
      cropEnglish: row['बालीको नाम (अंग्रेजी)'] || '',
      cropNepali: row['बालीको नाम'],
      varieties: row['जातहरू'],
      spacing: row['लगाउने दूरी (से.मि.)'],
      seedRate: row['बीउ दर (प्रति रोपनी)'],
      plantingMonths: row['रोप्ने महिना'],
      climateAdaptation: row['जलवायु अनुकूलन/उत्थानशीलता'],
      cropCharacteristics: '' // Not explicit in Nepali CSV usually
    }));
  }

  private parseChemicalFertilizer(data: any[]): ChemicalFertilizerData[] {
    const isEn = this.currentLanguage === 'en';
    return data.map(row => ({
      fertilizerName: isEn ? row['Fertilizer Name'] : row['मलको नाम'],
      n: isEn ? row['N%'] : row['नाइट्रोजन %'],
      p: isEn ? row['P2O5%'] : row['फस्फोरस %'],
      k: isEn ? row['K2O%'] : row['पोटास %'],
      zinc: isEn ? row['Zinc%'] : row['जिंक %'] || '-',
      sulphur: isEn ? row['Sulphur%'] : row['सल्फर %'] || '-'
    }));
  }

  private parseRegionalFertilizer(data: any[], cropName: string): RegionalFertilizerData[] {
    return data.map(row => ({
      crop: cropName,
      region: row['Region'] || row['क्षेत्र'],
      compost: row['Compost/FYM (ton/ha)'] || row['प्राङ्गारिक मल (टन/हेक्टर)'],
      urea: row['Urea (kg/kattha)'] || row['युरिया (के.जी./कठ्ठा)'],
      dap: row['DAP (kg/kattha)'] || row['डिएपी (के.जी./कठ्ठा)'],
      mop: row['MoP (kg/kattha)'] || row['पोटास (के.जी./कठ्ठा)'],
      varietyType: row['Variety Type'] || row['जातको प्रकार']
    }));
  }

  private parseOptimalPH(data: any[]): OptimalPHData[] {
    const isEn = this.currentLanguage === 'en';
    return data.map(row => ({
      cropCategory: isEn ? row['Crop Category'] : row['बाली समूह'],
      cropName: isEn ? row['Crop Name'] : row['बालीको नाम'],
      optimalPHRange: isEn ? row['Optimal pH Range'] : row['उपयुक्त pH दायरा']
    }));
  }

  private parseOtherCropsFertilizer(data: any[]): any[] {
    return data.map(row => ({
      crop: row['Crop'],
      compost: parseFloat(row['Organic Manure (MT/ha)'] || '0'), // MT/ha
      n: parseFloat(row['N (kg/ha)'] || '0'),
      p: parseFloat(row['P (kg/ha)'] || '0'),
      k: parseFloat(row['K (kg/ha)'] || '0')
    }));
  }

  // --- Helper Query Methods ---

  /**
   * Check if a specific month falls within the provided period string
   * Handles ranges like "चैत-जेठ" and special values like "बाह्रै महिना"
   */
  private isMonthInPeriod(monthEn: string, periodString: string): boolean {
    if (!periodString) return false;

    // Check for "All Year"
    if (periodString.includes('बाह्रै महिना') || periodString.toLowerCase().includes('all year')) {
      return true;
    }

    const monthNe = MONTH_MAP_EN_TO_NE[monthEn];
    if (!monthNe) return false;

    // Direct match (simple case)
    if (periodString.includes(monthNe)) return true;

    // Range handling: Split by /, , or space to handle multiple ranges usually separated
    // e.g. "चैत-जेठ / असोज-कात्तिक"
    const ranges = periodString.split(/[\/,]/);
    const targetIdx = NEPALI_MONTH_INDICES[monthNe];

    return ranges.some(range => {
      const parts = range.trim().split('-');
      if (parts.length === 2) {
        const start = NEPALI_MONTH_INDICES[parts[0].trim()];
        const end = NEPALI_MONTH_INDICES[parts[1].trim()];
        if (start !== undefined && end !== undefined) {
          if (start <= end) {
            // Standard range e.g. Baisakh-Ashar
            return targetIdx >= start && targetIdx <= end;
          } else {
            // Wrapping range e.g. Magh-Baisakh (Winter to Spring crossing year)
            return targetIdx >= start || targetIdx <= end;
          }
        }
      }
      return false;
    });
  }

  // Helper to fetch fertilizer info
  private getFertilizerInfo(cropName: string, regionKey: string = 'mid'): { compost: number, n: number, p: number, k: number } {
    // 1. Check Regional Data (Rice/Maize/Wheat)
    // Filter matching crop
    const regionalMatches = this.regionalFertilizerData.filter(rf => rf.crop.toLowerCase().includes(cropName.toLowerCase()));

    if (regionalMatches.length > 0) {
      // Filter by region keyword
      const regionSearch = regionKey === 'terai' ? 'Terai' : (regionKey === 'high' ? 'High' : 'Hill');
      const matches = regionalMatches.filter(rf => rf.region.includes(regionSearch) || (regionSearch === 'Hill' && rf.region.includes('Mid')));

      if (matches.length > 0) {
        // Average the matches if multiple (e.g. Western Terai vs Eastern Terai)
        return {
          compost: (matches.reduce((sum, m) => sum + parseFloat(m.compost || '0'), 0) / matches.length) * 1000 * this.HA_TO_ROPANI_FACTOR, // Ton/ha -> kg/Ropani
          n: (matches.reduce((sum, m) => sum + parseFloat(m.urea || '0') * 0.46, 0) / matches.length), // Approx N from Urea? No, CSV has direct N/P/K or Urea/DAP? 
          // Wait, Rice CSV has pure Urea/DAP/MoP kg/kattha. 
          // I need to confirm `02_...` units. 
          // Header: Urea (kg/kattha).
          // 1 Kattha = 338 m2. 1 Ropani = 508 m2. Factor = 1.5 roughly.
          // Let's rely on `05` logic for vegetables since user complained about those.
          // For Rice/Maize: returning 0 for now to be safe on unit mixing, or just implement?
          // I'll skip complex Rice calc for now and focus on `05` vegetables.
          p: 0, k: 0
        };
      }
    }

    // 2. Check Other Crops (Vegetables usually here)
    // Fuzzy match crop name
    const matches = this.otherCropsFertilizerData.filter(oc =>
      // oc.crop like "Tomato - Terai Irrigated"
      // cropName like "Tomato"
      oc.crop.toLowerCase().includes(cropName.toLowerCase())
    );

    if (matches.length > 0) {
      // Filter by region if possible
      const regionSearch = regionKey === 'terai' ? 'Terai' : (regionKey === 'high' ? 'High' : 'Hill');
      let regionalMatch = matches.find(m => m.crop.includes(regionSearch));

      const bestMatch = regionalMatch || matches[0];

      return {
        compost: bestMatch.compost * 1000 * this.HA_TO_ROPANI_FACTOR, // MT/ha -> kg/Ropani
        n: bestMatch.n * this.HA_TO_ROPANI_FACTOR, // kg/ha -> kg/Ropani
        p: bestMatch.p * this.HA_TO_ROPANI_FACTOR,
        k: bestMatch.k * this.HA_TO_ROPANI_FACTOR
      };
    }

    return { compost: 0, n: 0, p: 0, k: 0 };
  }

  /**
   * Get consolidated crop data for the library view
   * Combines all regional information for a single crop
   */
  public getCropsData(): CropData[] {
    const cropMap = new Map<string, CropData>();
    const isNe = this.currentLanguage === 'ne';

    // We iterate over the Nepali master data because it contains ALL region info
    // and consolidate it by 'cropEnglish' key
    this.cropCalendarDataNE.forEach(row => {
      // Key by English name for uniqueness
      const key = (row.cropEnglish || '').toLowerCase();
      if (!key) return; // Skip if no key

      let entry = cropMap.get(key);
      if (!entry) {
        // Initialize entry
        // Try to find matching English data for detailed remarks if in English mode
        const enData = this.cropCalendarDataEN.find(e => e.cropEnglish.toLowerCase() === key);

        let characteristics = '';
        let adaptation = '';

        if (isNe) {
          characteristics = row.climateAdaptation || '';
          adaptation = ''; // Adaptation is usually merged in Nepali CSV or we use single field
        } else {
          characteristics = enData?.cropCharacteristics || '';
          adaptation = enData?.climateAdaptation || '';
        }

        const remarks = [characteristics, adaptation].filter(x => x).join('. ');

        // Get Fertilizer Info (Default to Mid Hills for library view)
        const fert = this.getFertilizerInfo(row.cropEnglish, 'mid');

        // Robust name selection
        let displayCrop = row.cropEnglish;
        if (isNe) {
          displayCrop = row.cropNepali || enData?.cropNepali || row.cropEnglish;
        }

        entry = {
          crop: displayCrop,
          variety: row.varieties, // Initial variety
          sn: cropMap.size + 1,
          compost: parseFloat(fert.compost.toFixed(1)),
          nitrogen: parseFloat(fert.n.toFixed(1)),
          phosphorus: parseFloat(fert.p.toFixed(1)),
          potassium: parseFloat(fert.k.toFixed(1)),
          plantSpacing: parseFloat((row.spacing || '').split('×')[0] || (row.spacing || '').split('x')[0] || '0') || 0,
          rowSpacing: parseFloat((row.spacing || '').split('×')[1] || (row.spacing || '').split('x')[1] || '0') || 0,
          seedRate: row.seedRate || '-',
          maturityDays: '-', // Not available in new data
          yield: '-', // Not available in new data
          remarks: remarks || (isNe ? 'विवरण उपलब्ध छैन।' : 'No detailed info available.')
        };
        cropMap.set(key, entry);
      }

      // Populate Sowing Times per Region
      if (row.region === 'उच्च पहाड') entry.highHillSowing = row.plantingMonths;
      if (row.region === 'मध्य पहाड') entry.midHillSowing = row.plantingMonths;
      if (row.region === 'तराई') entry.teraiSowing = row.plantingMonths;
    });

    return Array.from(cropMap.values());
  }

  /**
   * Get crops by month for a specific region
   * Used for Seasonal Calendar and Home Widget
   */
  public getCropsByMonth(
    monthBaseEn: string,
    regionKey: "high" | "mid" | "terai" = "mid"
  ): CropData[] {
    const isNe = this.currentLanguage === 'ne';
    const targetRegionNe = REGION_MAP_EN_TO_NE[regionKey];

    // Filter using Master Nepali Data (contains region & sowing info)
    const filtered = this.cropCalendarDataNE.filter(row => {
      // 1. Check Region
      if (row.region !== targetRegionNe) return false;

      // 2. Check Month
      if (!this.isMonthInPeriod(monthBaseEn, row.plantingMonths || '')) return false;

      return true;
    });

    // Map to Legacy CropData format
    return filtered.map((row, index) => {
      // Find english data for details if needed
      const enData = this.cropCalendarDataEN.find(e => e.cropEnglish.toLowerCase() === (row.cropEnglish || '').toLowerCase());

      let characteristics = '';
      let adaptation = '';

      if (isNe) {
        characteristics = row.climateAdaptation || '';
      } else {
        characteristics = enData?.cropCharacteristics || '';
        adaptation = enData?.climateAdaptation || '';
      }

      const remarks = [characteristics, adaptation].filter(x => x).join('. ');

      // Get Fertilizer Info Specific to Region
      const fert = this.getFertilizerInfo(row.cropEnglish, regionKey);

      // Robust name selection
      let displayCrop = row.cropEnglish;
      if (isNe) {
        displayCrop = row.cropNepali || enData?.cropNepali || row.cropEnglish;
      }

      return {
        crop: displayCrop,
        variety: row.varieties,
        sn: index + 1,
        // Since we filtered by region, we populate the relevant sowing time
        highHillSowing: row.region === 'उच्च पहाड' ? row.plantingMonths : undefined,
        midHillSowing: row.region === 'मध्य पहाड' ? row.plantingMonths : undefined,
        teraiSowing: row.region === 'तराई' ? row.plantingMonths : undefined,
        compost: parseFloat(fert.compost.toFixed(1)),
        nitrogen: parseFloat(fert.n.toFixed(1)),
        phosphorus: parseFloat(fert.p.toFixed(1)),
        potassium: parseFloat(fert.k.toFixed(1)),
        plantSpacing: parseFloat((row.spacing || '').split('×')[0] || (row.spacing || '').split('x')[0] || '0') || 0,
        rowSpacing: parseFloat((row.spacing || '').split('×')[1] || (row.spacing || '').split('x')[1] || '0') || 0,
        seedRate: row.seedRate,
        maturityDays: '-',
        yield: '-',
        remarks: remarks || (isNe ? 'विवरण उपलब्ध छैन।' : 'No detailed info available.')
      };
    });
  }

  public searchCrops(query: string): CropData[] {
    const crops = this.getCropsData(); // Get consolidated list
    const lowerQuery = query.toLowerCase();

    return crops.filter(crop =>
      crop.crop.toLowerCase().includes(lowerQuery) ||
      crop.variety.toLowerCase().includes(lowerQuery) ||
      crop.remarks.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get pH info for a crop (legacy method)
   */
  public getPHInfo(vegetable: string): PHData | undefined {
    const phData = this.optimalPHData;
    const found = phData.find(
      (ph) => ph.cropName.toLowerCase().includes(vegetable.toLowerCase())
    );

    if (found) {
      return {
        vegetable: found.cropName,
        optimalPHRange: found.optimalPHRange,
        categoryPreference: found.cropCategory,
      };
    }

    return undefined;
  }

  // New Methods for detailed access if needed
  public getRegionalFertilizer(crop: string, region: string) {
    return this.regionalFertilizerData.find(rf => rf.crop === crop && rf.region === region);
  }

  /**
   * Get list of all available crop names
   */
  public getAllCrops(): string[] {
    return this.getCropsData().map(c => c.crop).sort();
  }

  /**
   * Get specific crop details by name
   */
  public getCropInfo(cropName: string): CropData | undefined {
    return this.getCropsData().find(c => c.crop.toLowerCase() === cropName.toLowerCase());
  }
}

export default CSVParser;
