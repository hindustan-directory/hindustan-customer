import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

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
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}
