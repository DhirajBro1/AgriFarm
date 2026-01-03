/**
 * DiseaseDetectionScreen - Merged Legacy Features + Modern UI
 * Focus: Deep Data (Images, Confidence) + Inline Info
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CameraService, { CameraResult } from "../services/cameraService";
import GeminiDiseaseService from "../services/geminiDiseaseService";
import PlantNetDiseaseService from "../services/plantNetDiseaseService";
import { ThemeColors, useTheme } from "../theme/ThemeProvider";

// ... Interfaces maintained ...
interface AnalysisResult {
  isHealthy: boolean;
  healthProbability: number;
  isPlant: boolean;
  plantProbability: number;
  identifiedPlant?: {
    commonName: string;
    scientificName: string;
    probability: number;
  };
  topDiseases: {
    name: string;
    probability: number;
    similarImages: {
      id: string;
      url: string;
      url_small: string;
      similarity: number;
    }[];
  }[];
}

interface DiseaseSolution {
  diseaseName: string;
  solutions: string[];
  preventionTips: string[];
  summary: string;
}

export default function DiseaseDetectionScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, spacing, insets), [colors, typography, spacing, insets]);

  const [capturedImage, setCapturedImage] = useState<CameraResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [diseaseSolutions, setDiseaseSolutions] = useState<DiseaseSolution | null>(null);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);

  // ... (Camera Logic Same as before) ...
  const handleTakePicture = async () => {
    try {
      const result = await CameraService.takePicture({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
      if (!result.cancelled) { setCapturedImage(result); setAnalysisResult(null); setDiseaseSolutions(null); }
    } catch (error) { Alert.alert(t('common.error'), t('diseaseDetection.errors.takePicture')); }
  };

  const handlePickImage = async () => {
    try {
      const result = await CameraService.pickImage({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
      if (!result.cancelled) { setCapturedImage(result); setAnalysisResult(null); setDiseaseSolutions(null); }
    } catch (error) { Alert.alert(t('common.error'), t('diseaseDetection.errors.pickImage')); }
  };

  const analyzeDisease = async () => {
    if (!capturedImage?.base64) return;
    setIsAnalyzing(true);
    console.log('🔍 Starting disease analysis...');

    try {
      // 1. Identify Plant Species
      console.log('🌿 Identifying plant species...');
      const plantResponse = await PlantNetDiseaseService.identifyPlantFromBase64([capturedImage.base64]);
      let identifiedPlant;
      if (plantResponse.results && plantResponse.results.length > 0) {
        const bestPlantMatch = plantResponse.results[0];
        identifiedPlant = {
          commonName: bestPlantMatch.species.commonNames?.[0] || bestPlantMatch.species.scientificNameWithoutAuthor,
          scientificName: bestPlantMatch.species.scientificNameWithoutAuthor,
          probability: bestPlantMatch.score
        };
      }

      // 2. Identify Diseases
      console.log('🦠 Identifying diseases...');
      const diseaseResponse = await PlantNetDiseaseService.identifyDiseaseFromBase64([capturedImage.base64], true);
      const formattedResult = PlantNetDiseaseService.formatHealthSummary(diseaseResponse);

      // 3. Combine Results
      const combinedResult: AnalysisResult = {
        ...formattedResult,
        identifiedPlant
      };

      console.log('📊 Combined Analysis result:', combinedResult);
      setAnalysisResult(combinedResult);

      // Always try to get analysis from Gemini (for any result or general advice)
      console.log('🩺 Getting analysis and recommendations...');
      setIsLoadingSolutions(true);
      try {
        let diseaseToAnalyze = 'General Plant Health';
        let confidence = 0.5;
        let isHealthyStatus = formattedResult.isHealthy;

        if (formattedResult.topDiseases.length > 0) {
          const topDisease = formattedResult.topDiseases[0];
          diseaseToAnalyze = topDisease.name;
          confidence = topDisease.probability;
          console.log('🎯 Analyzing detected issue:', diseaseToAnalyze, 'confidence:', confidence);
        } else {
          console.log('📋 No specific diseases detected, providing general care advice');
        }

        const solutions = await GeminiDiseaseService.getDiseaseSolutions(
          diseaseToAnalyze,
          confidence,
          isHealthyStatus,
          combinedResult.identifiedPlant?.commonName || 'the plant',
          i18n.language || 'en'
        );

        console.log('💊 Analysis received:');
        setDiseaseSolutions(solutions);
      } catch (error) {
        console.error('❌ Error getting analysis:', error);
        // Don't show alert, just log - analysis is optional enhancement
      } finally {
        setIsLoadingSolutions(false);
      }
    } catch (error) {
      console.error('❌ Analysis Error:', error);
      Alert.alert(t('diseaseDetection.errors.analysis'), t('diseaseDetection.errors.analysis'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('diseaseDetection.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Viewfinder */}
        <View style={styles.viewfinderContainer}>
          {capturedImage ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.closeImageBtn}
                onPress={() => { setCapturedImage(null); setAnalysisResult(null); }}
              >
                <Ionicons name="close-circle" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.placeholder} onPress={handleTakePicture}>
              <View style={styles.dashedBox}>
                <Ionicons name="scan-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.placeholderText}>{t('diseaseDetection.tapToScan')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Card (Legacy Style) */}
        {!capturedImage && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={styles.infoTitle}>{t('diseaseDetection.howItWorks.title')}</Text>
            </View>
            <Text style={styles.infoText}>
              • {t('diseaseDetection.howItWorks.step1')}{"\n"}
              • {t('diseaseDetection.howItWorks.step2')}{"\n"}
              • {t('diseaseDetection.howItWorks.step3')}
            </Text>
          </View>
        )}

        {/* Controls */}
        {!capturedImage && (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
              <Ionicons name="camera" size={32} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryLink} onPress={handlePickImage}>
              <Text style={styles.galleryText}>{t('diseaseDetection.uploadGallery')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analysis Loading/Button */}
        {capturedImage && !analysisResult && (
          <View style={styles.actionContainer}>
            {isAnalyzing ? (
              <View style={styles.centerParams}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{t('diseaseDetection.analyzing')}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeDisease}>
                <Text style={styles.analyzeBtnText}>{t('diseaseDetection.checkHealth')}</Text>
                <Ionicons name="sparkles" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* RESULTS */}
        {analysisResult && (
          <View style={styles.resultsContainer}>

            {/* Identified Plant Info */}
            {analysisResult.identifiedPlant && (
              <View style={styles.identifiedPlantCard}>
                <View style={[styles.cardAccent, { backgroundColor: colors.primary }]} />
                <View style={styles.identifiedPlantContent}>
                  <View style={styles.identifiedPlantHeader}>
                    <View style={styles.plantIconContainer}>
                      <Ionicons name="leaf" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.identifiedPlantTitle}>{t('diseaseDetection.identifiedPlant')}</Text>
                    <View style={styles.plantConfidenceBadge}>
                      <Text style={styles.plantConfidenceText}>
                        {(analysisResult.identifiedPlant.probability * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.plantNameGroup}>
                    <Text style={styles.plantCommonName}>{analysisResult.identifiedPlant.commonName}</Text>
                    <View style={styles.scientificContainer}>
                      <Text style={styles.scientificLabel}>{t('diseaseDetection.scientificName')}: </Text>
                      <Text style={styles.plantScientificName}>{analysisResult.identifiedPlant.scientificName}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Health Status */}
            <View style={[
              styles.statusCard,
              {
                backgroundColor: analysisResult.isHealthy ? '#ECFDF5' : '#FEF2F2',
                borderColor: analysisResult.isHealthy ? '#10B981' : '#EF4444'
              }
            ]}>
              <Ionicons
                name={analysisResult.isHealthy ? "happy" : "alert-circle"}
                size={40}
                color={analysisResult.isHealthy ? '#065F46' : '#991B1B'}
              />
              <Text style={[styles.statusTitle, { color: analysisResult.isHealthy ? '#065F46' : '#991B1B' }]}>
                {analysisResult.isHealthy ? t('diseaseDetection.healthStatus.healthy') : t('diseaseDetection.healthStatus.diseased')}
              </Text>
              <Text style={[styles.confidenceText, { color: analysisResult.isHealthy ? '#065F46' : '#991B1B' }]}>
                {(analysisResult.healthProbability * 100).toFixed(0)}% {t('diseaseDetection.healthStatus.certainty')}
              </Text>
            </View>



            {/* Top Diseases + Similar Images */}
            {analysisResult.topDiseases.length > 0 && (
              <View style={styles.diseaseList}>
                <Text style={styles.sectionHeader}>{t('diseaseDetection.matches')}</Text>
                {analysisResult.topDiseases.map((d, i) => (
                  <View key={i} style={styles.diseaseCard}>
                    <View style={styles.diseaseHeader}>
                      <Text style={styles.diseaseName} numberOfLines={2}>{d.name}</Text>
                      <View style={styles.percentBadge}>
                        <Text style={styles.percentText}>{(d.probability * 100).toFixed(0)}%</Text>
                      </View>
                    </View>

                    {/* Similar Images Scroll */}
                    {d.similarImages && d.similarImages.length > 0 && (
                      <View style={styles.imageScrollContainer}>
                        <Text style={styles.similarLabel}>{t('diseaseDetection.similarImages')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {d.similarImages.map((img, idx) => (
                            <Image
                              key={idx}
                              source={{ uri: img.url_small }}
                              style={styles.similarImage}
                            />
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Disease Solutions */}
            {diseaseSolutions && (
              <View style={styles.solutionsContainer}>
                <Text style={styles.sectionHeader}>{t('diseaseDetection.analysisGuide')}</Text>

                {/* Disease Summary */}
                <View style={styles.summaryCard}>
                  <Text style={[styles.summaryText, { color: colors.text }]}>{diseaseSolutions.summary}</Text>
                </View>

                {/* Solutions */}
                <View style={styles.solutionsCard}>
                  <Text style={styles.subHeader}>{t('diseaseDetection.careRecommendations')}</Text>
                  {diseaseSolutions.solutions.map((solution, index) => (
                    <View key={index} style={styles.solutionItem}>
                      <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                      <Text style={[styles.solutionText, { color: colors.textSecondary }]}>{solution}</Text>
                    </View>
                  ))}
                </View>

                {/* Prevention Tips */}
                <View style={styles.preventionCard}>
                  <Text style={styles.subHeader}>{t('diseaseDetection.generalTips')}</Text>
                  {diseaseSolutions.preventionTips.map((tip, index) => (
                    <View key={index} style={styles.solutionItem}>
                      <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                      <Text style={[styles.solutionText, { color: colors.textSecondary }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Loading Solutions */}
            {isLoadingSolutions && (
              <View style={styles.loadingSolutions}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingSolutionsText}>{t('diseaseDetection.gettingRecommendations')}</Text>
              </View>
            )}

            {/* Debug Info */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>
                  Debug: isHealthy={analysisResult?.isHealthy ? 'true' : 'false'},
                  diseases={analysisResult?.topDiseases?.length || 0},
                  hasSolutions={diseaseSolutions ? 'true' : 'false'}
                </Text>
                {analysisResult?.topDiseases?.length > 0 && (
                  <Text style={styles.debugText}>
                    Top disease: {analysisResult.topDiseases[0].name} ({(analysisResult.topDiseases[0].probability * 100).toFixed(0)}%)
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={async () => {
                    console.log('🧪 Testing Gemini API with disease...');
                    try {
                      const testSolutions = await GeminiDiseaseService.getDiseaseSolutions('Powdery Mildew', 0.85, false, i18n.language || 'en');
                      console.log('✅ Disease test successful:', testSolutions);
                      setDiseaseSolutions(testSolutions);
                      setAnalysisResult({
                        isHealthy: false,
                        healthProbability: 0.15,
                        isPlant: true,
                        plantProbability: 0.95,
                        topDiseases: [{
                          name: 'Powdery Mildew',
                          probability: 0.85,
                          similarImages: []
                        }]
                      });
                    } catch (error) {
                      console.error('❌ Disease test failed:', error);
                    }
                  }}
                >
                  <Text style={styles.testButtonText}>Test Disease</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.testButton, { backgroundColor: '#2196F3', marginTop: 8 }]}
                  onPress={async () => {
                    console.log('🧪 Testing Gemini API with healthy plant...');
                    try {
                      const testSolutions = await GeminiDiseaseService.getDiseaseSolutions('General Plant Health', 0.5, true, i18n.language || 'en');
                      console.log('✅ Healthy test successful:', testSolutions);
                      setDiseaseSolutions(testSolutions);
                      setAnalysisResult({
                        isHealthy: true,
                        healthProbability: 0.95,
                        isPlant: true,
                        plantProbability: 0.95,
                        topDiseases: []
                      });
                    } catch (error) {
                      console.error('❌ Healthy test failed:', error);
                    }
                  }}
                >
                  <Text style={styles.testButtonText}>Test Healthy</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: any, spacing: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingTop: insets.top + spacing.s,
    paddingBottom: spacing.m,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.m,
  },
  backButton: { padding: spacing.s, marginLeft: -spacing.s },
  scrollContent: { paddingBottom: spacing.xxl + insets.bottom },
  viewfinderContainer: { paddingHorizontal: spacing.l, marginTop: spacing.s },
  placeholder: {
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 32,
    padding: spacing.m,
  },
  dashedBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: spacing.m,
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  previewWrapper: {
    aspectRatio: 3 / 4,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  previewImage: { width: '100%', height: '100%' },
  closeImageBtn: { position: 'absolute', top: spacing.m, right: spacing.m, zIndex: 10 },
  controls: { alignItems: 'center', marginTop: spacing.xl },
  captureButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  galleryLink: { marginTop: spacing.l, padding: spacing.s },
  galleryText: { color: colors.textSecondary, textDecorationLine: 'underline' },
  actionContainer: { padding: spacing.l, marginTop: spacing.l },
  analyzeBtn: {
    backgroundColor: colors.text, borderRadius: 20, paddingVertical: spacing.l, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  analyzeBtnText: { color: colors.background, fontSize: typography.sizes.large, fontWeight: typography.weights.bold, marginRight: spacing.s },
  centerParams: { alignItems: 'center' },
  loadingText: { marginTop: spacing.m, color: colors.textSecondary },

  resultsContainer: { padding: spacing.l },

  identifiedPlantCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardAccent: {
    width: 6,
    height: '100%',
  },
  identifiedPlantContent: {
    flex: 1,
    padding: spacing.m,
  },
  identifiedPlantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  plantIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  identifiedPlantTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    flex: 1,
  },
  plantNameGroup: {
    marginTop: 2,
  },
  plantCommonName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: -0.5,
  },
  scientificContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  scientificLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  plantScientificName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  plantConfidenceBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  plantConfidenceText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },

  statusCard: {
    padding: spacing.l, borderRadius: 24, alignItems: 'center', borderWidth: 1, marginBottom: spacing.l,
  },
  statusTitle: { fontSize: typography.sizes.header, fontWeight: typography.weights.bold, marginTop: spacing.s },
  confidenceText: { marginTop: 4, fontWeight: '600' },

  tipBox: {
    backgroundColor: colors.card, borderRadius: 20, padding: spacing.m, marginBottom: spacing.l,
    borderLeftWidth: 4, borderLeftColor: colors.primary, borderWidth: 1, borderColor: colors.border,
  },
  tipTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  tipText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

  diseaseList: {},
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.m, color: colors.text },

  diseaseCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: spacing.m, marginBottom: spacing.m,
    borderWidth: 1, borderColor: colors.border
  },
  diseaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s, gap: spacing.s },
  diseaseName: { fontSize: 16, fontWeight: '600', color: colors.text, textTransform: 'capitalize', flex: 1 },
  percentBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  percentText: { fontSize: 14, fontWeight: 'bold', color: colors.primary },

  imageScrollContainer: { marginTop: spacing.s },
  similarLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.s },
  similarImage: { width: 80, height: 80, borderRadius: 12, marginRight: spacing.s, backgroundColor: colors.cardMuted },

  /* Info Card */
  infoCard: {
    marginHorizontal: spacing.l, marginTop: spacing.m, padding: spacing.m, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoTitle: { color: colors.primary, fontWeight: 'bold', marginLeft: 8 },
  infoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },

  /* Solutions Section */
  solutionsContainer: { marginTop: spacing.l },
  summaryCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: spacing.m, marginBottom: spacing.m,
    borderWidth: 1, borderColor: colors.border
  },
  summaryText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  solutionsCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: spacing.m, marginBottom: spacing.m,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.success
  },
  preventionCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: spacing.m, marginBottom: spacing.m,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.warning
  },
  subHeader: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.s },
  solutionItem: { flexDirection: 'row', marginBottom: spacing.xs, alignItems: 'flex-start', paddingVertical: 2 },
  bulletPoint: { fontSize: 16, color: colors.text, marginRight: spacing.s, marginTop: 2 },
  solutionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, flex: 1 },
  loadingSolutions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.m },
  loadingSolutionsText: { marginLeft: spacing.s, color: colors.textSecondary, fontSize: 14 },

  /* Debug Info */
  debugContainer: {
    backgroundColor: colors.card, borderRadius: 8, padding: spacing.s, marginTop: spacing.m,
    borderWidth: 1, borderColor: colors.border
  },
  debugText: { fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' },
  testButton: {
    backgroundColor: colors.primary, padding: spacing.s, borderRadius: 6, marginTop: spacing.s,
    alignItems: 'center'
  },
  testButtonText: { color: colors.background, fontSize: 14, fontWeight: 'bold' }
});
