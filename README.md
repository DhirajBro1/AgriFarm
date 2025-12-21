# 🌾 AgriFarm - Smart Farming Companion App

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="MIT License" />
</div>

## 📱 Overview

**AgriFarm** is a comprehensive mobile application designed specifically for Nepali farmers, providing intelligent crop recommendations, farming tools, and agricultural guidance tailored to Nepal's diverse geographic regions. The app combines traditional farming knowledge with modern technology to help farmers make informed decisions about their crops.

### 🎯 Key Features

#### 🏠 **Dashboard & User Setup**
- **Personalized Welcome**: Custom greeting with user's name and region
- **Region-Based Setup**: Support for High Hills (>2000m), Mid Hills (600-2000m), and Terai Plains (<600m)
- **Monthly Crop Overview**: Current month's recommended crops based on Nepali calendar
- **Quick Statistics**: Total crops in database, monthly recommendations, and regional information

#### 🌱 **Crop Information System**
- **Seasonal Calendar**: Browse crops by Nepali months (Baishakh, Jestha, Ashadh, etc.)
- **Comprehensive Database**: 100+ crops with detailed growing information
- **Regional Filtering**: Crops filtered by altitude and climate zones
- **Search Functionality**: Find crops by name, variety, or characteristics
- **Detailed Crop Cards**: 
  - Fertilizer requirements (NPK values)
  - Plant and row spacing
  - Seed rates and maturity periods
  - Expected yields
  - Growing tips and remarks

#### 🧭 **Farming Tools**
- **Yield Calculator**: Calculate expected harvest based on area and variety
- **Soil pH Tester**: Check pH levels and get crop recommendations
- **Unit Converter**: Convert between metric and traditional Nepali units (Ropani, Mana, Pathi, etc.)
- **Expense Tracker**: Track farming costs by category (seeds, fertilizer, labor, etc.)
- **Digital Notes**: Personal farming observations and reminders
- **Disease Detection**: AI-powered plant health analysis using camera and **PlantNet API**

#### 💡 **Tips & Guidance**
- **Farming Tips**: Categorized advice on watering, fertilizing, planting, and harvesting
- **Pest & Disease Management**: Common problems with prevention and treatment methods
- **Seasonal Recommendations**: Best practices for different times of the year
- **Search & Filter**: Find relevant tips quickly

#### 👤 **User Account**
- **Profile Management**: Update name and farming region
- **Data Persistence**: All settings and preferences saved locally
- **Theme Support**: Light and dark mode options

## 🏗️ Technical Architecture

### **Frontend Framework**
- **React Native** with **Expo** for cross-platform mobile development
- **TypeScript** for type safety and better developer experience
- **Expo Router** for navigation (using Stack and `useRouter` hook)

### **Data Management**
- **CSV-based Database**: Efficient storage of crop information
- **AsyncStorage**: Local data persistence for user preferences
- **Singleton Pattern**: Centralized data management with `CSVParser` class

### **Design & UI**
- **Theme System**: Dynamic light/dark mode with comprehensive color palette (`ThemeProvider`)
- **Responsive Design**: Optimized for different screen sizes
- **Custom Navigation**: Custom `BottomNav` component for seamless switching between main modules

### **Key Components**
```
├── app/                    # Main application screens and routing
│   ├── index.tsx          # Home/Dashboard screen and entry point
│   ├── crops.tsx          # Crop browsing and search
│   ├── tools.tsx          # Farming calculators and tools
│   ├── tips.tsx           # Farming tips and pest info
│   ├── disease-detection.tsx # UI for PlantNet disease analysis
│   ├── account.tsx        # User profile management
│   └── _layout.tsx        # Root layout configuration
├── components/            # Reusable UI components
│   └── BottomNav.tsx      # Custom navigation bar component
├── services/              # External API services
│   ├── plantNetDiseaseService.ts  # PlantNet API integration for disease detection
│   └── cameraService.ts   # Camera and image handling utilities
├── utils/                 # Utility functions and helpers
│   ├── csvParser.ts       # CSV data parsing and management
│   ├── farmingData.ts     # Static farming data and unit conversions
│   └── imageUtils.ts      # Image processing helpers
├── theme/                 # Theme management
│   └── ThemeProvider.tsx  # App-wide theme context provider
└── data/                  # CSV data files (Source of Truth)
    ├── clean.csv          # Main crop database
    ├── requirements_for_crops.csv # NPK and other requirements
    ├── grown.csv          # Regional growing information
    └── ph.csv             # Soil pH data
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app on your mobile device (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DhirajBro1/AgriFarm.git
   cd AgriFarm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your PlantNet API key
   ```
   
   **Required Variable:**
   ```
   EXPO_PUBLIC_PLANTNET_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device**
   - Scan the QR code with Expo Go app (Android)
   - Scan with Camera app (iOS) - it will open in Expo Go
   - Or use simulators: `npx expo start --android` / `npx expo start --ios`

### Environment Configuration

For the Disease Detection feature, you'll need a PlantNet API key:

1. **Get API Key**: Visit [my.plantnet.org](https://my.plantnet.org/) and create an account.
2. **Add to Environment**: Set `EXPO_PUBLIC_PLANTNET_API_KEY` in your `.env.local` file.
3. **Camera Permissions**: The app will request camera and photo library permissions automatically when accessing the disease detection feature.

### Building for Production

#### Android APK
```bash
eas build --platform android --profile preview
```

#### iOS Build
```bash
eas build --platform ios --profile preview
```

## 📊 Data Sources

The app uses carefully curated agricultural data:

- **Crop Database**: 100+ vegetables, fruits, and grains suitable for Nepal
- **Regional Information**: Altitude-based growing zones
- **PlantNet API**: State-of-the-art machine learning model for identifying plant diseases from images.
- **Seasonal Calendar**: Nepali month-based planting schedules
- **Local Units**: Traditional Nepali farming measurements (Ropani, Bigha, etc.)

## 🌍 Localization

Currently supports:
- **English Interface** with Nepali farming context
- **Nepali Calendar Months**: Baishakh, Jestha, Ashadh, Shrawan, etc.
- **Local Units**: Ropani, Bigha, Mana, Pathi, Dharni
- **Regional Terminology**: High Hills, Mid Hills, Terai

## 🤝 Contributing

We welcome contributions to make AgriFarm better for farmers! Here's how you can help:

### Ways to Contribute
1. **Add Crop Data**: Help expand the crop database with new varieties
2. **Improve Translations**: Add support for Nepali language interface
3. **Feature Development**: Add new farming tools and calculators
4. **Bug Fixes**: Report and fix issues
5. **Documentation**: Improve guides and documentation

### Development Guidelines
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Follow TypeScript conventions**
4. **Add comments for complex logic**
5. **Test on both Android and iOS**
6. **Submit pull request with detailed description**

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Nepali Farmers**: For their traditional knowledge and feedback
- **Agricultural Experts**: For crop data validation
- **PlantNet**: For providing the powerful disease identification API
- **Expo Team**: For the excellent development platform

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/DhirajBro1/AgriFarm/issues)
- **Community**: Join our farming community discussions
- **Developer**: DhirajBro1 Kabutor69 Alone Mysticstriver


---

<div align="center">
  <strong>🌾 Built with ❤️ for Nepali farmers</strong>
  <br>
  <em>Empowering agriculture through technology</em>
</div>
