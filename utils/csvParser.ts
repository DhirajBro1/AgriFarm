
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// Consolidated Assets
const csvAssetsEN = {
  cropCalendar: require('../data/crops.csv'),
};

const csvAssetsNE = {
  cropCalendar: require('../data/ne_crops.csv'),
};

// Data Interfaces
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
  urea?: number;
  dap?: number;
  mop?: number;
  plantSpacing: number; // 0 if missing
  rowSpacing: number;   // 0 if missing
  seedRate: string;     // Empty if missing
  maturityDays: string;
  yield: string;
  remarks: string;
  phRange?: string;
}

export interface CropCalendarData {
  region: string;
  cropEnglish: string;
  cropNepali: string;
  varieties: string;
  spacing: string;
  seedRate: string;
  ph?: string;
  maturity?: string;
  yield?: string;
  n?: number;
  p?: number;
  k?: number;
  compost?: number;
  urea?: number;
  dap?: number;
  mop?: number;
  intercrop?: string;
  rotationCycle?: string;
  characteristics?: string;
  adaptation?: string;
  plantingMonths?: string;
  remarks?: string;

  // New Generic fields
  regionsRaw?: string;
}

const REGION_MAP_EN_TO_NE: { [key: string]: string } = {
  high: 'उच्च पहाड',
  mid: 'मध्य पहाड',
  terai: 'तराई'
};

const MONTH_MAP_NE_TO_EN: { [key: string]: string } = {
  'वैशाख': 'Baisakh', 'जेठ': 'Jestha', 'असार': 'Ashar', 'साउन': 'Shrawan',
  'भदौ': 'Bhadra', 'असोज': 'Ashwin', 'कात्तिक': 'Kartik', 'मंसिर': 'Mangsir',
  'पुस': 'Poush', 'माघ': 'Magh', 'फागुन': 'Falgun', 'चैत': 'Chaitra'
};

// Gregorian months for fallback parsing of new CSVs
const GREGORIAN_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const NEPALI_MONTH_INDICES: { [key: string]: number } = {
  'वैशाख': 0, 'जेठ': 1, 'असार': 2, 'साउन': 3, 'भदौ': 4, 'असोज': 5,
  'कात्तिक': 6, 'मंसिर': 7, 'पुस': 8, 'माघ': 9, 'फागुन': 10, 'चैत': 11,
  'Baisakh': 0, 'Jestha': 1, 'Ashar': 2, 'Shrawan': 3, 'Bhadra': 4, 'Ashwin': 5,
  'Kartik': 6, 'Mangsir': 7, 'Poush': 8, 'Magh': 9, 'Falgun': 10, 'Chaitra': 11
};

const NE_NUMS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const EN_NUMS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

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
  // Normalize line endings and handle BOM
  const sanitizedCsv = csvString.replace(/^\ufeff/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = sanitizedCsv.split('\n').filter((line) => line.trim() !== '');

  if (lines.length === 0) return [];

  // Parse headers
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    const values: string[] = [];
    let currentVal = '';
    let insideQuotes = false;

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

    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    data.push(obj);
  }
  return data;
}

class CSVParser {
  private static instance: CSVParser;
  private isInitialized = false;
  private currentLanguage: 'en' | 'ne' = 'en';

  // Data storage
  private cropCalendarEN: CropCalendarData[] = [];
  private cropCalendarNE: CropCalendarData[] = [];

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

  public localizeNumber(num: string | number): string {
    if (num === undefined || num === null) return '-';
    const str = num.toString();
    if (this.currentLanguage === 'en') return this.neToEnNum(str);
    return this.enToNeNum(str);
  }

  public enToNeNum(text: string): string {
    return text.split('').map(c => {
      const idx = EN_NUMS.indexOf(c);
      return idx !== -1 ? NE_NUMS[idx] : c;
    }).join('');
  }

  public neToEnNum(text: string): string {
    return text.split('').map(c => {
      const idx = NE_NUMS.indexOf(c);
      return idx !== -1 ? EN_NUMS[idx] : c;
    }).join('');
  }

  public async initialize() {
    if (this.isInitialized) return;
    try {
      const loaders = [
        loadCSVAsset(csvAssetsEN.cropCalendar).then(csv => this.cropCalendarEN = this.parseNewCropsCSV(parseCSV(csv), 'en')),
        loadCSVAsset(csvAssetsNE.cropCalendar).then(csv => this.cropCalendarNE = this.parseNewCropsCSV(parseCSV(csv), 'ne')),
      ];

      await Promise.all(loaders);
      this.isInitialized = true;
      console.log('✅ CSVParser initialization complete (New Schema)');
    } catch (error) {
      console.error('❌ CSVParser initialization failed:', error);
    }
  }

  private parseNewCropsCSV(data: any[], lang: string): CropCalendarData[] {
    return data.map(row => {
      const isEn = lang === 'en';

      const yieldMin = parseFloat(this.neToEnNum(row['yield_min_kg'] || row['उत्पादन_न्यूनतम_केजी'] || '0'));
      const yieldMax = parseFloat(this.neToEnNum(row['yield_max_kg'] || row['उत्पादन_अधिकतम_केजी'] || '0'));

      const matMin = parseFloat(this.neToEnNum(row['maturity_days_min'] || row['पक्वता_दिन_न्यूनतम'] || '0'));
      const matMax = parseFloat(this.neToEnNum(row['maturity_days_max'] || row['पक्वता_दिन_अधिकतम'] || '0'));

      const phMin = parseFloat(this.neToEnNum(row['soil_ph_min'] || row['माटो_pH_न्यूनतम'] || '0'));
      const phMax = parseFloat(this.neToEnNum(row['soil_ph_max'] || row['माटो_pH_अधिकतम'] || '0'));

      const yieldStr = (yieldMin || yieldMax)
        ? `${this.localizeNumber(yieldMin)}-${this.localizeNumber(yieldMax)} ${isEn ? 'kg' : 'के.जी.'}`
        : '-';

      const matStr = (matMin || matMax)
        ? `${this.localizeNumber(matMin)}-${this.localizeNumber(matMax)} ${isEn ? 'days' : 'दिन'}`
        : '-';

      const phStr = (phMin || phMax)
        ? `${this.localizeNumber(phMin)}-${this.localizeNumber(phMax)}`
        : '-';

      return {
        region: 'All',
        regionsRaw: row['regions'] || row['क्षेत्रहरू'] || '',

        cropEnglish: isEn ? (row['crop_name'] || '') : '',
        cropNepali: !isEn ? (row['बाली_नाम'] || '') : '',

        varieties: row['variety'] || row['जात'] || '',

        spacing: '',
        seedRate: '',

        ph: phStr,
        maturity: matStr,
        yield: yieldStr,

        n: parseFloat(this.neToEnNum(row['n_kg'] || row['नाइट्रोजन_केजी'] || '0')),
        p: parseFloat(this.neToEnNum(row['p_kg'] || row['फस्फोरस_केजी'] || '0')),
        k: parseFloat(this.neToEnNum(row['k_kg'] || row['पोटासियम_केजी'] || '0')),
        compost: parseFloat(this.neToEnNum(row['compost_kg'] || row['कम्पोस्ट_केजी'] || '0')),

        urea: 0,
        dap: 0,
        mop: 0,

        plantingMonths: row['planting_months'] || row['रोपाइँ_महिना'] || '',
        remarks: row['remarks'] || row['कैफियत'] || '',
      };
    });
  }

  public getCropsData(regionKey: string = 'mid'): CropData[] {
    const isNe = this.currentLanguage === 'ne';
    const list = isNe ? this.cropCalendarNE : this.cropCalendarEN;
    const cropMap = new Map<string, CropData>();

    list.forEach((row, idx) => {
      const displayCrop = isNe ? (row.cropNepali || row.cropEnglish) : (row.cropEnglish || row.cropNepali);

      if (!displayCrop) return;

      const regionsRaw = (row.regionsRaw || '').toLowerCase();
      const regionSearchMap: { [key: string]: string[] } = {
        'high': ['high', 'उच्च'],
        'mid': ['mid', 'मध्य'],
        'terai': ['terai', 'तराई']
      };

      const searchTerms = regionSearchMap[regionKey] || [];
      const matchesRegion = searchTerms.some(term => regionsRaw.includes(term));

      // Unique key for each crop+variety combo
      const uniqueKey = `${displayCrop}_${row.varieties}`;

      let entry = cropMap.get(uniqueKey);

      if (!entry) {
        entry = {
          crop: displayCrop,
          variety: row.varieties,
          sn: cropMap.size + 1,
          compost: row.compost || 0,
          nitrogen: row.n || 0,
          phosphorus: row.p || 0,
          potassium: row.k || 0,
          urea: 0,
          dap: 0,
          mop: 0,

          plantSpacing: 0,
          rowSpacing: 0,
          seedRate: isNe ? 'उपलब्ध छैन' : 'N/A',

          maturityDays: row.maturity || '-',
          yield: row.yield || '-',
          remarks: row.remarks || '',
          phRange: row.ph || '-'
        };

        const sowing = row.plantingMonths;
        if (regionsRaw.includes('high') || regionsRaw.includes('उच्च')) entry.highHillSowing = sowing;
        if (regionsRaw.includes('mid') || regionsRaw.includes('मध्य')) entry.midHillSowing = sowing;
        if (regionsRaw.includes('terai') || regionsRaw.includes('तराई')) entry.teraiSowing = sowing;

        // Add if matches region, or if "All" logic is applied (currently filtering strictly)
        if (matchesRegion) {
          cropMap.set(uniqueKey, entry);
        }
      }
    });

    return Array.from(cropMap.values());
  }

  public getAllCrops(): string[] {
    // Unique list of crop names
    return Array.from(new Set(this.getCropsData('mid').map(c => c.crop)));
  }

  public getCropInfo(name: string): CropData | undefined {
    return this.getCropsData('mid').find(c => c.crop.toLowerCase() === name.toLowerCase());
  }

  public getCropsByMonth(monthEn: string, region: 'high' | 'mid' | 'terai' = 'mid'): CropData[] {
    const allCrops = this.getCropsData(region);
    return allCrops.filter(crop => {
      let sowing = region === 'high' ? crop.highHillSowing : (region === 'terai' ? crop.teraiSowing : crop.midHillSowing);
      if (!sowing) return false;
      return this.monthMatch(monthEn, sowing);
    });
  }

  private monthMatch(monthEn: string, period: string): boolean {
    if (!period) return false;
    const p = period.toLowerCase();

    // Map Nepali Month Index (0=Baisakh) to allowed Gregorian Months roughly
    const NE_TO_GREG_MAP = [
      ['apr', 'may'], // Baisakh
      ['may', 'jun'], // Jestha
      ['jun', 'jul'], // Ashar
      ['jul', 'aug'], // Shrawan
      ['aug', 'sep'], // Bhadra
      ['sep', 'oct'], // Ashwin
      ['oct', 'nov'], // Kartik
      ['nov', 'dec'], // Mangsir
      ['dec', 'jan'], // Poush
      ['jan', 'feb'], // Magh
      ['feb', 'mar'], // Falgun
      ['mar', 'apr']  // Chaitra
    ];

    const monthIdx = NEPALI_MONTH_INDICES[monthEn];
    if (monthIdx === undefined) return false;

    // Check if the sowing period string (likely Gregorian "Sep-Dec") overlaps with the selected Nepali month
    const allowedGreg = NE_TO_GREG_MAP[monthIdx];
    const expandedMonths = this.expandGregorianRange(p);

    return allowedGreg.some(m => expandedMonths.includes(m));
  }

  private expandGregorianRange(period: string): string[] {
    const p = period.toLowerCase();
    if (p.includes('all year')) return GREGORIAN_MONTHS;

    const parts = p.split(/[–-]/); // em dash or hyphen
    if (parts.length === 2) {
      const startStr = parts[0].substring(0, 3);
      const endStr = parts[1].substring(0, 3);

      let startIdx = GREGORIAN_MONTHS.indexOf(startStr);
      let endIdx = GREGORIAN_MONTHS.indexOf(endStr);

      if (startIdx !== -1 && endIdx !== -1) {
        const res = [];
        if (endIdx < startIdx) {
          for (let i = startIdx; i < 12; i++) res.push(GREGORIAN_MONTHS[i]);
          for (let i = 0; i <= endIdx; i++) res.push(GREGORIAN_MONTHS[i]);
        } else {
          for (let i = startIdx; i <= endIdx; i++) res.push(GREGORIAN_MONTHS[i]);
        }
        return res;
      }
    }
    return GREGORIAN_MONTHS.filter(m => p.includes(m));
  }

  public searchCrops(q: string): CropData[] {
    const query = q.toLowerCase();
    return this.getCropsData('mid').filter(c =>
      c.crop.toLowerCase().includes(query) ||
      c.variety.toLowerCase().includes(query)
    );
  }
}

export default CSVParser;
