import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

export interface CameraOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export interface CameraResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  cancelled: boolean;
}

class CameraService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      return (
        cameraPermission.status === "granted" &&
        mediaLibraryPermission.status === "granted"
      );
    } catch (error) {
      console.error("Error requesting camera permissions:", error);
      return false;
    }
  }

  static async takePicture(options: CameraOptions = {}): Promise<CameraResult> {
    const hasPermission = await this.requestPermissions();

    if (!hasPermission) {
      throw new Error("Camera permissions not granted");
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          uri: "",
          base64: "",
          width: 0,
          height: 0,
          cancelled: true,
        };
      }

      const asset = result.assets[0];

      // Validate URI
      if (!asset.uri) {
        throw new Error("Camera failed to provide image URI");
      }

      // Validate that the file exists
      try {
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (!fileInfo.exists) {
          throw new Error("Captured image file not found at URI");
        }
      } catch (error) {
        console.error("Camera image validation failed:", error);
        throw new Error("Failed to validate captured image");
      }

      return {
        uri: asset.uri,
        base64: asset.base64 || undefined,
        width: asset.width,
        height: asset.height,
        cancelled: false,
      };
    } catch (error) {
      console.error("Error taking picture:", error);
      throw new Error("Failed to take picture");
    }
  }

  static async pickImage(options: CameraOptions = {}): Promise<CameraResult> {
    const hasPermission = await this.requestPermissions();

    if (!hasPermission) {
      throw new Error("Media library permissions not granted");
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          uri: "",
          base64: "",
          width: 0,
          height: 0,
          cancelled: true,
        };
      }

      const asset = result.assets[0];

      // Validate URI
      if (!asset.uri) {
        throw new Error("Image picker failed to provide image URI");
      }

      // Validate that the file exists
      try {
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (!fileInfo.exists) {
          throw new Error("Selected image file not found at URI");
        }
      } catch (error) {
        console.error("Selected image validation failed:", error);
        throw new Error("Failed to validate selected image");
      }

      return {
        uri: asset.uri,
        base64: asset.base64 || undefined,
        width: asset.width,
        height: asset.height,
        cancelled: false,
      };
    } catch (error) {
      console.error("Error picking image:", error);
      throw new Error("Failed to pick image");
    }
  }

  static async convertImageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw new Error("Failed to convert image to base64");
    }
  }

  static createDataUrl(
    base64: string,
    mimeType: string = "image/jpeg",
  ): string {
    return `data:${mimeType};base64,${base64}`;
  }

  static async resizeImage(
    uri: string,
    maxWidth: number = 800,
    maxHeight: number = 600,
  ): Promise<string> {
    try {
      const manipulatedImage = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!manipulatedImage.canceled && manipulatedImage.assets?.[0]) {
        return manipulatedImage.assets[0].uri;
      }

      return uri;
    } catch (error) {
      console.error("Error resizing image:", error);
      return uri;
    }
  }
}

export default CameraService;
