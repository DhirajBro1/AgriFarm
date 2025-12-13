# 🔧 AgriFarm - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [Component Structure](#component-structure)
4. [State Management](#state-management)
5. [Data Models](#data-models)
6. [API Documentation](#api-documentation)
7. [Performance Optimizations](#performance-optimizations)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Technology Stack
```
Frontend: React Native + Expo
Language: TypeScript
Navigation: Expo Router (file-based routing)
Storage: AsyncStorage (local persistence)
Data: CSV files parsed locally
Styling: StyleSheet API with dynamic theming
```

### Project Structure
```
AgriFarm/
├── app/                           # Main application screens (Expo Router)
│   ├── _layout.tsx               # Root layout configuration
│   ├── index.tsx                 # Home/Dashboard screen
│   ├── crops.tsx                 # Crop browsing interface
│   ├── tools.tsx                 # Farming calculators
│   ├── tips.tsx                  # Tips and pest management
│   └── account.tsx               # User profile management
├── components/                    # Reusable UI components
│   └── BottomNav.tsx             # Bottom navigation component
├── theme/                        # Theme management system
│   └── ThemeProvider.tsx         # App-wide theme context
├── utils/                        # Business logic and utilities
│   ├── csvParser.ts              # CSV data parsing singleton
│   └── farmingData.ts            # Static farming data and constants
├── data/                         # CSV data files
│   ├── clean.csv                 # Main crop database
│   ├── requirements_for_crops.csv # Fertilizer requirements
│   ├── grown.csv                 # Regional growing data
│   └── ph.csv                    # Soil pH requirements
└── assets/                       # Static assets (icons, images)
```

## Data Flow

### Application Initialization
1. **App Launch** → Check if first-time user via AsyncStorage
2. **First Time Setup** → Collect username and region, save to AsyncStorage
3. **Data Loading** → Initialize CSVParser singleton, load all CSV files
4. **Theme Setup** → Load saved theme preference or detect system theme

### User Interaction Flow
```
User Action → Component State Update → Data Processing → UI Re-render
```

### Data Processing Pipeline
```
CSV Files → CSVParser.initialize() → Parsed Objects → Filter by Region/Month → UI Display
```

## Component Structure

### Screen Components

#### HomeScreen (index.tsx)
**Purpose**: Main dashboard with personalized content and quick actions

**Key Features**:
- First-time user onboarding
- Monthly crop recommendations
- Statistics display
- Quick navigation to main features

**State Management**:
```typescript
// User setup state
const [isFirstTime, setIsFirstTime] = useState(true);
const [isLoading, setIsLoading] = useState(true);
const [username, setUsername] = useState("");
const [region, setRegion] = useState("");

// Data state
const [currentMonth, setCurrentMonth] = useState("");
const [monthCrops, setMonthCrops] = useState<CropData[]>([]);
const [totalCrops, setTotalCrops] = useState(0);
```

#### CropsScreen (crops.tsx)
**Purpose**: Browse and search crops with detailed information

**Key Features**:
- Tab-based browsing (Calendar, Library, Fertilizer, Seeds)
- Search functionality across all crop data
- Regional filtering
- Expandable crop detail cards

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState<TabType>("calendar");
const [selectedMonth, setSelectedMonth] = useState(getCurrentNepaliMonth());
const [searchQuery, setSearchQuery] = useState("");
const [filteredCrops, setFilteredCrops] = useState<CropData[]>([]);
const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
```

#### ToolsScreen (tools.tsx)
**Purpose**: Farming calculators and utility tools

**Tools Included**:
- Yield Calculator
- pH Soil Tester
- Unit Converter
- Expense Tracker
- Digital Notes

#### TipsScreen (tips.tsx)
**Purpose**: Farming tips and pest/disease management

**Features**:
- Categorized farming tips
- Pest and disease database
- Search and filter functionality

#### AccountScreen (account.tsx)
**Purpose**: User profile and app settings management

### Shared Components

#### BottomNav Component
**Purpose**: App-wide navigation with 5 main sections

**Navigation Items**:
```typescript
const navItems = [
  { key: "home", icon: "home-outline", activeIcon: "home", label: "Home" },
  { key: "crops", icon: "leaf-outline", activeIcon: "leaf", label: "Crops" },
  { key: "tools", icon: "build-outline", activeIcon: "build", label: "Tools" },
  { key: "tips", icon: "bulb-outline", activeIcon: "bulb", label: "Tips" },
  { key: "account", icon: "person-outline", activeIcon: "person", label: "Account" }
];
```

## State Management

### Local State Strategy
- **Component-level state** for UI interactions
- **AsyncStorage** for persistent user data
- **Singleton pattern** for data management (CSVParser)
- **Context API** for theme management

### Data Persistence
```typescript
// User preferences
AsyncStorage.setItem("username", username);
AsyncStorage.setItem("region", region);
AsyncStorage.setItem("theme-preference", theme);

// App data (expenses, notes)
AsyncStorage.setItem("farming-expenses", JSON.stringify(expenses));
AsyncStorage.setItem("farming-notes", JSON.stringify(notes));
```

### State Update Patterns
```typescript
// Async data loading with error handling
const initializeDataCallback = useCallback(async () => {
  try {
    await csvParser.initialize();
    const allCrops = csvParser.getAllCrops();
    setTotalCrops(allCrops.length);
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}, [csvParser]);
```

## Data Models

### Core Interfaces

#### CropData
```typescript
export interface CropData {
  crop: string;                    // Crop name (e.g., "Tomato")
  variety: string;                 // Variety (e.g., "Hybrid", "Local")
  sn?: number;                     // Serial number
  highHillSowing?: string;         // High hills sowing months
  midHillSowing?: string;          // Mid hills sowing months
  teraiSowing?: string;            // Terai sowing months
  compost: number;                 // Compost requirement (tons/hectare)
  nitrogen: number;                // Nitrogen requirement (kg/hectare)
  phosphorus: number;              // Phosphorus requirement (kg/hectare)
  potassium: number;               // Potassium requirement (kg/hectare)
  plantSpacing: number;            // Plant spacing (cm)
  rowSpacing: number;              // Row spacing (cm)
  seedRate: string;                // Seed rate (kg/hectare or plants/hectare)
  maturityDays: string;            // Days to maturity
  yield: string;                   // Expected yield (tons/hectare)
  remarks: string;                 // Additional notes
}
```

#### FarmingTip
```typescript
export interface FarmingTip {
  id: string;                      // Unique identifier
  title: string;                   // Short descriptive title
  description: string;             // Detailed explanation
  category: "watering" | "fertilizer" | "planting" | "harvesting" | "general";
  season?: string;                 // Optional season relevance
  important: boolean;              // Priority flag
}
```

#### ThemeColors
```typescript
export type ThemeColors = {
  background: string;              // Main app background
  card: string;                    // Card background
  cardMuted: string;               // Muted card background
  surface: string;                 // Surface color
  primary: string;                 // Primary brand color
  primaryMuted: string;            // Muted primary
  text: string;                    // Primary text color
  muted: string;                   // Secondary text color
  border: string;                  // Border color
  accent: string;                  // Accent color
  navBackground: string;           // Navigation background
  navActive: string;               // Active navigation color
};
```

## API Documentation

### CSVParser Class

#### Singleton Instance
```typescript
const csvParser = CSVParser.getInstance();
```

#### Core Methods

##### initialize()
```typescript
async initialize(): Promise<void>
```
Loads and parses all CSV files. Must be called before using other methods.

##### getCropsByMonth()
```typescript
getCropsByMonth(
  month: string, 
  region: "high" | "mid" | "terai"
): CropData[]
```
Returns crops suitable for planting in specified month and region.

##### getAllCrops()
```typescript
getAllCrops(): CropData[]
```
Returns complete crop database.

##### searchCrops()
```typescript
searchCrops(query: string): CropData[]
```
Searches crops by name, variety, or other properties.

##### getCropsData()
```typescript
getCropsData(): CropData[]
```
Returns processed crop data with all merged information.

### Utility Functions

#### Unit Conversion
```typescript
convertUnit(
  value: number, 
  fromUnit: string, 
  toUnit: string, 
  category: "area" | "weight" | "volume"
): number
```

#### Current Nepali Month
```typescript
getCurrentNepaliMonth(): string
```
Returns current Nepali calendar month name.

## Performance Optimizations

### React Native Best Practices

#### Memoization
```typescript
// Memoize expensive calculations
const styles = useMemo(() => createStyles(colors), [colors]);

// Memoize callback functions
const initializeDataCallback = useCallback(async () => {
  // Expensive data initialization
}, [csvParser]);
```

#### FlatList Optimization
```typescript
<FlatList
  data={filteredCrops}
  renderItem={renderCropItem}
  keyExtractor={(item, index) => `${item.crop}-${index}`}
  removeClippedSubviews={true}
  maxToRenderPerBatch={20}
  updateCellsBatchingPeriod={100}
  windowSize={10}
/>
```

#### Image Optimization
- Use Expo Image for better performance
- Implement lazy loading for large lists
- Optimize asset sizes

### Memory Management

#### CSV Data Loading
- Lazy loading of CSV files
- Singleton pattern to avoid duplicate data loading
- Efficient parsing with minimal memory footprint

#### State Cleanup
```typescript
useEffect(() => {
  return () => {
    // Cleanup subscriptions or timers
  };
}, []);
```

## Testing Strategy

### Unit Testing
```typescript
// Test utility functions
describe('farmingData utilities', () => {
  test('convertUnit should convert ropani to square meters', () => {
    const result = convertUnit(1, 'ropani', 'square meters', 'area');
    expect(result).toBe(508.72);
  });
});
```

### Component Testing
```typescript
// Test component rendering and interaction
describe('BottomNav Component', () => {
  test('renders all navigation items', () => {
    const { getByText } = render(<BottomNav active="home" />);
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Crops')).toBeTruthy();
    expect(getByText('Tools')).toBeTruthy();
    expect(getByText('Tips')).toBeTruthy();
    expect(getByText('Account')).toBeTruthy();
  });
});
```

### Integration Testing
- Test CSV data loading and parsing
- Test navigation flow between screens
- Test theme switching functionality

### Device Testing
- Test on multiple Android devices and versions
- Test on iOS devices (iPhone and iPad)
- Test different screen sizes and orientations
- Test performance on low-end devices

## Deployment Guide

### Environment Setup
```bash
# Install dependencies
npm install

# Configure EAS (Expo Application Services)
npm install -g eas-cli
eas login
eas build:configure
```

### Build Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  }
}
```

### Building for Production

#### Android APK
```bash
eas build --platform android --profile production
```

#### iOS App
```bash
eas build --platform ios --profile production
```

#### Submit to App Stores
```bash
# Android Play Store
eas submit --platform android

# iOS App Store
eas submit --platform ios
```

## Troubleshooting

### Common Issues

#### CSV Loading Errors
**Problem**: CSV files not loading or parsing incorrectly
**Solution**:
1. Check file paths in csvParser.ts
2. Verify CSV file format and encoding
3. Add error handling for file reading

#### AsyncStorage Issues
**Problem**: Data not persisting between app sessions
**Solution**:
1. Check AsyncStorage permissions
2. Verify key names are consistent
3. Add try-catch blocks for storage operations

#### Performance Issues
**Problem**: App runs slowly or crashes
**Solution**:
1. Profile with Flipper or React Native debugger
2. Optimize FlatList rendering
3. Check for memory leaks in useEffect

#### Theme Not Switching
**Problem**: Theme changes not applying
**Solution**:
1. Verify ThemeProvider wraps entire app
2. Check if components use theme colors correctly
3. Clear AsyncStorage theme preference

### Debug Commands
```bash
# Clear Expo cache
expo start --clear

# Run with debugger
expo start --dev-client

# View logs
expo logs --type=device
```

### Performance Monitoring
```typescript
// Add performance markers
console.time('CSV Loading');
await csvParser.initialize();
console.timeEnd('CSV Loading');

// Memory usage monitoring
const memoryUsage = performance.memory;
console.log('Memory usage:', memoryUsage);
```

## Contributing Guidelines

### Code Standards
- Use TypeScript for all new code
- Follow React Native best practices
- Add comments for complex logic
- Use meaningful variable and function names

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new farming tool calculator"

# Push and create PR
git push origin feature/new-feature
```

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Comments added for complex logic
- [ ] Performance implications considered
- [ ] Tested on both Android and iOS
- [ ] Follows existing code patterns
- [ ] No hardcoded values (use constants)
- [ ] Error handling implemented
- [ ] Accessibility considerations

---

*This technical documentation is maintained by the AgriFarm development team. For questions or clarifications, please create an issue in the repository.*