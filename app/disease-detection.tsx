import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import CameraService, { CameraResult } from "../services/cameraService";
import PlantNetDiseaseService from "../services/plantNetDiseaseService";

const { width } = Dimensions.get("window");

interface AnalysisResult {
  isHealthy: boolean;
  healthProbability: number;
  isPlant: boolean;
  plantProbability: number;
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

export default function DiseaseDetectionScreen() {
  const [capturedImage, setCapturedImage] = useState<CameraResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );

  const handleTakePicture = async () => {
    try {
      const result = await CameraService.takePicture({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.cancelled) {
        setCapturedImage(result);
        setAnalysisResult(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take picture. Please try again.");
      console.error("Camera error:", error);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await CameraService.pickImage({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.cancelled) {
        setCapturedImage(result);
        setAnalysisResult(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
      console.error("Image picker error:", error);
    }
  };

  const analyzeDisease = async () => {
    if (!capturedImage || !capturedImage.base64) {
      Alert.alert("Error", "Please capture or select an image first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await PlantNetDiseaseService.identifyDiseaseFromBase64(
        [capturedImage.base64],
        true, // includeRelatedImages
      );

      const formattedResult =
        PlantNetDiseaseService.formatHealthSummary(response);
      setAnalysisResult(formattedResult);
    } catch (error) {
      console.error("Analysis error:", error);

      let errorMessage = "Failed to analyze plant health. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("API key is not configured")) {
          errorMessage =
            "PlantNet API key is not configured. Please check the app configuration and try again.";
        } else if (error.message.includes("Invalid API key")) {
          errorMessage =
            "Invalid API key. Please check your PlantNet API key configuration.";
        } else if (error.message.includes("Network connection failed")) {
          errorMessage =
            "Network connection failed. Please check your internet connection and try again.";
        } else if (error.message.includes("rate limit")) {
          errorMessage =
            "API rate limit exceeded. Please try again in a few minutes.";
        } else if (
          error.message.includes("service is temporarily unavailable")
        ) {
          errorMessage =
            "PlantNet disease service is temporarily unavailable. Please try again later.";
        }
      }

      Alert.alert("Analysis Error", errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderImagePickerButtons = () => (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={handleTakePicture}>
        <Ionicons name="camera" size={24} color="white" />
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handlePickImage}>
        <Ionicons name="image" size={24} color="white" />
        <Text style={styles.buttonText}>Choose from Gallery</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCapturedImage = () => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: capturedImage!.uri }}
        style={styles.capturedImage}
      />
      <TouchableOpacity style={styles.analyzeButton} onPress={analyzeDisease}>
        <Text style={styles.analyzeButtonText}>Analyze Plant Health</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHealthStatus = () => {
    if (!analysisResult) return null;

    return (
      <View style={styles.healthStatusContainer}>
        <Text style={styles.sectionTitle}>Health Assessment</Text>

        <View
          style={[
            styles.healthCard,
            {
              backgroundColor: analysisResult.isHealthy ? "#e8f5e8" : "#ffe8e8",
            },
          ]}
        >
          <View style={styles.healthHeader}>
            <Ionicons
              name={analysisResult.isHealthy ? "checkmark-circle" : "warning"}
              size={32}
              color={analysisResult.isHealthy ? "#4CAF50" : "#FF5722"}
            />
            <View style={styles.healthTextContainer}>
              <Text style={styles.healthTitle}>
                {analysisResult.isHealthy
                  ? "Healthy Plant"
                  : "Plant Issues Detected"}
              </Text>
              <Text style={styles.healthProbability}>
                Confidence:{" "}
                {(analysisResult.healthProbability * 100).toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.plantConfidence}>
            <Text style={styles.plantConfidenceText}>
              Plant Detection:{" "}
              {(analysisResult.plantProbability * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDiseaseList = () => {
    if (!analysisResult || analysisResult.topDiseases.length === 0) return null;

    return (
      <View style={styles.diseaseContainer}>
        <Text style={styles.sectionTitle}>Possible Issues</Text>

        {analysisResult.topDiseases.map((disease, index) => (
          <View key={index} style={styles.diseaseCard}>
            <View style={styles.diseaseHeader}>
              <Text style={styles.diseaseName}>{disease.name}</Text>
              <Text style={styles.diseaseProbability}>
                {(disease.probability * 100).toFixed(1)}%
              </Text>
            </View>

            {disease.similarImages.length > 0 && (
              <View style={styles.similarImagesContainer}>
                <Text style={styles.similarImagesTitle}>Similar Cases:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {disease.similarImages.map((image, imgIndex) => (
                    <View key={imgIndex} style={styles.similarImageWrapper}>
                      <Image
                        source={{ uri: image.url_small }}
                        style={styles.similarImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.similarityText}>
                        {(image.similarity * 100).toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Disease Detection</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Take a photo of your plant or choose from gallery to detect potential
          diseases and health issues using PlantNet AI-powered analysis.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoTitle}>How it works</Text>
          </View>
          <Text style={styles.infoText}>
            • Take a clear photo of the affected plant part{"\n"}• PlantNet AI
            analyzes the image for diseases{"\n"}• Get detailed results with
            similar cases{"\n"}• Requires internet connection for analysis
          </Text>
        </View>

        {!capturedImage && renderImagePickerButtons()}

        {capturedImage && renderCapturedImage()}

        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Analyzing plant health...</Text>
          </View>
        )}

        {renderHealthStatus()}
        {renderDiseaseList()}

        {capturedImage && !isAnalyzing && (
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => {
              setCapturedImage(null);
              setAnalysisResult(null);
            }}
          >
            <Text style={styles.retakeButtonText}>Take Another Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 140,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  capturedImage: {
    width: width - 32,
    height: (width - 32) * 0.75,
    borderRadius: 12,
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  healthStatusContainer: {
    marginBottom: 24,
  },
  healthCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  healthHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  healthTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  healthProbability: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  plantConfidence: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  plantConfidenceText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  diseaseContainer: {
    marginBottom: 24,
  },
  diseaseCard: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  diseaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textTransform: "capitalize",
  },
  diseaseProbability: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF5722",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  similarImagesContainer: {
    marginTop: 8,
  },
  similarImagesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  similarImageWrapper: {
    marginRight: 12,
    alignItems: "center",
  },
  similarImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  similarityText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  retakeButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  retakeButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
