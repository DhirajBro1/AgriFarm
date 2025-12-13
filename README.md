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
- **Expo Router** for file-based navigation

### **Data Management**
- **CSV-based Database**: Efficient storage of crop information
- **AsyncStorage**: Local data persistence
- **Singleton Pattern**: Centralized data management with CSVParser

### **Design & UI**
- **Theme System**: Dynamic light/dark mode with comprehensive color palette
- **Responsive Design**: Optimized for different screen sizes
- **Safe Area Handling**: Support for modern devices with notches
- **Intuitive Navigation**: Bottom tab navigation with visual feedback

### **Key Components**
```
├── app/                    # Main application screens
│   ├── index.tsx          # Home/Dashboard screen
│   ├── crops.tsx          # Crop browsing and search
│   ├── tools.tsx          # Farming calculators and tools
│   ├── tips.tsx           # Farming tips and pest info
│   └── account.tsx        # User profile management
├── components/            # Reusable UI components
│   └── BottomNav.tsx      # Navigation bar component
├── utils/                 # Utility functions and helpers
│   ├── csvParser.ts       # Data parsing and management
│   └── farmingData.ts     # Static farming data and conversions
├── theme/                 # Theme management
│   └── ThemeProvider.tsx  # App-wide theme context
└── data/                  # CSV data files
    ├── clean.csv          # Main crop database
    ├── requirements_for_crops.csv
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

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - Scan the QR code with Expo Go app (Android)
   - Scan with Camera app (iOS) - it will open in Expo Go
   - Or use simulators: `npx expo start --android` / `npx expo start --ios`

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
- **Fertilizer Data**: NPK requirements for optimal growth
- **Seasonal Calendar**: Nepali month-based planting schedules
- **pH Requirements**: Soil acidity preferences for different crops
- **Local Units**: Traditional Nepali farming measurements

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
- **Open Source Community**: For the amazing tools and libraries
- **Expo Team**: For the excellent development platform

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/DhirajBro1/AgriFarm/issues)
- **Email**: support@agrifarm.com
- **Community**: Join our farming community discussions

## 🔮 Roadmap

### Upcoming Features
- [ ] **Weather Integration**: Local weather forecasts and alerts
- [ ] **Market Prices**: Real-time crop price information
- [ ] **Community Forum**: Farmer-to-farmer knowledge sharing
- [ ] **Offline Mode**: Full app functionality without internet
- [ ] **Voice Interface**: Nepali voice commands and responses
- [ ] **Image Recognition**: Pest and disease identification via camera
- [ ] **Government Schemes**: Information about agricultural subsidies

### Version History
- **v1.0.0**: Initial release with core features

---

<div align="center">
  <strong>🌾 Built with ❤️ for Nepali farmers</strong>
  <br>
  <em>Empowering agriculture through technology</em>
</div>
