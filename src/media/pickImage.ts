import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

// Cap on the longest edge (px). Downscaling to this keeps re-compressed JPEGs
// comfortably under the server's upload limit that was triggering HTTP 413.
const MAX_DIMENSION = 1280;
const COMPRESS_QUALITY = 0.7;

/**
 * Downscale (only if the longest edge exceeds MAX_DIMENSION) and re-compress a
 * picked image to JPEG so uploads stay small. Uses the SDK 57 contextual
 * ImageManipulator API. On any failure it falls back to the original uri so the
 * pick flow never crashes.
 *
 * `width`/`height` come from the picker asset and are used to cap the *longer*
 * edge while preserving aspect ratio (the library computes the other dimension
 * when only one is given).
 */
async function compressImage(
  uri: string,
  width?: number,
  height?: number,
): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(uri);
    const longestEdge = Math.max(width ?? 0, height ?? 0);
    // Only downscale when we know the source is larger than the cap. If the
    // dimensions are unknown, fall back to capping the width.
    if (longestEdge > MAX_DIMENSION) {
      if (width && height && height > width) {
        context.resize({ height: MAX_DIMENSION });
      } else {
        context.resize({ width: MAX_DIMENSION });
      }
    } else if (!width || !height) {
      context.resize({ width: MAX_DIMENSION });
    }
    const image = await context.renderAsync();
    const result = await image.saveAsync({
      compress: COMPRESS_QUALITY,
      format: SaveFormat.JPEG,
    });
    return result.uri;
  } catch {
    return uri;
  }
}

export async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission needed",
      "Allow photo library access to upload a profile photo.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Settings", onPress: () => void Linking.openSettings() },
      ],
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return compressImage(asset.uri, asset.width, asset.height);
}
