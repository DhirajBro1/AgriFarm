import * as FileSystem from "expo-file-system/legacy";
import { ImageUtils } from "../utils/imageUtils";

interface PlantNetDiseaseImage {
  organ: string;
  author: string;
  license: string;
  date: {
    timestamp: number;
    string: string;
  };
  url: {
    o: string; // original
    m: string; // medium
    s: string; // small
  };
  citation: string;
}

interface PlantNetDiseaseResult {
  name: string;
  score: number;
  images: PlantNetDiseaseImage[];
  description: string;
}

interface PlantNetDiseaseQuery {
  images: string[];
  organs: string[];
  includeRelatedImages: boolean;
  noReject: boolean;
}

interface PlantNetDiseaseResponse {
  query: PlantNetDiseaseQuery;
  language: string;
  results: PlantNetDiseaseResult[];
  version: string;
  remainingIdentificationRequests: number;
}

interface PlantNetDiseaseRequest {
  images: { uri: string; organ?: string }[];
  includeRelatedImages?: boolean;
  noReject?: boolean;
}

interface FormattedDiseaseResult {
  name: string;
  description: string;
  confidence: number;
  similarImages: {
    url: string;
    urlSmall: string;
    author: string;
    similarity: number;
  }[];
}

interface HealthAssessment {
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

class PlantNetDiseaseService {
  private static readonly API_URL = "https://my-api.plantnet.org/v2/diseases";
  private static readonly PLANT_API_URL = "https://my-api.plantnet.org/v2/identify/all";
  private static readonly API_KEY = process.env.EXPO_PUBLIC_PLANTNET_API_KEY;

  /**
   * Gets the list of identifiable diseases
   * @param prefix - Optional prefix to filter diseases
   * @returns Promise<any[]> - List of available diseases
   */
  static async getDiseases(prefix?: string): Promise<any[]> {
    if (!this.API_KEY) {
      throw new Error(
        "PlantNet API key is not configured. Please add EXPO_PUBLIC_PLANTNET_API_KEY to your environment variables.",
      );
    }

    try {
      const url = `${this.API_URL}${prefix ? `?prefix=${prefix}&` : "?"}api-key=${this.API_KEY}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("PlantNet Disease API error:", error);
      throw new Error("Failed to fetch disease list. Please try again.");
    }
  }

  /**
   * Identifies diseases from plant images using PlantNet API
   * @param request - Object containing images and options
   * @returns Promise<PlantNetDiseaseResponse> - The disease identification results
   */
  static async identifyDisease(
    request: PlantNetDiseaseRequest,
  ): Promise<PlantNetDiseaseResponse> {
    // Validate API key
    if (!this.API_KEY) {
      throw new Error(
        "PlantNet API key is not configured. Please add EXPO_PUBLIC_PLANTNET_API_KEY to your environment variables.",
      );
    }

    // Validate request
    if (!request.images || request.images.length === 0) {
      throw new Error(
        "At least one image is required for disease identification.",
      );
    }

    try {
      // Create form data using React Native's FormData
      const formData = new FormData();

      console.log(
        "PlantNet Disease API: Starting FormData construction with",
        request.images.length,
        "images",
      );

      // Add images to form data
      for (let i = 0; i < request.images.length; i++) {
        const imageData = request.images[i];

        // Validate image URI using ImageUtils
        const isValidUri = await ImageUtils.validateImageUri(imageData.uri);
        if (!isValidUri) {
          throw new Error(
            `Image file not found or inaccessible: ${imageData.uri}`,
          );
        }

        console.log(`PlantNet Disease API: Adding image ${i}:`, {
          uri: imageData.uri,
          organ: imageData.organ || "auto",
        });

        // Append image file using correct field name (plural 'images')
        formData.append("images", {
          uri: imageData.uri,
          type: "image/jpeg",
          name: `image_${i}.jpg`,
        } as any);

        // Add organ for each image (match the field name from docs)
        formData.append("organs", imageData.organ || "auto");
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append("api-key", this.API_KEY);

      if (request.includeRelatedImages !== undefined) {
        params.append(
          "include-related-images",
          request.includeRelatedImages.toString(),
        );
      }

      if (request.noReject !== undefined) {
        params.append("no-reject", request.noReject.toString());
      }

      const fullUrl = `${this.API_URL}/identify?${params.toString()}`;
      console.log("PlantNet Disease API: Making request to:", fullUrl);
      console.log(
        "PlantNet Disease API: FormData constructed with fields:",
        Object.keys(formData),
      );

      // Make API request to diseases identify endpoint
      const apiResponse = await fetch(fullUrl, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header for FormData, let browser set it with boundary
      });

      if (!apiResponse.ok) {
        let errorMessage = `HTTP error! status: ${apiResponse.status}`;

        console.log(
          "PlantNet Disease API: Error response status:",
          apiResponse.status,
        );
        console.log(
          "PlantNet Disease API: Error response headers:",
          apiResponse.headers,
        );

        if (apiResponse.status === 401) {
          errorMessage =
            "Invalid API key. Please check your PlantNet API key configuration.";
        } else if (apiResponse.status === 429) {
          errorMessage = "API rate limit exceeded. Please try again later.";
        } else if (apiResponse.status >= 500) {
          errorMessage =
            "PlantNet disease service is temporarily unavailable. Please try again later.";
        }

        // Try to get more specific error from response body
        try {
          const errorText = await apiResponse.text();
          console.log("PlantNet Disease API: Error response body:", errorText);

          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage += ` - ${errorData.message}`;
            }
          } catch {
            // If not JSON, include raw text
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          }
        } catch {
          // Ignore response parsing errors
        }

        throw new Error(errorMessage);
      }

      const data: PlantNetDiseaseResponse = await apiResponse.json();

      // Validate response structure
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format from PlantNet Disease API.");
      }

      return data;
    } catch (error) {
      console.error("PlantNet Disease API error:", error);

      if (error instanceof Error) {
        // Re-throw our custom error messages
        throw error;
      }

      // Handle network errors
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as { message: string }).message;
        if (
          errorMessage.includes("Network request failed") ||
          errorMessage.includes("fetch")
        ) {
          throw new Error(
            "Network connection failed. Please check your internet connection and try again.",
          );
        }
      }

      throw new Error("Failed to identify disease. Please try again.");
    }
  }
  /**
   * Identifies plant species from images using PlantNet API
   * @param request - Object containing images and options
   * @returns Promise<any> - The plant identification results
   */
  static async identifyPlant(
    request: PlantNetDiseaseRequest,
  ): Promise<any> {
    if (!this.API_KEY) {
      throw new Error("PlantNet API key not configured.");
    }

    try {
      const formData = new FormData();
      for (let i = 0; i < request.images.length; i++) {
        formData.append("images", {
          uri: request.images[i].uri,
          type: "image/jpeg",
          name: `image_${i}.jpg`,
        } as any);
        formData.append("organs", request.images[i].organ || "auto");
      }

      const url = `${this.PLANT_API_URL}?api-key=${this.API_KEY}&include-related-images=false`;

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Plant identification failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("PlantNet Identification error:", error);
      throw error;
    }
  }

  /**
   * Identifies plant from base64 string
   */
  static async identifyPlantFromBase64(
    base64Images: string[]
  ): Promise<any> {
    const tempImages: { uri: string; organ?: string }[] = [];
    try {
      for (let i = 0; i < base64Images.length; i++) {
        const cleanBase64 = base64Images[i].replace(/^data:image\/[a-z]+;base64,/, "");
        const tempUri = `${FileSystem.documentDirectory}temp_plant_${i}_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(tempUri, cleanBase64, { encoding: "base64" as any });
        tempImages.push({ uri: tempUri });
      }

      const result = await this.identifyPlant({ images: tempImages });

      for (const tempImage of tempImages) {
        await FileSystem.deleteAsync(tempImage.uri, { idempotent: true });
      }

      return result;
    } catch (error) {
      for (const tempImage of tempImages) {
        await FileSystem.deleteAsync(tempImage.uri, { idempotent: true });
      }
      throw error;
    }
  }

  

  /**
   * Identifies diseases from base64 image data
   * @param base64Images - Array of base64 image strings
   * @param includeRelatedImages - Whether to include related images in response
   * @returns Promise<PlantNetDiseaseResponse> - The disease identification results
   */
  static async identifyDiseaseFromBase64(
    base64Images: string[],
    includeRelatedImages: boolean = true,
  ): Promise<PlantNetDiseaseResponse> {
    // Convert base64 to temporary files and use the regular identify method
    const tempImages: { uri: string; organ?: string }[] = [];

    try {
      for (let i = 0; i < base64Images.length; i++) {
        const base64String = base64Images[i];

        // Remove data URL prefix if present
        const cleanBase64 = base64String.replace(
          /^data:image\/[a-z]+;base64,/,
          "",
        );

        // Create temporary file
        const tempUri = `${FileSystem.documentDirectory}temp_disease_${i}_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(tempUri, cleanBase64, {
          encoding: "base64" as any,
        });

        tempImages.push({
          uri: tempUri,
        });
      }

      // Identify using temporary files
      const result = await this.identifyDisease({
        images: tempImages,
        includeRelatedImages,
      });

      // Clean up temporary files
      for (const tempImage of tempImages) {
        try {
          await FileSystem.deleteAsync(tempImage.uri, { idempotent: true });
        } catch {
          // Ignore cleanup errors
        }
      }

      return result;
    } catch (error) {
      // Clean up temporary files on error
      for (const tempImage of tempImages) {
        try {
          await FileSystem.deleteAsync(tempImage.uri, { idempotent: true });
        } catch {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }

  /**
   * Formats PlantNet disease response into a more user-friendly structure
   * @param response - The raw PlantNet disease API response
   * @returns Array of formatted disease results
   */
  static formatResults(
    response: PlantNetDiseaseResponse,
  ): FormattedDiseaseResult[] {
    if (!response.results || response.results.length === 0) {
      return [];
    }

    return response.results.map((result) => ({
      name: result.description || result.name,
      description: result.description || "No description available",
      confidence: Math.round(result.score * 100), // Convert to percentage
      similarImages: result.images.slice(0, 3).map((img, index) => ({
        url: img.url.m,
        urlSmall: img.url.s,
        author: img.author,
        similarity: Math.max(0.7, result.score - index * 0.1), // Simulate similarity scores
      })),
    }));
  }

  /**
   * Converts PlantNet disease response to Plant.id compatible format for UI compatibility
   * @param response - The raw PlantNet disease API response
   * @returns HealthAssessment compatible with existing UI
   */
  static formatHealthSummary(
    response: PlantNetDiseaseResponse,
  ): HealthAssessment {
    const formattedResults = this.formatResults(response);

    // Determine if plant is healthy based on disease scores
    const hasSignificantDisease = formattedResults.some(
      (result) => result.confidence > 50,
    );
    const isHealthy = !hasSignificantDisease;
    const healthProbability = isHealthy
      ? 1.0 -
      (formattedResults.length > 0 ? formattedResults[0].confidence / 100 : 0)
      : formattedResults.length > 0
        ? 1.0 - formattedResults[0].confidence / 100
        : 0.5;

    // Convert to Plant.id format for UI compatibility
    const topDiseases = formattedResults.slice(0, 3).map((result) => ({
      name: result.name,
      probability: result.confidence / 100,
      similarImages: result.similarImages.map((img, index) => ({
        id: `img_${index}`,
        url: img.url,
        url_small: img.urlSmall,
        similarity: img.similarity,
      })),
    }));

    return {
      isHealthy,
      healthProbability,
      isPlant: true, // PlantNet disease API assumes input is a plant
      plantProbability: 0.95, // High confidence since we're using a plant disease API
      topDiseases,
    };
  }

  /**
   * Gets the best match from disease identification results
   * @param response - The raw PlantNet disease API response
   * @returns The highest scoring disease result or null if no results
   */
  static getBestMatch(
    response: PlantNetDiseaseResponse,
  ): FormattedDiseaseResult | null {
    const formattedResults = this.formatResults(response);
    return formattedResults.length > 0 ? formattedResults[0] : null;
  }

  /**
   * Creates a summary of the disease identification results
   * @param response - The raw PlantNet disease API response
   * @returns Object with summary information
   */
  static createSummary(response: PlantNetDiseaseResponse): {
    totalResults: number;
    bestMatch: FormattedDiseaseResult | null;
    averageConfidence: number;
    remainingRequests: number;
    isHealthy: boolean;
  } {
    const formattedResults = this.formatResults(response);
    const averageConfidence =
      formattedResults.length > 0
        ? Math.round(
          formattedResults.reduce(
            (sum, result) => sum + result.confidence,
            0,
          ) / formattedResults.length,
        )
        : 0;

    const hasSignificantDisease = formattedResults.some(
      (result) => result.confidence > 50,
    );

    return {
      totalResults: formattedResults.length,
      bestMatch: this.getBestMatch(response),
      averageConfidence,
      remainingRequests: response.remainingIdentificationRequests,
      isHealthy: !hasSignificantDisease,
    };
  }

  /**
   * Converts base64 string to data URL format if needed
   * @param base64String - The base64 string
   * @param mimeType - The MIME type (default: image/jpeg)
   * @returns Data URL formatted string
   */
  static convertImageToBase64DataUrl(
    base64String: string,
    mimeType: string = "image/jpeg",
  ): string {
    // If already a data URL, return as is
    if (base64String.startsWith("data:")) {
      return base64String;
    }

    // Convert base64 string to data URL
    return `data:${mimeType};base64,${base64String}`;
  }
}

export default PlantNetDiseaseService;
export type {
  FormattedDiseaseResult,
  HealthAssessment, PlantNetDiseaseRequest, PlantNetDiseaseResponse,
  PlantNetDiseaseResult
};

