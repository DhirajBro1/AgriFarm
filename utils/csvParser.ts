/**
 * CSVParser - Utility class for parsing and managing crop data from CSV files
 *
 * This singleton class handles loading, parsing, and querying crop data from multiple CSV files:
 * - clean.csv: Main crop database with growing information
 * - requirements_for_crops.csv: Fertilizer and spacing requirements
 * - grown.csv: Regional growing seasons and sowing times
 * - ph.csv: Soil pH requirements for different crops
 */

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// Import CSV files as assets (returns numeric ID)
const cleanCSV = require('../data/clean.csv');
const requirementsCSV = require('../data/requirements_for_crops.csv');
const grownCSV = require('../data/grown.csv');
const phCSV = require('../data/ph.csv');

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
 * Helper to load CSV string from asset module
 */
async function loadCSVAsset(module: any): Promise<string> {
  try {
    const asset = Asset.fromModule(module);
    await asset.downloadAsync();

    // Fallback logic: check for local URI first, then fall back to fetching via HTTP (dev server)
    if (asset.localUri) {
      try {
        return await FileSystem.readAsStringAsync(asset.localUri);
      } catch (fsError) {
        console.warn('FileSystem read failed, trying fetch:', fsError);
      }
    }

    if (asset.uri) {
      const response = await fetch(asset.uri);
      return await response.text();
    }

    return "";
  } catch (e) {
    console.error("Failed to load CSV asset:", e);
    return "";
  }
}

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText: string): any[] {
  if (!csvText) return [];
  const lines = csvText.split(/\r?\n/).filter((line: string) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',');
  const data = [];

  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    // Basic CSV parsing handling quoted values could be added here if needed
    // For now simple split is used as per dataset
    const row: any = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });

    data.push(row);
  }

  return data;
}

class CSVParser {
  private static instance: CSVParser;
  private cropsData: CropData[] = [];
  private phData: PHData[] = [];
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
      console.log('📂 Loading CSV files...');

      // Load CSV strings properly asynchronously
      const cleanText = await loadCSVAsset(cleanCSV);
      const requirementsText = await loadCSVAsset(requirementsCSV);
      const grownText = await loadCSVAsset(grownCSV);
      const phText = await loadCSVAsset(phCSV);

      // Parse clean.csv (main crop data)
      const cleanData = parseCSV(cleanText);
      console.log(`✅ Loaded ${cleanData.length} crops from clean.csv`);

      this.cropsData = cleanData.map((row: any) => ({
        crop: row.Crop || '',
        variety: row.Variety || '',
        sn: row.SN ? parseInt(row.SN) : undefined,
        highHillSowing: row.High_Hill_Sowing || undefined,
        midHillSowing: row.Mid_Hill_Sowing || undefined,
        teraiSowing: row.Terai_Bensi_Sowing || undefined,
        compost: parseFloat(row.Compost_kg_ropani) || 0,
        nitrogen: parseFloat(row.N_kg_ropani) || 0,
        phosphorus: parseFloat(row.P_kg_ropani) || 0,
        potassium: parseFloat(row.K_kg_ropani) || 0,
        plantSpacing: parseFloat(row.Plant_Spacing_cm) || 0,
        rowSpacing: parseFloat(row.Row_Spacing_cm) || 0,
        seedRate: row.Seed_Seedling_Rate || '',
        maturityDays: row.Maturity_Days || '',
        yield: row.Yield_kg_ropani || '',
        remarks: row.Remarks || '',
      }));

      // Parse requirements_for_crops.csv
      const requirementsRaw = parseCSV(requirementsText);
      console.log(`✅ Loaded ${requirementsRaw.length} crop requirements`);

      this.requirementsData = requirementsRaw.map((row: any) => ({
        crop: row.Crop || '',
        variety: row.Variety || '',
        compost: parseFloat(row.Compost_kg_ropani) || 0,
        nitrogen: parseFloat(row.N_kg_ropani) || 0,
        phosphorus: parseFloat(row.P_kg_ropani) || 0,
        potassium: parseFloat(row.K_kg_ropani) || 0,
        plantSpacing: parseFloat(row.Plant_Spacing_cm) || 0,
        rowSpacing: parseFloat(row.Row_Spacing_cm) || 0,
        seedRate: row.Seed_Seedling_Rate || '',
        maturityDays: row.Maturity_Days || '',
        yield: row.Yield_kg_ropani || '',
        remarks: row.Remarks || '',
      }));

      // Parse grown.csv
      const grownRaw = parseCSV(grownText);
      console.log(`✅ Loaded ${grownRaw.length} growing info records`);

      this.growingData = grownRaw.map((row: any) => ({
        crop: row.Crop || '',
        variety: row.Variety || '',
        highHillSowing: row.High_Hill_Sowing || undefined,
        midHillSowing: row.Mid_Hill_Sowing || undefined,
        teraiSowing: row.Terai_Bensi_Sowing || undefined,
        remarks: row.Remarks || '',
      }));

      // Parse ph.csv
      const phRaw = parseCSV(phText);
      console.log(`✅ Loaded ${phRaw.length} pH records`);

      this.phData = phRaw.map((row: any) => ({
        vegetable: row.Vegetable || '',
        optimalPHRange: row.Optimal_pH_Range || '',
        categoryPreference: row.General_Category_Preference || '',
      }));

      this.initialized = true;
      console.log('🎉 CSV Parser initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing CSV parser:', error);
      console.log('⚠️ Using empty dataset as fallback');
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
