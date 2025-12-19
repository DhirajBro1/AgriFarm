import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

interface ImageProcessingOptions {
  quality?: number;
  format?: "jpeg" | "png";
  maxWidth?: number;
  maxHeight?: number;
  compress?: number;
}

interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

/**
 * Utility class for image processing and conversion for PlantNet API
 */
export class ImageUtils {
  /**
   * Processes an image for optimal PlantNet API submission
   * @param imageUri - URI of the image to process
   * @param options - Processing options
   * @returns Promise<ProcessedImage> - Processed image information
   */
  static async processImageForPlantNet(
    imageUri: string,
    options: ImageProcessingOptions = {},
  ): Promise<ProcessedImage> {
    const {
      format = "jpeg",
      maxWidth = 1024,
      maxHeight = 1024,
      compress = 0.7,
    } = options;

    try {
      // Validate input URI
      if (!imageUri || typeof imageUri !== "string" || imageUri.trim() === "") {
        throw new Error(`Invalid image URI provided: ${imageUri}`);
      }

      // Normalize and validate URI
      const normalizedUri = this.normalizeImageUri(imageUri);
      const isValidUri = await this.validateImageUriWithFallback(normalizedUri);
      if (!isValidUri) {
        throw new Error(
          `Image file not found or inaccessible: ${normalizedUri}`,
        );
      }

      // Use normalized URI for processing
      const processUri = normalizedUri;

      // Process image to optimize for API
      const manipulateOptions = [];

      // Resize if needed
      if (maxWidth || maxHeight) {
        manipulateOptions.push({
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        });
      }

      const result = await manipulateAsync(processUri, manipulateOptions, {
        compress: compress,
        format: format === "jpeg" ? SaveFormat.JPEG : SaveFormat.PNG,
        base64: true,
      });

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        base64: result.base64,
      };
    } catch (error) {
      console.error("Error processing image:", error);
      console.error("Original image URI:", imageUri);

      if (error instanceof Error) {
        if (error.message.includes("Invalid image URI")) {
          throw error; // Re-throw the specific error
        } else if (error.message.includes("Image file not found")) {
          throw new Error(`Image file not found or inaccessible: ${imageUri}`);
        }
      }

      throw new Error(
        `Failed to process image for plant identification: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Converts a base64 string to a temporary file URI
   * @param base64String - Base64 encoded image data
   * @param filename - Optional filename (default: generated timestamp)
   * @returns Promise<string> - URI of the temporary file
   */
  static async base64ToTempFile(
    base64String: string,
    filename?: string,
  ): Promise<string> {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64String.replace(
        /^data:image\/[a-z]+;base64,/,
        "",
      );

      // Generate filename if not provided
      const fileName = filename || `temp_image_${Date.now()}.jpg`;
      const tempUri =
        (FileSystem.cacheDirectory || FileSystem.documentDirectory || "") +
        fileName;

      // Write base64 to temporary file
      await FileSystem.writeAsStringAsync(tempUri, cleanBase64, {
        encoding: "base64" as any,
      });

      return tempUri;
    } catch (error) {
      console.error("Error converting base64 to file:", error);
      throw new Error("Failed to convert base64 image to file");
    }
  }

  /**
   * Converts an image file to base64
   * @param imageUri - URI of the image file
   * @returns Promise<string> - Base64 encoded image data
   */
  static async fileToBase64(imageUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64" as any,
      });
      return base64;
    } catch (error) {
      console.error("Error converting file to base64:", error);
      throw new Error("Failed to convert image file to base64");
    }
  }

  /**
   * Normalizes URI to handle different formats from different sources
   * @param uri - URI to normalize
   * @returns string - Normalized URI
   */
  static normalizeImageUri(uri: string): string {
    if (!uri) return uri;

    // Handle file:// protocol issues on some platforms
    if (uri.startsWith("file://") && !uri.includes("file:///")) {
      // Ensure proper file protocol format
      return uri.replace("file://", "file:///");
    }

    // Handle content:// URIs on Android by keeping them as-is
    if (uri.startsWith("content://")) {
      return uri;
    }

    // Handle asset URIs
    if (uri.startsWith("asset://") || uri.startsWith("assets://")) {
      return uri;
    }

    // For other URIs, ensure they're properly formatted
    return uri;
  }

  /**
   * Validates if an image URI is valid and accessible with fallback methods
   * @param imageUri - URI to validate
   * @returns Promise<boolean> - True if valid, false otherwise
   */
  static async validateImageUriWithFallback(
    imageUri: string,
  ): Promise<boolean> {
    const normalizedUri = this.normalizeImageUri(imageUri);

    try {
      // Primary validation method
      const fileInfo = await FileSystem.getInfoAsync(normalizedUri);

      if (fileInfo.exists) {
        return true;
      }
    } catch {}

    try {
      // Fallback: Try to read file size as validation
      const base64 = await FileSystem.readAsStringAsync(normalizedUri, {
        encoding: "base64" as any,
        length: 100, // Just read first 100 characters to check accessibility
      });

      if (base64 && base64.length > 0) {
        return true;
      }
    } catch {}

    // Final fallback: Try with manipulateAsync which sometimes works when getInfoAsync doesn't
    try {
      await manipulateAsync(normalizedUri, [], {
        compress: 1.0,
        format: SaveFormat.JPEG,
      });

      return true;
    } catch {}

    return false;
  }

  /**
   * Validates if an image URI is valid and accessible
   * @param imageUri - URI to validate
   * @returns Promise<boolean> - True if valid, false otherwise
   */
  static async validateImageUri(imageUri: string): Promise<boolean> {
    return await this.validateImageUriWithFallback(imageUri);
  }

  /**
   * Gets image dimensions without loading the full image
   * @param imageUri - URI of the image
   * @returns Promise<{width: number, height: number}> - Image dimensions
   */
  static async getImageDimensions(
    imageUri: string,
  ): Promise<{ width: number; height: number }> {
    try {
      const result = await manipulateAsync(imageUri, [], {
        compress: 0.1,
        format: SaveFormat.JPEG,
      });
      return { width: result.width, height: result.height };
    } catch (error) {
      console.error("Error getting image dimensions:", error);
      throw new Error("Failed to get image dimensions");
    }
  }

  /**
   * Cleans up temporary image files
   * @param imageUris - Array of temporary image URIs to delete
   * @returns Promise<void>
   */
  static async cleanupTempImages(imageUris: string[]): Promise<void> {
    const cleanupPromises = imageUris.map(async (uri) => {
      try {
        // Only delete files in cache directory for safety
        if (
          uri.includes(
            FileSystem.cacheDirectory || FileSystem.documentDirectory || "",
          )
        ) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch (error) {
        console.warn(`Failed to cleanup temp image ${uri}:`, error);
      }
    });

    await Promise.all(cleanupPromises);
  }

  /**
   * Creates a data URL from base64 image data
   * @param base64String - Base64 encoded image data
   * @param mimeType - MIME type of the image (default: image/jpeg)
   * @returns string - Data URL
   */
  static createDataUrl(
    base64String: string,
    mimeType: string = "image/jpeg",
  ): string {
    // Remove existing data URL prefix if present
    const cleanBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, "");
    return `data:${mimeType};base64,${cleanBase64}`;
  }

  /**
   * Estimates the file size of a base64 encoded image
   * @param base64String - Base64 encoded image data
   * @returns number - Estimated file size in bytes
   */
  static estimateBase64FileSize(base64String: string): number {
    // Remove data URL prefix if present
    const cleanBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, "");

    // Base64 encoding increases size by ~33%, so divide by 1.33 to get original size
    return Math.round((cleanBase64.length * 3) / 4);
  }

  /**
   * Checks if an image is too large for the API
   * @param base64String - Base64 encoded image data
   * @param maxSizeBytes - Maximum allowed size in bytes (default: 5MB)
   * @returns boolean - True if image is within size limit
   */
  static isImageSizeValid(
    base64String: string,
    maxSizeBytes: number = 5 * 1024 * 1024, // 5MB default
  ): boolean {
    const estimatedSize = this.estimateBase64FileSize(base64String);
    return estimatedSize <= maxSizeBytes;
  }

  /**
   * Debug method to test URI validation independently
   * @param imageUri - URI to test
   * @returns Promise<void> - Logs validation results
   */
  static async debugValidateUri(imageUri: string): Promise<void> {
    console.log(`=== Debug URI Validation for: ${imageUri} ===`);

    // Test original URI
    console.log("1. Testing original URI...");
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      console.log("✓ Original URI file info:", fileInfo);
    } catch (error) {
      console.log("✗ Original URI failed:", error);
    }

    // Test normalized URI
    const normalizedUri = this.normalizeImageUri(imageUri);
    console.log(`2. Testing normalized URI: ${normalizedUri}`);
    try {
      const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
      console.log("✓ Normalized URI file info:", fileInfo);
    } catch (error) {
      console.log("✗ Normalized URI failed:", error);
    }

    // Test fallback validation
    console.log("3. Testing fallback validation...");
    const isValid = await this.validateImageUriWithFallback(imageUri);
    console.log(`✓ Fallback validation result: ${isValid}`);

    console.log("=== End Debug URI Validation ===");
  }

  /**
   * Compresses an image if it's too large
   * @param imageUri - URI of the image to compress
   * @param maxSizeBytes - Maximum allowed size in bytes
   * @param quality - Initial compression quality (0-1)
   * @returns Promise<ProcessedImage> - Compressed image
   */
  static async compressImageIfNeeded(
    imageUri: string,
    maxSizeBytes: number = 5 * 1024 * 1024, // 5MB
    quality: number = 0.8,
  ): Promise<ProcessedImage> {
    let currentQuality = quality;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const processed = await this.processImageForPlantNet(imageUri, {
        compress: currentQuality,
        quality: currentQuality,
      });

      if (
        processed.base64 &&
        this.isImageSizeValid(processed.base64, maxSizeBytes)
      ) {
        return processed;
      }

      // Reduce quality for next attempt
      currentQuality *= 0.7;
      attempts++;

      if (currentQuality < 0.1) {
        break;
      }
    }

    throw new Error("Unable to compress image to acceptable size for API");
  }
}

export type { ImageProcessingOptions, ProcessedImage };
